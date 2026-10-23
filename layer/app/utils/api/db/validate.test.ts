import { describe, expect, it } from "vitest";
import { parseGetVisitorsBody, parseIncVisitorsBody, visitCookieName } from "./validate";

const ids = { "/articles": [11, 12], "/records": [21] };

describe("parseGetVisitorsBody", () => {
  it("accepts the three tabs only", () => {
    expect(parseGetVisitorsBody({ type: "/articles" })).toEqual({ type: "/articles" });
    expect(() => parseGetVisitorsBody({ type: "/manage" })).toThrow();
    expect(() => parseGetVisitorsBody({})).toThrow();
    expect(() => parseGetVisitorsBody(null)).toThrow();
  });
});

describe("parseIncVisitorsBody", () => {
  it("accepts items that exist in the build", () => {
    expect(parseIncVisitorsBody({ type: "/articles", id: 11, inc: true }, ids)).toEqual({ type: "/articles", id: 11, inc: true });
    expect(parseIncVisitorsBody({ type: "/records", id: "21" }, ids)).toEqual({ type: "/records", id: 21, inc: false });
  });

  it("rejects unknown items, wrong tabs and bad ids", () => {
    expect(() => parseIncVisitorsBody({ type: "/articles", id: 99 }, ids)).toThrow("Unknown item");
    expect(() => parseIncVisitorsBody({ type: "/records", id: 11 }, ids)).toThrow("Unknown item");
    expect(() => parseIncVisitorsBody({ type: "/knowledges", id: 11 }, ids)).toThrow("Unknown item");
    expect(() => parseIncVisitorsBody({ type: "/articles", id: "11; DROP" }, ids)).toThrow("Unknown item");
    expect(() => parseIncVisitorsBody({ type: "articles", id: 11 }, ids)).toThrow("Invalid type");
  });

  it("only counts when inc is exactly true", () => {
    expect(parseIncVisitorsBody({ type: "/articles", id: 11, inc: "true" }, ids).inc).toBe(false);
  });
});

describe("visitCookieName", () => {
  it("is a valid cookie name per item", () => {
    expect(visitCookieName("/articles", 11)).toBe("nbv_articles_11");
  });
});
