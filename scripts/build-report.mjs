// data/<date>.json から <date>/index.html を生成する。
// 使い方: node scripts/build-report.mjs 2026-06-27
import { readFileSync, mkdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderReport } from "./lib/render.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const date = process.argv[2];
if (!/^\d{4}-\d{2}-\d{2}$/.test(date || "")) {
  console.error("Usage: node scripts/build-report.mjs YYYY-MM-DD");
  process.exit(1);
}

const data = JSON.parse(readFileSync(join(root, "data", `${date}.json`), "utf8"));
const outDir = join(root, date);
mkdirSync(outDir, { recursive: true });
writeFileSync(join(outDir, "index.html"), renderReport(data));
console.log(`wrote ${date}/index.html (${(data.items ?? []).length} items)`);
