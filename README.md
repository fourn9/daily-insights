# daily-insights

自分の Slack DM に「見る／読む」等の**動作ワード＋URL**でメモした「あとで確認する情報」を、
**毎日 19:00 JST** にまとめて各URLの概要＋深掘り解説レポートにし、GitHub Pages で公開するリポジトリ。
生成後、レポートのURLを自分の Slack DM に送る。

> 既存の `daily-news` / `daily-engineering-news` と同じ「日付別ページ＋トップ一覧」構成。
> 週次の「メモまとめ」ルーティン（Notion＋Drive）とは独立した別システム。

## 公開URL

- トップ（一覧）: https://fourn9.github.io/daily-insights/
- 各日のレポート: https://fourn9.github.io/daily-insights/YYYY-MM-DD/

## ディレクトリ構成

```
daily-insights/
├── index.html            ← 過去レポート一覧（自動生成・新しい順）
├── YYYY-MM-DD/
│   └── index.html        ← その日のレポート（自動生成）
├── data/
│   └── YYYY-MM-DD.json   ← 収集した生データ（入力・監査用）
├── scripts/
│   ├── build-report.mjs  ← data/<date>.json → <date>/index.html
│   ├── build-index.mjs   ← 日付ディレクトリを走査して index.html を再生成
│   └── lib/render.mjs    ← 共通レンダラ（self-contained HTML）
└── runbook.md            ← 毎日の自動実行手順（クラウドエージェント用プロンプト）
```

## 更新フロー（自動）

毎日 19:00 JST にクラウドスケジュールのエージェントが `runbook.md` に従って実行する:

1. 自分の Slack DM の当日 00:00–19:00 JST の「動作ワード＋URL」投稿を収集
2. 各URLを取得して深掘り要約 → `data/YYYY-MM-DD.json` に保存
3. `node scripts/build-report.mjs YYYY-MM-DD` でレポートHTMLを生成
4. `node scripts/build-index.mjs` でトップ一覧を再生成
5. commit & push（GitHub Pages が数分で反映）
6. レポートURLを自分の Slack DM に送信

## 手動で1日分を作り直す

```sh
# data/YYYY-MM-DD.json を用意してから:
node scripts/build-report.mjs YYYY-MM-DD
node scripts/build-index.mjs
git add . && git commit -m "Add report for YYYY-MM-DD" && git push
```

## data JSON フォーマット

```json
{
  "date": "2026-06-27",
  "generatedAt": "2026-06-27T19:00:00+09:00",
  "items": [
    {
      "trigger": "見る",
      "url": "https://example.com/...",
      "title": "記事タイトル",
      "domain": "example.com",
      "fetchOk": true,
      "summary": "TL;DR（1〜2行）: 結局これは何で何が嬉しいか",
      "points": ["要点 3〜6点（仕組み・数字・根拠を絞る）"],
      "takeaway": "使いどころ（1行）",
      "note": ""
    }
  ]
}
```

- `fetchOk: false` の場合は `points` を空にし、`note` に取得不可の理由を書く（捏造しない）。
