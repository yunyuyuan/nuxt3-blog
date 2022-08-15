import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import multiparty from "multiparty";
import type { VercelRequest, VercelResponse } from "@vercel/node";

export default async function (req: VercelRequest, res: VercelResponse) {
  if (req.method.toUpperCase() === "POST") {
    try {
      const form = new multiparty.Form();
      const data = await new Promise<{fields, files}>((resolve, reject) => {
        form.parse(req, function (err, fields, files) {
          if (err) { reject(err); }
          resolve({ fields, files });
        });
      });
      const token = data.fields.token[0];
      const file = data.files.file[0];
      const formData = new FormData();

      formData.append("smfile", fs.createReadStream(file.path), {
        knownLength: file.size,
        filepath: file.path,
        filename: file.originalFilename
      });
      const len = await new Promise((resolve, reject) => {
        formData.getLength((err, len) => {
          if (err) {
            reject(err);
            return;
          }
          resolve(len);
        });
      });
      const response = await axios({
        url: "https://sm.ms/api/v2/upload",
        method: "post",
        headers: {
          Authorization: token,
          "Content-Length": len.toString(),
          "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`
        },
        data: formData
      });
      res.status(response.status).send(response.data);
    } catch (e) {
      res.status(503).send(e.toString());
    }
  } else {
    res.status(405).send("Post only!");
  }
}
