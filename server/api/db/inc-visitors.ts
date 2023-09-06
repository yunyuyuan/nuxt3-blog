import { readBody, createError } from "h3";
import { increaseVisitorsREST, increaseVisitors } from "../../../utils/api";

export default defineEventHandler(async (event) => {
  if (event.node.req.method?.toUpperCase() !== "POST") {
    throw createError({
      statusCode: 405,
      data: "Post only!"
    });
  }
  try {
    const args = await readBody(event);
    return await (process.env.NITRO_PRESET === "node-server" ? increaseVisitors : increaseVisitorsREST)({
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
