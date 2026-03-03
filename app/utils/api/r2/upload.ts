import crypto from "crypto";
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import tinify from "tinify";
import { getNowDayjs } from "~/utils/common/dayjs";

export async function r2Upload(
  { secretAccessKey, tinyPngToken, file }:
  { secretAccessKey?: string; tinyPngToken?: string; file: { data: Buffer; filename?: string; type?: string } }
) {
  if (!secretAccessKey) {
    throw new Error("R2 Secret Access Key is required");
  }

  const accountId = process.env.CLOUDFLARE_R2_ACCOUNT_ID;
  const accessKeyId = process.env.CLOUDFLARE_R2_ACCESS_KEY_ID;
  const bucket = process.env.CLOUDFLARE_R2_BUCKET_NAME;
  const publicUrl = process.env.CLOUDFLARE_R2_PUBLIC_URL;

  if (!accountId || !accessKeyId || !bucket || !publicUrl) {
    throw new Error("R2 environment variables not configured");
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
      endpoint: `https://${accountId}.r2.cloudflarestorage.com`,
      credentials: {
        accessKeyId,
        secretAccessKey
      }
    });
  } catch (e: any) {
    throw new Error(`Failed to create S3Client: ${e.message ?? e}`);
  }

  try {
    await client.send(new PutObjectCommand({
      Bucket: bucket,
      Key: key,
      Body: buffer,
      ContentType: file.type || "application/octet-stream"
    }));
  } catch (e: any) {
    throw new Error(`Failed to upload "${key}" to bucket "${bucket}": ${e.message ?? e}`);
  }

  const url = `${publicUrl.replace(/\/$/, "")}/${key}`;
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
    "video/x-matroska": ".mkv"
  };
  return mimeType ? (mimeMap[mimeType] || ".bin") : ".bin";
}
