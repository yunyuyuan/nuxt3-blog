import { readMultipartFormData, createError } from "h3";
import { r2Upload } from "../../../app/utils/api/r2";

export default defineEventHandler(async (event) => {
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({
      statusCode: 405,
      data: "Post only!"
    });
  }
  try {
    const form = await readMultipartFormData(event);
    const secretAccessKey = form!.find(i => i.name === "secretAccessKey")?.data.toString();
    const tinyPngToken = form!.find(i => i.name === "tinyPngToken")?.data.toString();
    const file = form!.find(i => i.name === "file");

    if (!file || !file.data) {
      throw new Error("No file provided");
    }

    return await r2Upload({
      secretAccessKey,
      tinyPngToken,
      file: {
        data: file.data,
        filename: file.filename,
        type: file.type
      }
    });
  } catch (e: any) {
    return createError({
      statusCode: 503,
      data: e.toString()
    });
  }
});
