import type {
  ListBlobResultBlob,
  PutBlobResult,
} from "@vercel/blob";
import { useState, useRef } from "react";
import { Button } from "~/components/ui/button";
import { getBaseUrl } from "~/utils/api";
import { parsePlanetImagePropertiesFromFilename } from "~/utils/utils";

// TODO: IMPLEMENT PLANET IMAGES IN DB

export default function AvatarUploadPage() {
  const inputFileRef = useRef<HTMLInputElement>(null);
  const [blob, setBlob] = useState<PutBlobResult[] | null>(null);

  // Handle file uploads
  async function submitUpload() {
    if (!inputFileRef.current?.files) {
      throw new Error("No file selected");
    }

    for (const file of inputFileRef.current.files) {
      console.log(`Sending request to upload file ${file.name}`);

      // Parse the image properties in the file name
      const parsedImageProperties = parsePlanetImagePropertiesFromFilename(
        file.name,
      );

      if (!parsedImageProperties) {
        console.log(`Failed to parse image properties from file ${file.name}`);
        continue;
      }

      console.log(parsedImageProperties);

      const response = await fetch(
        `/api/planet-images/upload?filename=${file?.name}&planetImageProperties=${JSON.stringify(
          parsedImageProperties,
        )}`,
        {
          method: "POST",
          body: file,
          headers: { "Content-Type": "application/json" },
        },
      );

      // Update state with the newly uploaded blob
      const newBlob = (await response.json()) as PutBlobResult;
      setBlob((past) => [...(past ?? []), newBlob]);
    }
  }

  return (
    <>
      <h1 className="pt-24">Upload Your Avatar</h1>

      <form
        onSubmit={(event) => {
          event.preventDefault();

          void submitUpload();
        }}
      >
        <input name="file" ref={inputFileRef} type="file" required multiple />
        <button type="submit">Upload</button>
      </form>
      {blob && (
        <div>
          Blob urls:{" "}
          {blob.map((b) => (
            <div
              className="flex flex-col gap-2 rounded-lg bg-pbdark-800 p-2 text-white"
              key={b.url}
            >
              <h1>Uploaded file {b.url}</h1>
              <h1>Pathname {b.url}</h1>
            </div>
          ))}
        </div>
      )}
      <Button
        onClick={() => {
          const req = fetch(`${getBaseUrl()}/api/planet-images/list`, {
            method: "GET",
            headers: {
              "Content-Type": "application/json",
            },
          }).then(async (res) => {
            ((await res.json()) as ListBlobResultBlob[]).forEach((b) => {
              console.log(b.url);
            });
          });
        }}
      >
        List
      </Button>
    </>
  );
}
