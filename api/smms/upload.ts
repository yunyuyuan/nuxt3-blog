import { Form } from "multiparty";
import type { VercelRequest, VercelResponse } from "@vercel/node";
import upload from "../../lib/api/smms/upload";

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method?.toUpperCase() === "POST") {
    try {
      const form = new Form();
      const data = await new Promise<{fields: any, files: any}>((resolve, reject) => {
        form.parse(req, function (err, fields, files) {
          if (err) { reject(err); }
          resolve({ fields, files });
        });
      });
      const token = data.fields.token[0];
      const tinyPngToken = data.fields.tinyPngToken[0];
      const file = data.files.file[0];

      const response = await upload({ token, tinyPngToken, file });

      res.status(response.status).send(response.data);
    } catch (e: any) {
      res.status(503).send(e.toString());
    }
  } else {
    res.status(405).send("Post only!");
  }
}
