// リポジトリ直下の YYYY-MM-DD ディレクトリを走査して index.html（新しい順一覧）を再生成する。
// 件数は data/<date>.json があれば items 数を表示する。
// 使い方: node scripts/build-index.mjs
import { readdirSync, readFileSync, writeFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { renderIndex } from "./lib/render.mjs";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const dates = readdirSync(root, { withFileTypes: true })
  .filter((d) => d.isDirectory() && DATE_RE.test(d.name))
  .filter((d) => existsSync(join(root, d.name, "index.html")))
  .map((d) => d.name)
  .sort()
  .reverse(); // 新しい順

const entries = dates.map((date) => {
  let count = NaN;
  const dataPath = join(root, "data", `${date}.json`);
  if (existsSync(dataPath)) {
    try {
      count = (JSON.parse(readFileSync(dataPath, "utf8")).items ?? []).length;
    } catch {}
  }
  return { date, count };
});

writeFileSync(join(root, "index.html"), renderIndex(entries));
console.log(`wrote index.html (${entries.length} reports)`);
