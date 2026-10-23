import { readMultipartFormData, createError, getHeader } from "h3";
import { getR2Config, r2Upload, validateUpload, UploadError } from "../../../app/utils/api/r2";
import { hasRepoPushAccess } from "../../../app/utils/api/github-auth";

export default defineEventHandler(async (event) => {
  const cfg = getR2Config();
  try {
    if (!cfg.enabled) {
      throw new UploadError(501, "R2 environment variables not configured");
    }
    // 先看请求头，避免把明显超限的请求体读进内存
    const length = Number(getHeader(event, "content-length") || 0);
    if (length > cfg.maxBytes + 1024 * 1024) {
      throw new UploadError(413, `File is larger than ${cfg.maxBytes / 1024 / 1024} MB`);
    }
    let secretAccessKey = "";
    if (cfg.serverSecret) {
      // 服务端持有密钥：调用者必须用 GitHub token 证明对博客仓库有写权限，表单中的密钥一律忽略
      const token = getHeader(event, "authorization")?.replace(/^Bearer\s+/i, "");
      if (!await hasRepoPushAccess(token)) {
        throw new UploadError(401, "GitHub token is missing or has no push access to the blog repository");
      }
      secretAccessKey = cfg.serverSecret;
    }
    const form = (await readMultipartFormData(event)) ?? [];
    const field = (name: string) => form.find(i => i.name === name);
    if (!secretAccessKey) {
      // 旧方式：密钥由浏览器提交，密钥本身就是凭证
      secretAccessKey = field("secretAccessKey")?.data.toString() || "";
      if (!secretAccessKey) {
        throw new UploadError(401, "R2 Secret Access Key is required");
      }
    }
    const file = field("file");
    validateUpload(file, cfg.maxBytes);
    return await r2Upload({
      secretAccessKey,
      tinyPngToken: field("tinyPngToken")?.data.toString(),
      file: {
        data: file!.data,
        filename: file!.filename,
        type: file!.type
      }
    }, cfg);
  } catch (e: any) {
    if (e instanceof UploadError) {
      throw createError({ statusCode: e.statusCode, message: e.message });
    }
    console.error("[r2-upload]", e);
    // tinypng 或 R2 返回的错误，调用者已通过凭证检查，返回原因便于排查
    throw createError({ statusCode: 502, message: String(e?.message ?? e) });
  }
});
