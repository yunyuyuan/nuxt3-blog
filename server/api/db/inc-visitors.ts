import { readBody, createError } from "h3";
import { increaseVisitors } from "../../../utils/api/db";

export default defineEventHandler(async (event) => {
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({
      statusCode: 405,
      data: "Post only!"
    });
  }
  try {
    const args = await readBody(event);
    return await increaseVisitors({
      id: args.id,
      type: args.type,
      inc: args.inc
    });
  } catch (e: any) {
    return createError({
      statusCode: 503,
      data: e.toString()
    });
  }
});
