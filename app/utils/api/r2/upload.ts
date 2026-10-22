import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import tinify from "tinify";
import { getNowDayjs } from "~/utils/common/dayjs";

/** 允许上传的 MIME 类型前缀 */
export const R2AllowedTypes = ["image/", "video/", "audio/"];

export type R2Config = ReturnType<typeof getR2Config>;

/**
 * 每次请求时读取环境变量，Docker 等在运行时注入变量的部署也能生效。
 * 设置了 CLOUDFLARE_R2_SECRET_ACCESS_KEY 时，密钥只存在服务端，调用者用 GitHub token 证明身份；
 * 未设置时沿用旧方式，由浏览器在表单中提交密钥。
 */
export function getR2Config(env: Record<string, string | undefined> = process.env) {
  const accountId = env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const bucket = env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = env.CLOUDFLARE_R2_PUBLIC_URL;
  const maxMB = Number(env.CLOUDFLARE_R2_MAX_UPLOAD_MB) || 20;
  return {
    enabled: !!(accountId && accessKeyId && bucket && publicUrl),
    accountId: accountId || "",
    accessKeyId: accessKeyId || "",
    bucket: bucket || "",
    publicUrl: publicUrl || "",
    serverSecret: env.CLOUDFLARE_R2_SECRET_ACCESS_KEY || "",
    maxBytes: maxMB * 1024 * 1024
  };
}

/** 可以直接返回给调用者的错误 */
export class UploadError extends Error {
  constructor(public statusCode: number, message: string) {
    super(message);
  }
}

export function validateUpload(file: { data?: Uint8Array; type?: string } | undefined, maxBytes: number) {
  if (!file?.data?.length) {
    throw new UploadError(400, "No file provided");
  }
  if (!R2AllowedTypes.some(t => file.type?.startsWith(t))) {
    throw new UploadError(415, `File type "${file.type || "unknown"}" is not allowed, only images, videos and audio`);
  }
  if (file.data.length > maxBytes) {
    throw new UploadError(413, `File is larger than ${maxBytes / 1024 / 1024} MB`);
  }
}

export async function r2Upload(
  { secretAccessKey, tinyPngToken, file }:
  { secretAccessKey: string; tinyPngToken?: string; file: { data: Buffer; filename?: string; type?: string } },
  cfg: R2Config = getR2Config()
) {
  if (!cfg.enabled) {
    throw new UploadError(501, "R2 environment variables not configured");
  }

  let buffer: Buffer | Uint8Array = file.data;

  // tinypng (images only)
  if (tinyPngToken && file.type?.startsWith("image")) {
    tinify.key = tinyPngToken;
    try {
      const source = tinify.fromBuffer(buffer);
      buffer = await source.toBuffer();
    } catch (e: any) {
      throw new Error(`Error from tinypng: ${e.toString()}`);
    }
  }

  const ext = extractExtension(file.filename, file.type);
  const date = getNowDayjs().format("YYYY-MM-DD");
  const randomSuffix = crypto.randomBytes(4).toString("hex");
  const key = `${date}-${randomSuffix}${ext}`;

  let client: S3Client;
  try {
    client = new S3Client({
      region: "auto",
      endpoint: `https://${cfg.accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId: cfg.accessKeyId,
        secretAccessKey
      }
    });
  } catch (e: any) {
    throw new Error(`Failed to create S3Client: ${e.message ?? e}`);
  }

  try {
    await client.send(new PutObjectCommand({
      Bucket: cfg.bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream"
    }));
  } catch (e: any) {
    throw new Error(`Failed to upload "${key}" to bucket "${cfg.bucket}": ${e.message ?? e}`);
  }

  const url = `${cfg.publicUrl.replace(/\/$/, "")}/${key}`;
  return { success: true, url };
}

function extractExtension(filename?: string, mimeType?: string): string {
  if (filename) {
    const dotIndex = filename.lastIndexOf(".");
    if (dotIndex !== -1) {
      return filename.substring(dotIndex);
    }
  }
  const mimeMap: Record<string, string> = {
    "image/png": ".png",
    "image/jpeg": ".jpg",
    "image/gif": ".gif",
    "image/webp": ".webp",
    "image/svg+xml": ".svg",
    "image/bmp": ".bmp",
    "video/mp4": ".mp4",
    "video/webm": ".webm",
    "video/ogg": ".ogv",
    "video/quicktime": ".mov",
    "video/x-matroska": ".mkv",
    "audio/mpeg": ".mp3",
    "audio/ogg": ".ogg",
    "audio/wav": ".wav",
    "audio/flac": ".flac"
  };
  return mimeType ? (mimeMap[mimeType] || ".bin") : ".bin";
}
