import type { VercelRequest, VercelResponse } from "@vercel/node";
import { increaseVisitors } from "../../lib/api/db/visitors";

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() === "POST") {
    try {
      res.status(200).send(await increaseVisitors({
        id: req.body.id,
        type: req.body.type,
        inc: req.body.inc
      }));
    } catch (e: any) {
      res.status(503).send(e.toString());
    }
  } else {
    res.status(405).send("Post only!");
  }
}
