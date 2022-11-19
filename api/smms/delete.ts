import axios from "axios";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() === "POST") {
    try {
      const response = await axios({
        url: `https://sm.ms/api/v2/delete/${req.body.hash}`,
        method: "get",
        headers: {
          Authorization: req.body.token
        }
      });
      res.send(response.data);
    } catch (e: any) {
      res.send(e.response.data);
    }
  } else {
    res.send("Post only!");
  }
}
