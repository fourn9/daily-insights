# daily-insights 設計メモ

## 目的

自分の Slack DM（`U088WK0RLE6`）に「見る／読む」等の**動作ワード＋URL**でメモした「あとで確認する情報」を、
**毎日 19:00 JST** にまとめて各URLの概要＋深掘り解説レポートにし、GitHub Pages で公開、URLを自己DMへ配信する。

週次の「メモまとめ」ルーティン（Notion＋Drive・claude.ai routine）とは**独立**。
既存 `daily-news` / `daily-engineering-news` と同じ「日付別ページ＋トップ一覧」構成・デザイン言語を踏襲。

## 確定要件

| 項目 | 決定 |
|---|---|
| 収集対象 | 自己DMの当日 00:00–19:00 JST の「動作ワード＋URL」投稿のみ（自動ダイジェスト除外） |
| 解説 | 各URLを取得し 5–10点の深掘り箇条書き。取得不可は明記・リンクのみ・捏造しない |
| 公開 | public リポ `fourn9/daily-insights` の GitHub Pages（main/root）。日付別＋index一覧 |
| 配信 | レポートURLを自己DMへ Slack 送信 |
| 実行 | 毎日 19:00 JST のクラウドスケジュール（要 Slack を claude.ai connectors に接続） |

## アーキテクチャ

- **入力**: `data/YYYY-MM-DD.json`（収集した生データ。監査用にコミット）
- **生成**: `scripts/build-report.mjs`（data→`YYYY-MM-DD/index.html`）、`scripts/build-index.mjs`（日付dir走査→`index.html`）
- **レンダラ**: `scripts/lib/render.mjs`（self-contained HTML・ダークモード対応・新聞調デザイン）
- **実行手順**: `runbook.md`（クラウドエージェントが従う）
- **スケジュール**: `docs/cloud-schedule.md`

## 主要な設計判断

1. **HTMLは手書きせずスクリプト生成**: LLMが毎回HTMLを書くとマークアップ事故が起きるため、データ→決定的レンダリングに分離。再実行で重複しない（index は走査で再生成）。
2. **public リポ**: GitHubプランが非Enterpriseで private Pages のアクセス制御不可。既存 daily-* 系と同じ public 運用に統一。
3. **クラウド実行のSlack依存**: クラウドルーティンは claude.ai connectors のみ。Slack 接続が前提条件。
4. **捏造しない**: 本文取得不可は `fetchOk:false` で明示しリンクのみ表示。

## 検証済み

- レンダラ（成功＋取得不可の両ケース）／Slack収集・フィルタ（実データ）／リポ作成・push／Pages 稼働（HTTP 200）。
- 未了: クラウドルーティン登録（Slack接続後）と初回自動実行の確認。
