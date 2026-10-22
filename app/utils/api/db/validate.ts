import { HeaderTabs, type HeaderTabUrl } from "../../common/types";

/** 构建期生成的各栏目条目 id，见 nuxt.config.ts 的 runtimeConfig.nbItemIds */
export type ItemIds = Partial<Record<string, number[]>>;

function asRecord(body: unknown): Record<string, unknown> {
  return body && typeof body === "object" ? body as Record<string, unknown> : {};
}

function parseType(type: unknown): HeaderTabUrl {
  if (typeof type !== "string" || !(HeaderTabs as readonly string[]).includes(type)) {
    throw new Error(`Invalid type, expected one of ${HeaderTabs.join(", ")}`);
  }
  return type as HeaderTabUrl;
}

export function parseGetVisitorsBody(body: unknown) {
  return { type: parseType(asRecord(body).type) };
}

/** 只接受构建时存在的条目，避免任意 id 在表中插入新行 */
export function parseIncVisitorsBody(body: unknown, ids: ItemIds) {
  const b = asRecord(body);
  const type = parseType(b.type);
  const id = Number(b.id);
  if (!Number.isSafeInteger(id) || id <= 0 || !ids[type]?.includes(id)) {
    throw new Error("Unknown item");
  }
  return { type, id, inc: b.inc === true };
}

/** 同一浏览器在这段时间内重复访问只计一次 */
export const VisitDedupSeconds = 30 * 60;

export function visitCookieName(type: HeaderTabUrl, id: number) {
  return `nbv_${type.slice(1)}_${id}`;
}
