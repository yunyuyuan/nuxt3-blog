import type { Plugin } from "vite";
import upload from "../lib/api/smms/upload";
import { uploadImageEvent } from "./types";

export default {
  name: "nb-img-upload-plugin",
  configureServer (server) {
    server.ws.on(uploadImageEvent, async (data: {
      token: string,
      tinyPngToken: string,
      file: string,
      filename: string
    }, client) => {
      try {
        const regex = /^data:.+\/(.+);base64,(.*)$/;

        const matches = data.file.match(regex);
        if (!matches) {
          throw new Error("formatting error");
        }
        const buffer = Buffer.from(matches[2], "base64");
        const ext = matches[1];
        const response = await upload({
          token: data.token,
          tinyPngToken: data.tinyPngToken,
          file: {
            path: buffer,
            originalFilename: `upload.${ext}`
          }
        });
        client.send(uploadImageEvent, { data: response.data });
      } catch (e: any) {
        client.send(uploadImageEvent, e.toString());
      }
    });
  }
} as Plugin;
