import { readValidatedBody, createError, getCookie, setCookie } from "h3";
import { increaseVisitors, parseIncVisitorsBody, visitCookieName, VisitDedupSeconds } from "../../../app/utils/api/db";

export default defineEventHandler(async (event) => {
  const runtimeConfig = useRuntimeConfig(event);
  const ids = runtimeConfig.nbItemIds as Record<string, number[]>;
  // 校验失败时 h3 返回 400
  const { id, type, inc } = await readValidatedBody(event, body => parseIncVisitorsBody(body, ids));
  // 是否计数仍由客户端决定（作者本人访问可以不计），但同一浏览器短时间内重复访问只计一次
  const cookieName = visitCookieName(type, id);
  const shouldInc = inc && !getCookie(event, cookieName);
  try {
    const visitors = await increaseVisitors({ id, type, inc: shouldInc });
    if (shouldInc) {
      // 只在这个接口上携带，不增加其他请求的体积
      const path = `${runtimeConfig.app.baseURL.replace(/\/$/, "")}/api/db/inc-visitors`;
      setCookie(event, cookieName, "1", { maxAge: VisitDedupSeconds, httpOnly: true, sameSite: "lax", path });
    }
    return visitors;
  } catch (e: any) {
    console.error("[inc-visitors]", e);
    throw createError({
      statusCode: 503,
      data: "Internal server error"
    });
  }
});
