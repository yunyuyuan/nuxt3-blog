import https from "https";
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
  const response = await uploadFile({
    headers: {
      Authorization: token,
      "Content-Length": len.toString(),
      "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`
    },
    formData
  });
  // XXX why $fetch cannot update FormData?
  // const response = await $fetch("https://sm.ms/api/v2/upload", {
  //   method: "POST",
  //   headers: {
  //     Authorization: token,
  //     "Content-Length": len.toString(),
  //     "Content-Type": `multipart/form-data; boundary=${formData.getBoundary()}`
  //   },
  //   body: formData
  // });
  return response;
}

function uploadFile ({ headers, formData }: {
  headers: any,
  formData: any,
}) {
  const url = "https://sm.ms/api/v2/upload";

  const options = {
    method: "POST",
    headers
  };

  return new Promise<any>((resolve, reject) => {
    const req = https.request(url, options, (res) => {
      let responseData = "";

      res.on("data", (chunk) => {
        responseData += chunk;
      });

      res.on("end", () => {
        if (res.statusCode === 200) {
          resolve(JSON.parse(responseData));
        } else {
          reject(responseData);
        }
      });
    });

    req.on("error", (error) => {
      reject(error.message);
    });

    formData.pipe(req);
  });
}
