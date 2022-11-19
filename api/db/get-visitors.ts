import type { VercelRequest, VercelResponse } from "@vercel/node";
import { getVisitors } from "../../lib/api/db/visitors";

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() === "POST") {
    try {
      res.status(200).send(await getVisitors(req.body.type));
    } catch (e: any) {
      res.status(503).send(e.toString());
    }
  } else {
    res.status(405).send("Post only!");
  }
}
