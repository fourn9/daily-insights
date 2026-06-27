# ローカル自動実行（毎日 19:00 JST / launchd）

Mac の launchd で毎日 19:00 に `run-daily-insights.sh` を実行し、当日の日次インサイトを
生成・push・自己DM配信する。クラウドルーティンは Slack に到達できないため、ローカル実行を採用。

## 構成

- `run-daily-insights.sh` — 本体。`claude -p`（ヘッドレス）で runbook.md を実行させる。
- `com.fourn9.daily-insights.plist` — 19:00 起動の launchd エージェント定義。

ローカル作業クローンの想定パス: `~/Desktop/Findy/Claude/iroiro/daily-insights`

## セットアップ手順

### 1. 初回の手動テスト（launchd に載せる前に必須）

ヘッドレス `claude -p` が Slack MCP（プラグイン＋認証）に到達できるかを先に確認する。
ターミナルで:

```sh
cd ~/Desktop/Findy/Claude/iroiro/daily-insights
./automation/run-daily-insights.sh
cat .logs/$(date +%Y-%m-%d).log
```

- 自己DMにレポートURL（または「0件」）が届けば成功。
- ⚠ `claude -p` は `--permission-mode bypassPermissions` で動く＝**承認なしで git push と Slack送信を実行**する無人エージェント。挙動を理解した上で使うこと。
- Slack MCP が認証エラー等で使えない場合は、ローカル自動化は不可。「手動起動」運用に切り替える。

### 2. launchd に登録

```sh
cp ~/Desktop/Findy/Claude/iroiro/daily-insights/automation/com.fourn9.daily-insights.plist \
   ~/Library/LaunchAgents/
launchctl load ~/Library/LaunchAgents/com.fourn9.daily-insights.plist
launchctl list | grep daily-insights   # 登録確認
```

### 3. 任意: その場で即時発火テスト

```sh
launchctl start com.fourn9.daily-insights
```

## 解除

```sh
launchctl unload ~/Library/LaunchAgents/com.fourn9.daily-insights.plist
```

## 注意

- 19:00 に **Mac が起動している**必要がある（スリープ中は起動時刻を過ぎると遅延実行されることがある）。
- plist の時刻は Mac のローカル時刻（JST 前提）。
- ログ: リポ内 `.logs/YYYY-MM-DD.log`、launchd の stdout/err は `/tmp/daily-insights.{out,err}.log`。
