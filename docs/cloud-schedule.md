# クラウドスケジュール設定（毎日 19:00 JST）

`/schedule`（RemoteTrigger）で登録するクラウドルーティンの設定。

## 前提（重要）

- クラウドルーティンが使える MCP は **claude.ai connectors のみ**。
- **Slack を https://claude.ai/customize/connectors で接続しておくこと**（未接続だとDM収集・配信不可）。
- GitHub push はルーティンの git source（`fourn9/daily-insights`）経由で可能。

## 設定値

- **name**: `daily-insights-19jst`
- **cron**: `0 10 * * *`（10:00 UTC = 19:00 JST）
- **environment_id**: `env_018YJVRQtAHv7mARor76eGKk`（Default）
- **model**: `claude-sonnet-4-6`
- **git source**: `https://github.com/fourn9/daily-insights`
- **allowed_tools**: `Bash, Read, Write, Edit, Glob, Grep`
- **mcp_connections**: Slack（接続後に connector_uuid / url を設定）

## プロンプト（自己完結）

```
あなたは daily-insights の日次レポート生成エージェント。本日分を実行する。

1. リポジトリ fourn9/daily-insights は checkout 済み。`runbook.md` を読み、本日（JST）について
   その手順どおりに実行する。
2. Slack MCP で自分の DM（user_id U088WK0RLE6）の本日 00:00–19:00 JST のメッセージを取得し、
   動作ワード（見る/みる/読む/よむ/読みたい/やる/試す/ためす）と URL を両方含む投稿だけ残す。
   自動ダイジェスト・ニュースサマリーは除外。
3. 各 URL を取得して深掘り要約（5〜10点・捏造しない・取得不可は明記）。
4. data/<DATE>.json を書き、`node scripts/build-report.mjs <DATE>` と
   `node scripts/build-index.mjs` を実行。
5. main に commit & push。
6. レポートURL https://fourn9.github.io/daily-insights/<DATE>/ を自分の DM（U088WK0RLE6）に
   Slack で送る（URL前後は空行）。対象0件なら「本日は対象メモ0件」と簡潔に送る。

runbook.md の do/don't に従う。結論ファースト・スコープを超えない。
```

## 登録後の確認

- `RemoteTrigger {action:"run"}` で即時テスト実行 → DM到達とPages反映を確認。
- 反映URL: https://fourn9.github.io/daily-insights/
