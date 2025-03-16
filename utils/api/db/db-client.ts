import Cloudflare from "cloudflare";

export const cloudflareClient = new Cloudflare({
  apiToken: process.env.CLOUDFLARE_D1_TOKEN
});
