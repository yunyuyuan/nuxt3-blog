import type { VercelRequest, VercelResponse } from "@vercel/node";

// eslint-disable-next-line require-await
export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() === "POST") {
    res.send("Not yet!");
  } else {
    res.send("Post only!");
  }
}
