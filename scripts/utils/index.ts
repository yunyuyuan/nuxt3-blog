import fs from "fs";
import cmd from "child_process";
import path from "path";
import colors from "colors";
import type { PromptObject } from "prompts";
import prompts from "prompts";
import type { CommonItem, HeaderTabUrl } from "../../utils/common/types";
import { escapeNewLine } from "../../utils/common/utils";

export async function promptTask<const T extends PromptObject & { name: string }>(params: T[], cb: (_: Record<T["name"], any>) => any | Promise<any>) {
  let canceled = false;
  const response = await prompts(params, {
    onCancel: () => {
      console.log(colors.red("Program canceled"));
      canceled = true;
    }
  }) as any;

  if (!canceled) {
    await cb(response);
  }
}

export function getAbsolutePath(...s: string[]) {
  return path.join(__dirname, "..", "..", ...s);
}

export function getRebuildPath(...s: string[]) {
  return getAbsolutePath("public", "rebuild", ...s);
}

export function walkAllBlogData() {
  const walk = (type: HeaderTabUrl) => {
    const jsonPath = getRebuildPath("json", type + ".json");
    const itemList: (CommonItem & { _md: string; _mdPath: string })[] = JSON.parse(fs.readFileSync(jsonPath).toString());
    for (const item of itemList) {
      const mdPath = getRebuildPath(type, String(item.id) + ".md");
      item._mdPath = mdPath;
      item._md = escapeNewLine(fs.readFileSync(mdPath).toString());
    }
    return { type, jsonPath, list: itemList };
  };

  return ["/articles", "/records", "/knowledges"].map(walk);
}

export async function runCmd(command: string) {
  return await new Promise<void>((resolve, reject) => {
    cmd.exec(command, {
      maxBuffer: 1024 * 1024 * 5
    }, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    }).stdout?.pipe(process.stdout);
  });
}

export function nbLog(s: string, head = "generate") {
  console.log(`[${colors.blue.bold(head)}] ${colors.green(s)}`);
}

export type ImgMap = Record<string, {
  newUrl: string;
  appearIn: string[];
}>;

export * from "./encrypt";
export * from "./rss";
