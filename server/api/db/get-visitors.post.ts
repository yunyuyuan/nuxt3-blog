import { readValidatedBody, createError } from "h3";
import { getVisitors, parseGetVisitorsBody } from "../../../app/utils/api/db";

export default defineEventHandler(async (event) => {
  // 校验失败时 h3 返回 400
  const { type } = await readValidatedBody(event, parseGetVisitorsBody);
  try {
    return await getVisitors(type);
  } catch (e: any) {
    console.error("[get-visitors]", e);
    throw createError({
      statusCode: 503,
      data: "Internal server error"
    });
  }
});
