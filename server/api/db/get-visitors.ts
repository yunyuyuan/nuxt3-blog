import { readBody, createError } from "h3";
import { getVisitors } from "../../../utils/api/db";

export default defineEventHandler(async (event) => {
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({
      statusCode: 405,
      data: "Post only!"
    });
  }

  try {
    const args = await readBody(event);
    return await getVisitors(args.type);
  } catch (e: any) {
    return createError({
      statusCode: 503,
      data: e.toString()
    });
  }
});
