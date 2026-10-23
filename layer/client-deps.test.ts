// @vitest-environment node
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { describe, expect, it } from "vitest";
import { clientDeps, notPrebundled } from "./client-deps";

const layerDir = path.dirname(fileURLToPath(import.meta.url));

function listSourceFiles(dir: string): string[] {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((entry) => {
    const file = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      return listSourceFiles(file);
    }
    return /\.(ts|tsx|vue)$/.test(entry.name) && !/\.test\./.test(entry.name) ? [file] : [];
  });
}

/** app/ 中的第三方导入：静态导入、动态导入和 re-export，不含只导入类型的语句 */
function collectAppImports() {
  const found = new Set<string>();
  for (const file of listSourceFiles(path.join(layerDir, "app"))) {
    const code = fs.readFileSync(file, "utf8").replace(/import\s+type\s[^;]*?from\s*["'][^"']+["']/g, "");
    for (const match of code.matchAll(/(?:\bfrom\s*|\bimport\s*\(\s*|\bimport\s+)["']([^"']+)["']/g)) {
      const specifier = match[1]!;
      if (!/^[.#~/]/.test(specifier)) {
        found.add(specifier);
      }
    }
  }
  return found;
}

/** nuxt.config.ts 中 imports.presets 自动导入的包 */
function collectPresetImports() {
  const config = fs.readFileSync(path.join(layerDir, "nuxt.config.ts"), "utf8");
  return [...config.matchAll(/\bfrom:\s*"([^"]+)"/g)].map(m => m[1]!);
}

describe("client-deps", () => {
  const appImports = collectAppImports();
  const used = new Set([...appImports, ...collectPresetImports()]);

  it("lists every third-party import of app/", () => {
    const listed = new Set([...clientDeps, ...notPrebundled]);
    expect([...appImports].filter(d => !listed.has(d)).sort()).toEqual([]);
  });

  it("has no unused entries", () => {
    expect([...clientDeps, ...notPrebundled].filter(d => !used.has(d))).toEqual([]);
  });

  it("does not list a dependency in both lists", () => {
    expect(clientDeps.filter(d => notPrebundled.includes(d))).toEqual([]);
  });
});
