import { describe, expect, it } from "vitest";
import { getR2Config, UploadError, validateUpload } from "./upload";

const env = {
  CLOUDFLARE_R2_ACCOUNT_ID: "acc",
  CLOUDFLARE_R2_ACCESS_KEY_ID: "key-id",
  CLOUDFLARE_R2_BUCKET_NAME: "bucket",
  CLOUDFLARE_R2_PUBLIC_URL: "https://cdn.example.com"
};

describe("getR2Config", () => {
  it("is enabled only when the four R2 variables are set", () => {
    expect(getR2Config(env).enabled).toBe(true);
    expect(getR2Config({ ...env, CLOUDFLARE_R2_ACCOUNT_ID: "" }).enabled).toBe(false);
    // 旧的构建期开关检查的是 D1 的 account id，这里不再依赖它
    expect(getR2Config({ ...env, CLOUDFLARE_D1_ACCOUNT_ID: undefined }).enabled).toBe(true);
  });

  it("reads the server secret and the size limit", () => {
    expect(getR2Config(env).serverSecret).toBe("");
    expect(getR2Config(env).maxBytes).toBe(20 * 1024 * 1024);
    const cfg = getR2Config({ ...env, CLOUDFLARE_R2_SECRET_ACCESS_KEY: "s", CLOUDFLARE_R2_MAX_UPLOAD_MB: "5" });
    expect(cfg.serverSecret).toBe("s");
    expect(cfg.maxBytes).toBe(5 * 1024 * 1024);
  });
});

describe("validateUpload", () => {
  const status = (fn: () => void) => {
    try {
      fn();
    } catch (e) {
      return e instanceof UploadError ? e.statusCode : -1;
    }
    return 0;
  };

  it("accepts images, videos and audio within the limit", () => {
    for (const type of ["image/png", "video/mp4", "audio/mpeg"]) {
      expect(status(() => validateUpload({ data: new Uint8Array(10), type }, 100))).toBe(0);
    }
  });

  it("rejects empty files, other types and large files", () => {
    expect(status(() => validateUpload(undefined, 100))).toBe(400);
    expect(status(() => validateUpload({ data: new Uint8Array(0), type: "image/png" }, 100))).toBe(400);
    expect(status(() => validateUpload({ data: new Uint8Array(10), type: "text/html" }, 100))).toBe(415);
    expect(status(() => validateUpload({ data: new Uint8Array(10) }, 100))).toBe(415);
    expect(status(() => validateUpload({ data: new Uint8Array(101), type: "image/png" }, 100))).toBe(413);
  });
});
