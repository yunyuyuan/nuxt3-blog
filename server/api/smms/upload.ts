import { readMultipartFormData, createError } from "h3";
import { smmsUpload } from "../../../utils/api/smms";

export default defineEventHandler(async (event) => {
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({
      statusCode: 405,
      data: "Post only!"
    });
  }
  try {
    const form = await readMultipartFormData(event);
    const token = form!.find(i => i.name === "token")?.data.toString();
    const tinyPngToken = form!.find(i => i.name === "tinyPngToken")?.data.toString();
    const file = form!.find(i => i.name === "file");

    return await smmsUpload({ token, tinyPngToken, file });
  } catch (e: any) {
    return createError({
      statusCode: 503,
      data: e.toString()
    });
  }
});
