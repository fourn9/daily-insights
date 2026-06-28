// X(Twitter)投稿の本文を公式 syndication エンドポイントから認証なしで取得する。
// 通常ツイートは text、長文「Xアーティクル」は title＋preview を返す。
// 使い方: node scripts/fetch-x.mjs <tweet-id または x.com の URL>
// 出力: JSON { ok, id, user, createdAt, lang, text, articleTitle, articlePreview }
//   ok=false は取得不可（非公開・削除・エンドポイント変更など。捏造せずリンクのみにする）。

function extractId(arg) {
  if (/^\d+$/.test(arg)) return arg;
  const m = String(arg).match(/status(?:es)?\/(\d+)/);
  return m ? m[1] : null;
}

const id = extractId(process.argv[2] || "");
if (!id) {
  console.log(JSON.stringify({ ok: false, error: "no tweet id" }));
  process.exit(0);
}

const url = `https://cdn.syndication.twimg.com/tweet-result?id=${id}&lang=ja&token=a`;
try {
  const res = await fetch(url, { headers: { "User-Agent": "Mozilla/5.0" } });
  if (!res.ok) {
    console.log(JSON.stringify({ ok: false, id, status: res.status }));
    process.exit(0);
  }
  const j = await res.json();
  const out = {
    ok: true,
    id,
    user: j.user?.screen_name ?? null,
    createdAt: j.created_at ?? null,
    lang: j.lang ?? null,
    text: j.text ?? "",
    articleTitle: j.article?.title ?? null,
    articlePreview: j.article?.preview_text ?? null,
  };
  console.log(JSON.stringify(out));
} catch (e) {
  console.log(JSON.stringify({ ok: false, id, error: String(e) }));
}
