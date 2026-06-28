#!/bin/zsh
# 毎日 19:00 JST に launchd から実行。当日の日次インサイトを生成・push・自己DM配信する。
# 初回は手動で実行してログと DM 到達を確認してから launchd に載せること。
set -u

# launchd は最小環境なので PATH を明示
export PATH="/usr/local/bin:/opt/homebrew/bin:/usr/bin:/bin:$HOME/.local/bin"

# claude.ai サブスクログインを使う（API キーは使用上限・従量課金回避のため無効化）。
# API キーが set だと claude.ai 認証より優先され、上限到達で失敗する。
unset ANTHROPIC_API_KEY ANTHROPIC_AUTH_TOKEN

REPO="$HOME/Desktop/Findy/Claude/iroiro/daily-insights"
cd "$REPO" || { echo "repo not found: $REPO"; exit 1; }

mkdir -p .logs
DATE="$(date +%Y-%m-%d)"
LOG=".logs/$DATE.log"

{
  echo "===== run $(date '+%Y-%m-%d %H:%M:%S %Z') ====="
  git pull --quiet origin main || echo "git pull skipped"

  claude -p "あなたは daily-insights の日次レポート生成エージェント。リポジトリ直下の runbook.md を読み、本日（JST）についてその手順どおりに実行せよ。要点: Slack MCP で自分のDM(channel_id U088WK0RLE6)の本日 00:00-19:00 JST のメッセージを取得し、動作ワード(見る/みる/読む/よむ/読みたい/やる/試す/ためす)とURLを両方含む投稿だけ残す(自動ダイジェスト・ニュースサマリーは除外)。各URLを WebFetch で取得し5〜10点の深掘り要約(取得不可は fetchOk:false で明記・捏造しない)。data/${DATE}.json を runbook の形式で書き(0件でも items:[] で作成)、node scripts/build-report.mjs ${DATE} と node scripts/build-index.mjs を実行。git add -A && git commit && git push origin main。最後にレポートURL https://fourn9.github.io/daily-insights/${DATE}/ を自分のDM(U088WK0RLE6)に slack_send_message で送る(URL前後は空行・0件なら『本日は対象メモ0件でした』と簡潔に)。" \
    --permission-mode bypassPermissions \
    --allowedTools "Bash,Read,Write,Edit,Glob,Grep,WebFetch,mcp__plugin_slack_slack__slack_read_channel,mcp__plugin_slack_slack__slack_search_public_and_private,mcp__plugin_slack_slack__slack_send_message"

  echo "===== done $(date '+%Y-%m-%d %H:%M:%S %Z') ====="
} >> "$LOG" 2>&1
