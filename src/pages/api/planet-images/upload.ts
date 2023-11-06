import { put } from "@vercel/blob";
import type { NextApiRequest, NextApiResponse, PageConfig } from "next";
import { env } from "~/env.mjs";
import { getServerAuthSession } from "~/server/auth";
import { getBaseUrl } from "~/utils/api";
import { planetImagePropertiesSchema } from "~/utils/schemas";

export default async function handler(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  // Only allow uploads in dev
  if (env.NODE_ENV === "production" || env.NODE_ENV === "test") {
    response
      .status(401)
      .json({ message: "Not allowed to upload images in prod." });
  }

  // Ensure the request is properly authenticated
  if (!(await getServerAuthSession({ req: request, res: response }))) {
    response
      .status(401)
      .json({ message: "You are not authorized to upload images." });
    return;
  }

  // Parse image params from url
  const { searchParams } = new URL(`${getBaseUrl()}${request.url}`);
  const filename = searchParams.get("filename");
  const planetImageProperties = await planetImagePropertiesSchema.parseAsync(
    JSON.parse(searchParams.get("planetImageProperties") ?? "{}"),
  );

  // Send the blob upload request
  const blob = await put(
    `${planetImageProperties.planetTemperature}/${planetImageProperties.planetTerrain}/${filename}`,
    request,
    { access: "public" },
  );

  console.log(blob, "Response");
  response.status(200).json(blob);
}

export const config: PageConfig = {
  api: { bodyParser: false },
};
