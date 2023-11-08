import type { NextApiRequest, NextApiResponse } from "next";
import { env } from "~/env.mjs";
import { XMLParser } from "fast-xml-parser";
import { db } from "~/server/db";
import { parsePlanetImagePropertiesFromFilename } from "~/utils/utils";
import { type PlanetImage } from "@prisma/client";
import { planetImagePropertiesSchema } from "~/utils/schemas";

export default async function blobs(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  // We only want this to be run as a cron job, not a normal api endpoint
  // Ensure the request has the proper secret in the authorization header
  if (request.headers.authorization !== `Bearer ${env.CRON_SECRET}`) {
    response.status(401).end("Unauthorized");
    return;
  }

  // Request load balancer front end (which points to our cdn)
  const lbResponse = await fetch(env.NEXT_PUBLIC_LB_FRONTEND_URL, {
    method: "GET",
    headers: {
      "Content-Type": "application/xml",
    },
  });

  // Create an XML parser to parse the data received from lb
  const parser = new XMLParser();

  try {
    // Parse the xml data
    // The type definition here matches the response of the lb
    // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
    const parsedXML: {
      ListBucketResult: {
        Name: string;
        Contents: {
          Key: string;
          Generation: number;
          MetaGeneration: number;
          LastModified: string;
          ETag: string;
          size: number;
        }[];
      };
    } = parser.parse(await lbResponse.text());

    // Insert contents of retrieved and parsed image metadata into array
    // Omit the id here as we'll generate it in the db anyway
    const planetImageMetadatas: Omit<PlanetImage, "id">[] = [];

    // Parse out the properties of the image from the path name inside of the xml
    parsedXML.ListBucketResult.Contents.forEach((content) => {
      // Parse and validate image properties
      const parsedImageProperties = planetImagePropertiesSchema.parse(
        parsePlanetImagePropertiesFromFilename(content.Key),
      );

      console.log(
        "Parsed image data from CDN",
        parsedImageProperties,
        `from ${content.Key}`,
      );

      planetImageMetadatas.push({
        bucketPath: content.Key,
        eTag: content.ETag.replaceAll('"', ""),
        quality: parsedImageProperties?.planetQuality,
        temperature: parsedImageProperties?.planetTemperature,
        terrain: parsedImageProperties?.planetTerrain,
      });
    });

    // Create planetImage records in the database
    // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
    await db.planetImage.createMany({
      data: planetImageMetadatas,
      skipDuplicates: true,
    });

    console.log(planetImageMetadatas);
  } catch (err) {
    console.error(
      "An error occured while parsing the XML data retrieved from the planetbuy cdn.",
      err,
    );
  }

  response.json(blobs);
}
