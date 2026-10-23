import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { clearGithubAuthCache, hasRepoPushAccess } from "./github-auth";
import config from "~~/config";

const respond = (status: number, body: unknown) =>
  Promise.resolve(new Response(JSON.stringify(body), { status, headers: { "content-type": "application/json" } }));

describe("hasRepoPushAccess", () => {
  const fetchMock = vi.fn();

  beforeEach(() => {
    clearGithubAuthCache();
    fetchMock.mockReset();
    vi.stubGlobal("fetch", fetchMock);
  });
  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("asks GitHub about the blog repository with the token", async () => {
    fetchMock.mockReturnValue(respond(200, { permissions: { push: true } }));
    expect(await hasRepoPushAccess("tok")).toBe(true);
    const [url, init] = fetchMock.mock.calls[0]!;
    expect(url).toBe(`https://api.github.com/repos/${config.githubName}/${config.githubRepo}`);
    expect(init.headers.Authorization).toBe("Bearer tok");
  });

  it("rejects a missing token, an invalid token and a token without push access", async () => {
    expect(await hasRepoPushAccess(undefined)).toBe(false);
    expect(fetchMock).not.toHaveBeenCalled();
    fetchMock.mockReturnValueOnce(respond(401, { message: "Bad credentials" }));
    expect(await hasRepoPushAccess("bad")).toBe(false);
    fetchMock.mockReturnValueOnce(respond(200, { permissions: { push: false, pull: true } }));
    expect(await hasRepoPushAccess("reader")).toBe(false);
    fetchMock.mockReturnValueOnce(respond(200, {}));
    expect(await hasRepoPushAccess("anonymous-view")).toBe(false);
  });

  it("caches only successful checks", async () => {
    fetchMock.mockReturnValueOnce(respond(200, { permissions: { push: false } }));
    expect(await hasRepoPushAccess("tok")).toBe(false);
    fetchMock.mockReturnValueOnce(respond(200, { permissions: { push: true } }));
    expect(await hasRepoPushAccess("tok")).toBe(true);
    expect(await hasRepoPushAccess("tok")).toBe(true);
    expect(fetchMock).toHaveBeenCalledTimes(2);
  });
});
