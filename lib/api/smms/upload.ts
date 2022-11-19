import fs from "fs";
import axios from "axios";
import FormData from "form-data";
import tinify from "tinify";

export default async function (
  { token, tinyPngToken, file }:
  {token: string, tinyPngToken: string, file: any}
) {
  const isBuffer = file.path instanceof Buffer;

  const formData = new FormData();
  let fp: any;
  let size: number;
  if (isBuffer) {
    fp = file.path;
    size = Buffer.byteLength(fp);
  } else {
    fp = fs.createReadStream(file.path);
    size = fp.size;
  }
  // tinypng
  if (tinyPngToken) {
    tinify.key = tinyPngToken;
    try {
      const source = isBuffer ? tinify.fromBuffer(file.path) : tinify.fromFile(file.path);
      const buffer = await source.toBuffer();
      fp = buffer;
      size = Buffer.byteLength(buffer);
    } catch (e: any) {
      throw new Error(`Error from tinypng: ${e.toString()}`);
    }
  }

  formData.append("smfile", fp, {
    knownLength: size,
    filepath: isBuffer ? file.originalFilename : file.path,
    filename: file.originalFilename
  });
  const len = await new Promise<number>((resolve, reject) => {
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
  return response;
}
