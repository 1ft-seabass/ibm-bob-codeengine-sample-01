---
tags: [codeengine, ibmcloud, deploy, buildrun, hono]
---

**作成日**: 2026-06-26
**関連タスク**: IBM Code Engine 初回セットアップと日常更新フロー整備

## 問題

IBM Bob IDE（VSCode 相当のコーディングエージェント）から IBM Cloud Code Engine のビルド・デプロイを AI 併走で回せるようにするため、以下の課題があった。

- `ibmcloud ce` プラグインが未インストールでコマンドが使えなかった
- GitHub リポジトリ（`ibm-bob-codeengine-sample-01`）を Code Engine に初回デプロイする手順が未整備
- デプロイのたびに手動でコマンドを打つ運用になっており、npm scripts による自動化が必要だった

## 試行錯誤

### アプローチA: `ibmcloud ce build create` → `application create --build` （失敗）

**試したこと**: 先に `build create` でビルド設定を作成し、`application create --build ビルド名` で参照

**結果**: 失敗

**理由**: `application create` に `--build` オプションは存在しない。`application create` は独自の `--build-source` 等のオプションでビルドを内包して行う設計になっている

---

### アプローチB: `application create --build-source` で一括作成（成功・ただし1回目は失敗）

**試したこと**: `ibmcloud ce application create --name ... --build-source https://github.com/... --build-strategy dockerfile --build-size medium --port 8080 --wait`

**1回目の結果**: 失敗

**理由**: GitHub リポジトリに `Dockerfile` がまだプッシュされていなかった。ローカルでコミット済みだがリモートに未プッシュの状態だった

**2回目（プッシュ後）の結果**: 成功 ✅

---

### アプローチC: `ibmcloud ce` プラグインのオプション名の誤り

**試したこと**: `ibmcloud ce build create --build-source`

**結果**: 失敗

**理由**: `build create` のオプションは `--source`（`application create` では `--build-source`）。コマンドによってオプション名が異なる

## 解決策

以下の手順で初回セットアップを完了した。

### 前提確認

| 項目 | 状態 |
|------|------|
| `ibmcloud` CLI | v2.45.0 インストール済み |
| `code-engine` プラグイン | v1.62.6 を `ibmcloud plugin install code-engine` でインストール |
| ログイン | `YOUR_IBM_CLOUD_EMAIL` / リージョン `YOUR_REGION` |
| リソースグループ | `default` |
| プロジェクト | `YOUR_CE_PROJECT_NAME`（ID: `YOUR_CE_PROJECT_ID`） |

### 実行したコマンド

```bash
# リソースグループ・プロジェクトの選択
ibmcloud target -g default
ibmcloud ce project select --id YOUR_CE_PROJECT_ID

# アプリの作成（ビルド + デプロイを一括）
ibmcloud ce application create \
  --name bob-codeengine-sample-app \
  --build-source https://github.com/1ft-seabass/ibm-bob-codeengine-sample-01 \
  --build-strategy dockerfile \
  --build-size medium \
  --port 8080 \
  --wait
```

### デプロイ結果

| 項目 | 値 |
|------|-----|
| アプリ名 | `bob-codeengine-sample-app` |
| ビルド設定名 | `bob-codeengine-sample-build`（`build create` で事前作成済み） |
| 公開 URL | `https://YOUR_APP_NAME.YOUR_CLUSTER_ID.YOUR_REGION.codeengine.appdomain.cloud` |
| イメージ保存先 | `private.YOUR_REGION.icr.io/YOUR_NAMESPACE/app-YOUR_APP_NAME:...` |
| スケール | min=0 / max=10（デフォルト） |
| CPU / メモリ | 1 vCPU / 4G（デフォルト） |

### 動作確認

```
GET /          → 200 OK（index.html）
GET /api/hello → 200 OK（{"message":"Hello from Hono!"}）
```

### 日常更新フローの整備

**`.env.ce`**（Git 管理外）:
```bash
CE_BUILD_NAME=bob-codeengine-sample-build
CE_APP_NAME=bob-codeengine-sample-app
```

**`package.json` の scripts**:
```json
"build:image_build": "ibmcloud ce buildrun submit --build bob-codeengine-sample-build --wait",
"build:update_app":  "ibmcloud ce application update --name bob-codeengine-sample-app --wait",
"build":             "npm run build:image_build && npm run build:update_app"
```

日常更新は `git push` 後に `npm run build` を実行するだけで完結する。

## 学び

- `ibmcloud ce build create` と `ibmcloud ce application create` ではオプション名が異なる（`--source` vs `--build-source`）。`application create` は独自のビルドオプション群を持っている
- Code Engine は GitHub リポジトリを直接参照してビルドするため、**プッシュ前にデプロイしても Dockerfile が見つからずビルド失敗**する。デプロイ前に必ず `git push` を済ませること
- `ibmcloud ce project select --id <ID>` を使うと GUI の URL から直接プロジェクトを選択できて便利
- `application create --wait` はビルド完了・アプリ起動まで待機してから URL を返してくれるため、初回確認に便利

## 今後の改善案

- `npm run build` に `git push origin main` を先頭に追加して push → build → deploy を完全自動化する
- `min-scale=1` に変更してコールドスタートを避ける（常時起動が必要な場合）
- 環境変数（API キー等）は `ibmcloud ce secret create` で Code Engine のシークレットとして管理する
- カスタムドメインの設定（必要になったタイミングで）

## 関連ドキュメント

- Code Engine アプリ URL: `https://YOUR_APP_NAME.YOUR_CLUSTER_ID.YOUR_REGION.codeengine.appdomain.cloud`
- [IBM Code Engine トラブルシューティング](https://cloud.ibm.com/docs/codeengine?topic=codeengine-troubleshoot-build)
- [Code Engine Hono ベース導入ノート](./2026-06-26-15-31-02-codeengine-hono-base-setup.md)

---

**最終更新**: 2026-06-26
**作成者**: AI (Bob)
