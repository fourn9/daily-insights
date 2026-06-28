# 日次インサイト 実行ランブック（クラウドエージェント用）

毎日 19:00 JST 実行。**この手順だけを行い、スコープを超えない。** 各ステップはツール結果で裏取りする。

## ゴール

自分の Slack DM の当日分「動作ワード＋URL」メモを集め、各URLの概要＋深掘り解説レポートを
このリポジトリに生成・push し、レポートURLを自分の Slack DM に送る。

## 前提

- リポジトリ: `fourn9/daily-insights`（このリポ）。push 権限あり前提。
- 自分の Slack user_id: `U088WK0RLE6`（DM の送受信先）。
- 対象時間窓: 当日 **00:00–19:00 JST**。
- 動作ワード: `見る / みる / 読む / よむ / 読みたい / やる / 試す / ためす`（短文＋URL）。

## 手順

1. **当日日付**を JST で確定（`DATE=YYYY-MM-DD`）。

2. **Slack DM 収集**: 自分のDMから当日の投稿を取得する。
   - `slack_search_public_and_private` で `from:<@U088WK0RLE6> has:link after:<前日> before:<翌日>` を検索（or 自分のDMチャンネル履歴を読む）。
   - 各メッセージの `ts` を JST 換算し、**00:00 ≤ ts < 19:00** のものだけ残す。
   - 本文に**動作ワードを含み**、かつ**URLを含む**投稿だけ採用。ニュースサマリー等の長文は除外。
   - 1メッセージに複数URLがあれば各URLを別アイテムにする。

3. **各URLを深掘り要約**: 本文取得 → `points` は **5〜10点**の箇条書き（人物・企業・ツール名・数値・仕組み・結論まで具体的に）。
   - 通常URL: `WebFetch`（不可なら Exa）。
   - **`x.com` / `twitter.com` の URL**: `WebFetch` は 402 で不可。代わりに `node scripts/fetch-x.mjs <URL>` を使う。
     返る JSON の `text`（通常ツイート全文）と `articleTitle`＋`articlePreview`（X長文記事の見出し＋冒頭）から要約する。
     記事は冒頭プレビューまでしか取れないので、その旨を1点添える（全文はリンク先）。`ok:false` のときだけ取得不可扱い。
   - 取得不可（fetch-x も ok:false 等）: `fetchOk:false`・`points:[]`・`note` に理由。**捏造しない。**
   - `trigger` はその投稿で使われた動作ワード、`title`/`domain` も埋める。

4. **データ保存**: `data/<DATE>.json` を README のフォーマットで書く（0件でも `items:[]` で作成）。

5. **HTML生成**:
   ```sh
   node scripts/build-report.mjs <DATE>
   node scripts/build-index.mjs
   ```

6. **commit & push**:
   ```sh
   git add . && git commit -m "Add report for <DATE>" && git push
   ```

7. **DM送信**: `slack_send_message`（宛先 `U088WK0RLE6`）でレポートURLを送る。
   - URL: `https://fourn9.github.io/daily-insights/<DATE>/`
   - 文面例: `📑 今日の日次インサイト（<DATE>・N件）` の次行に**空行を挟んで**URLを置く。
   - 0件の日は「本日は対象メモ0件でした」と簡潔に。

## do / don't

- **do**: 結論ファースト。ツール結果（検索ヒット数・生成ログ・push結果）で各段を裏取り。取得不可は正直に明記。
- **don't**: 時間窓外・動作ワード無し・URL無しの投稿を入れない。要約を盛らない／捏造しない。スクリプト以外でHTMLを手書きしない。リポ構成を変えない。
- **リンク記法**: プレーン送信ではURL前後に空行。説明とURLを同一行に詰めない（リンク融合・文字化け防止）。
