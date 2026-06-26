---
tags: [codeengine, bootstrap, deploy, icr, troubleshoot]
---

**作成日**: 2026-06-26
**関連タスク**: Bootstrap 適用・イメージクリーンアップ・デプロイ scripts 改善

## 問題

初回デプロイ後に以下の3つの課題が発生・発覚した。

1. `public/index.html` が雛形のままだった
2. IBM Container Registry のストレージ使用量が 80% を超えていた（古いイメージが蓄積）
3. イメージクリーンアップ後にアプリが応答しなくなった（イメージ参照が壊れた）

## 試行錯誤

### アプローチA: `application update` でイメージ参照を修正（失敗）

**試したこと**: `npm run build` を再実行して `application update --name ... --wait` で更新

**結果**: 失敗

**理由**: `build:update_app` がイメージを明示指定していなかったため、削除済みタグ（`260626-0656-ruvy9`）を参照し続けた。`404 Not Found` エラーが発生

---

### アプローチB: `--image` を明示して update（成功）

**試したこと**: `ibmcloud ce application update --name bob-codeengine-sample-app --image private.jp.icr.io/NAMESPACE/build-bob-codeengine-sample-build:latest --wait`

**結果**: 成功 ✅

## 解決策

### 1. Bootstrap 5 + カードレイアウトの適用

[`public/index.html`](../../public/index.html) を Bootstrap 5.3.3 CDN ベースに書き換え。3カラムのカード構成（サーバー・ホスティング・API）を実装。

### 2. イメージクリーンアップ

`ibmcloud plugin install container-registry` で `cr` プラグインをインストールして実施。

**削除したイメージ（7件）**:
- `app-bob-codeengine-sample-app:260626-0656-ruvy9`（古いタグ）
- 他プロジェクトの 2年前・6ヶ月前のイメージ 6件

**残したイメージ（1件）**:
- `build-bob-codeengine-sample-build:latest`（現在稼働中）

### 3. `build:update_app` スクリプトの修正

`package.json` の `build:update_app` にイメージを明示指定する修正と、`dotenv-cli` 導入で `.env.ce` から環境変数を読み込む形に改善。

**Before**:
```json
"build:update_app": "ibmcloud ce application update --name bob-codeengine-sample-app --wait"
```

**After** (`dotenv-cli` 導入後):
```json
"build:update_app": "dotenv -e .env.ce -- ibmcloud ce application update --name $CE_APP_NAME --image $CE_BUILD_IMAGE --wait"
```

**`.env.ce`** に管理する値:
```bash
CE_BUILD_NAME=YOUR_BUILD_NAME
CE_APP_NAME=YOUR_APP_NAME
CE_BUILD_IMAGE=private.jp.icr.io/NAMESPACE/build-YOUR_BUILD_NAME:latest
```

## 学び

- **`app-xxx:タイムスタンプ` と `build-xxx:latest` は別物**  
  `application create` 時に生成される `app-xxx` イメージは固有タグで管理される。クリーンアップで削除すると起動不能になる。`build-xxx:latest` は `buildrun submit` の成果物で常に最新を指す
- **クリーンアップ安全ルール**: `build-xxx:latest` のみ残せばOK。`app-xxx:タイムスタンプ` 形式は削除してよい
- **`dotenv-cli` でリポジトリに機密 URL を書かない**  
  `private.jp.icr.io/...` のような内部 URL を `package.json` に直書きするとリポジトリがそのプロジェクト専用になる。`.env.ce`（Git 管理外）に切り出すことで汎用テンプレートとして維持できる

## 今後の改善案

- `ibmcloud cr retention-policy-set` で古いイメージを自動削除するポリシーを設定する
- `npm run build:clean` などクリーンアップ専用スクリプトを追加する

## 関連ドキュメント

- [Code Engine 初回セットアップノート](./2026-06-26-16-44-32-codeengine-initial-setup.md)
- [IBM Container Registry ドキュメント](https://cloud.ibm.com/docs/Registry)

---

**最終更新**: 2026-06-26
**作成者**: AI (Bob)
