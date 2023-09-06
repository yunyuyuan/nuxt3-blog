import axios from "axios";
import FormData from "form-data";
import tinify from "tinify";

export async function smmsUpload (
  { token, tinyPngToken, file }:
  {token?: string, tinyPngToken?: string, file: any}
) {
  if (!token) {
    throw new Error("Need token");
  }

  let buffer = file.data;
  let size = Buffer.byteLength(buffer);
  // tinypng
  if (tinyPngToken) {
    tinify.key = tinyPngToken;
    try {
      const source = tinify.fromBuffer(buffer);
      buffer = await source.toBuffer();
      size = Buffer.byteLength(buffer);
    } catch (e: any) {
      throw new Error(`Error from tinypng: ${e.toString()}`);
    }
  }

  const formData = new FormData();
  const filename = Date.now().toString();
  formData.append("smfile", buffer, {
    knownLength: size,
    filepath: filename,
    filename
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
