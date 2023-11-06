import { list } from "@vercel/blob";
import type { NextApiRequest, NextApiResponse } from "next";
import { getServerAuthSession } from "~/server/auth";

// export const config = {
//   runtime: "edge",
// };

export default async function blobs(
  request: NextApiRequest,
  response: NextApiResponse,
) {
  // Prefix property of the list method allows us to access blobs only in certain folders
  const { blobs } = await list();

  // Ensure the request is properly authenticated
  if (!(await getServerAuthSession({ req: request, res: response }))) {
    response
      .status(401)
      .json({ message: "You are not authorized to list images." });
    return;
  }

  response.json(blobs);
}
