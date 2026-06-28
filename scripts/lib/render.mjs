// 共通レンダラ: 日次インサイトレポートの HTML を生成する。
// daily-news テンプレのデザイン言語（新聞調・ダークモード対応・AI風グラデ回避）を踏襲。
// ページは self-contained（CSS をインライン）にして、Pages 以外で開いても崩れないようにする。

const WEEKDAY_JP = ["日", "月", "火", "水", "木", "金", "土"];

export function escapeHtml(s) {
  return String(s ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// "2026-06-27" -> { jp: "2026年06月27日(土)", weekday: "土" }
export function formatDate(iso) {
  const [y, m, d] = iso.split("-").map(Number);
  const wd = WEEKDAY_JP[new Date(Date.UTC(y, m - 1, d)).getUTCDay()];
  return { jp: `${y}年${String(m).padStart(2, "0")}月${String(d).padStart(2, "0")}日(${wd})`, weekday: wd };
}

export function domainOf(url) {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "";
  }
}

const SHARED_CSS = `
  :root{
    --bg:#fafafa; --fg:#222; --muted:#666; --card:#fff; --border:#e4e4e4;
    --accent:#0a66c2; --accent-bg:#eaf0f6; --hl:#f5f5f5; --badge:#0a66c2;
  }
  @media (prefers-color-scheme: dark){
    :root{
      --bg:#16181c; --fg:#e8e8e8; --muted:#9aa0a6; --card:#1f2227; --border:#2a2e34;
      --accent:#6ea8ff; --accent-bg:#1f2730; --hl:#23272d; --badge:#345e8a;
    }
  }
  *{box-sizing:border-box}
  html,body{margin:0;padding:0;background:var(--bg);color:var(--fg);
    font-family:-apple-system,BlinkMacSystemFont,"Segoe UI","Hiragino Sans","Noto Sans JP",Meiryo,sans-serif;
    line-height:1.65;font-size:16px;-webkit-text-size-adjust:100%;}
  .wrap{max-width:760px;margin:0 auto;padding:18px 16px 64px;}
  header{padding:8px 0 12px;border-bottom:2px solid var(--fg);margin-bottom:20px;}
  h1{font-size:1.5rem;margin:0 0 6px;line-height:1.3;}
  .lead,.date{color:var(--muted);font-size:.95rem;margin:0;}
  .top-link{display:inline-block;margin-top:10px;color:var(--accent);text-decoration:none;font-size:.9rem;}
  .top-link:hover{text-decoration:underline}
  .count{display:inline-block;font-size:.78rem;color:#fff;background:var(--badge);border-radius:999px;padding:1px 9px;margin-left:8px;vertical-align:2px;}
  article{padding:16px 0;border-bottom:1px solid var(--border);}
  article:last-child{border-bottom:none}
  article h3{font-size:1.05rem;margin:0 0 5px;line-height:1.45;font-weight:600;display:flex;flex-wrap:wrap;align-items:baseline;gap:8px;}
  article h3 a{color:var(--accent);text-decoration:none;}
  article h3 a:hover{text-decoration:underline}
  .badge{font-size:.72rem;color:#fff;background:var(--badge);border-radius:5px;padding:1px 7px;font-weight:600;white-space:nowrap;}
  .src{font-size:.78rem;color:var(--muted);margin:0 0 8px;letter-spacing:.02em;word-break:break-all;}
  ul.points{margin:6px 0 0;padding-left:1.25em;}
  ul.points li{margin:3px 0;font-size:.95rem;}
  .tldr{margin:6px 0 8px;padding:8px 12px;background:var(--accent-bg);border-radius:8px;font-size:.95rem;}
  .tldr b{color:var(--accent);}
  .takeaway{margin:10px 0 0;padding-left:.7em;border-left:3px solid var(--accent);color:var(--fg);font-size:.92rem;}
  .takeaway b{color:var(--accent);}
  .fail{color:#c14;font-size:.9rem;margin:6px 0 0;}
  ul.briefs{list-style:none;margin:0;padding:0;display:flex;flex-direction:column;gap:.6rem;}
  ul.briefs a{display:flex;align-items:center;gap:.7rem;padding:.85rem 1rem;background:var(--card);
    border:1px solid var(--border);border-left:3px solid var(--accent);border-radius:8px;
    color:var(--fg);text-decoration:none;transition:border-color .15s ease, transform .15s ease;}
  ul.briefs a:hover,ul.briefs a:focus-visible{border-color:var(--accent);transform:translateY(-1px);outline:none;}
  ul.briefs a::after{content:"›";color:var(--accent);font-size:1.2rem;margin-left:auto;}
  .date-jp{font-weight:600;}
  .date-iso{font-family:"SFMono-Regular",Menlo,Consolas,monospace;font-size:.8rem;color:var(--muted);
    background:var(--accent-bg);padding:.1rem .45rem;border-radius:5px;white-space:nowrap;}
  .empty{color:var(--muted);padding:1rem 0;}
  footer{margin-top:36px;padding-top:14px;border-top:1px solid var(--border);color:var(--muted);font-size:.82rem;}
  footer p{margin:4px 0}
  @media (max-width:480px){.wrap{padding:14px 12px 48px}h1{font-size:1.3rem}}
`;

function shell(title, bodyHtml) {
  return `<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>${escapeHtml(title)}</title>
<style>${SHARED_CSS}</style>
</head>
<body>
<div class="wrap">
${bodyHtml}
</div>
</body>
</html>
`;
}

// 1日分のレポートページ。data: { date, generatedAt, items: [{trigger,url,title,domain,fetchOk,points,note}] }
export function renderReport(data) {
  const { jp } = formatDate(data.date);
  const items = data.items ?? [];
  const articles = items.length
    ? items
        .map((it) => {
          const badge = it.trigger ? `<span class="badge">${escapeHtml(it.trigger)}</span>` : "";
          const title = escapeHtml(it.title || it.url);
          const src = escapeHtml(it.domain || domainOf(it.url));
          let body;
          if (it.fetchOk === false) {
            const note = it.note || "本文取得不可・リンクのみ";
            body = `  <p class="fail">⚠ ${escapeHtml(note)}</p>`;
          } else {
            const tldr = it.summary ? `  <p class="tldr"><b>TL;DR</b> ${escapeHtml(it.summary)}</p>\n` : "";
            const pts = (it.points ?? []).map((p) => `    <li>${escapeHtml(p)}</li>`).join("\n");
            const ul = `  <ul class="points">\n${pts}\n  </ul>`;
            const take = it.takeaway ? `\n  <p class="takeaway"><b>→ 使いどころ</b> ${escapeHtml(it.takeaway)}</p>` : "";
            body = `${tldr}${ul}${take}`;
          }
          return `<article>
  <h3>${badge}<a href="${escapeHtml(it.url)}" target="_blank" rel="noopener">${title}</a></h3>
  <p class="src">${src}</p>
${body}
</article>`;
        })
        .join("\n\n")
    : `<p class="empty">本日（${escapeHtml(data.date)}）は対象の「動作ワード＋URL」投稿がありませんでした。</p>`;

  const body = `<header>
  <h1>📑 日次インサイト</h1>
  <p class="date">${escapeHtml(jp)}<span class="count">${items.length}件</span></p>
  <a class="top-link" href="../">← 過去レポート一覧へ</a>
</header>

<section>
${articles}
</section>

<footer>
  <p>📨 <strong>収集元</strong>: 自分のSlack DM（当日 00:00–19:00 JST の「動作ワード＋URL」投稿）</p>
  <p>※ 本文取得不可（x.com 等）はリンクのみ表示。内容の捏造はしていません。</p>
</footer>`;
  return shell(`日次インサイト ${data.date}`, body);
}

// トップ一覧ページ。entries: [{date, count}]（新しい順で渡す）
export function renderIndex(entries) {
  const list = entries.length
    ? entries
        .map((e) => {
          const { jp } = formatDate(e.date);
          const count = Number.isFinite(e.count) ? `<span class="date-iso">${e.count}件</span>` : "";
          return `        <li>
          <a href="./${escapeHtml(e.date)}/">
            <span class="date-jp">${escapeHtml(jp)}</span>
            <span class="date-iso">${escapeHtml(e.date)}</span>
            ${count}
          </a>
        </li>`;
        })
        .join("\n")
    : `        <li class="empty">まだレポートがありません。</li>`;

  const body = `<header>
  <h1>📑 日次インサイト</h1>
  <p class="lead">
    自分のSlack DMに「見る／読む」等とともにメモしたURLを、毎日19:00にまとめて概要＋深掘り解説にしたアーカイブです。
  </p>
</header>

<main>
  <ul class="briefs">
${list}
  </ul>
</main>

<footer>
  毎日 19:00 JST 更新 · GitHub Pages で公開
</footer>`;
  return shell("📑 日次インサイト", body);
}
