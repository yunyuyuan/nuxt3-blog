// Checks that the Vite dev server of a site pre-bundles every dependency in
// nuxt3-blog/client-deps.ts. If one is missing, the browser fails to load the
// CommonJS dependencies of the layer in development mode when the layer is
// installed from npm (see client-deps.ts).
//
// Run it in the site directory while `nuxt dev` is running.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";

const siteRequire = createRequire(path.join(process.cwd(), "package.json"));
const { createJiti } = siteRequire("jiti");
const layerDir = path.dirname(siteRequire.resolve("nuxt3-blog/package.json"));
const { clientDeps } = await createJiti(import.meta.url).import(path.join(layerDir, "client-deps.ts"));

const metadataFile = path.join(process.cwd(), "node_modules/.cache/vite/client/deps/_metadata.json");
const deadline = Date.now() + 180_000;
let missing = clientDeps;
while (Date.now() < deadline) {
  if (fs.existsSync(metadataFile)) {
    const optimized = Object.keys(JSON.parse(fs.readFileSync(metadataFile, "utf8")).optimized);
    missing = clientDeps.filter(dep => !optimized.includes(dep));
    if (!missing.length) {
      console.log(`All ${clientDeps.length} client dependencies are pre-bundled.`);
      process.exit(0);
    }
  }
  await new Promise(resolve => setTimeout(resolve, 2000));
}
console.error(`Not pre-bundled after 180 s: ${missing.join(", ")}`);
process.exit(1);
