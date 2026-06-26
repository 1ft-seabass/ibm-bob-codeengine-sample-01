---
tags: [codeengine, hono, nodejs, docker, merge]
---

**作成日**: 2026-06-26
**関連タスク**: IBM Code Engine 用 Hono ベースリポジトリの導入

## 問題

セキュリティチェック（secretlint + gitleaks）を先に導入済みの状態で、
別途 IBM Code Engine 向けの Hono ベースリポジトリ（`ibm-ce-simple-nodejs-hono-base`）を追加することになった。
両者の `.gitignore` と `package.json` が競合するため、手動マージが必要だった。

## 試行錯誤

### アプローチA: `.gitignore` への日本語コメント追記（失敗）

**試したこと**: `Add-Content` や `WriteAllText` で日本語コメントを `.gitignore` に追記

**結果**: 失敗

**理由**: PowerShell の `Add-Content` や文字列リテラルのエンコーディングが SJIS になり、
日本語コメント部分が文字化けした状態でファイルに書き込まれた。
複数回リトライしても同様。

---

### アプローチB: 英語コメントに切り替えて追記（成功）

**試したこと**: 日本語コメントを英語に変更し、`WriteAllLines` で UTF-8 として書き出す

**結果**: 成功

**コード例**:
```powershell
$lines = [System.IO.File]::ReadAllLines("$PWD\.gitignore", [System.Text.Encoding]::UTF8)
$cutIdx = ...  # "# gitleaks binary" 行のインデックス
$base = $lines[0..($cutIdx-1)]
$security = @(
  "",
  "# gitleaks binary (large binary file)",
  "bin/",
  "",
  "# pre-commit log (local only)",
  ".logs/",
  "",
  "# temporary working folder",
  "tmp/"
)
$merged = $base + $security
[System.IO.File]::WriteAllLines("$PWD\.gitignore", $merged, (New-Object System.Text.UTF8Encoding $false))
```

## 解決策

Code Engine リポジトリ（`ibm-ce-simple-nodejs-hono-base`）のファイルを手動でワークスペースに配置し、
既存のセキュリティ設定ファイルとマージした。

### 導入されたファイル構成

```
.
├── Dockerfile          # IBM Code Engine 向けビルド定義
├── LICENSE             # MIT License
├── README.md           # プロジェクト概要・開発手順
├── public/
│   └── index.html      # 静的ファイル（トップページ）
└── server.js           # Hono サーバー本体
```

### [`server.js`](../../server.js) の構成

| 機能 | 内容 |
|------|------|
| フレームワーク | Hono（`require('hono')`） |
| サーバー起動 | `@hono/node-server` の `serve()` |
| 静的配信 | `public/` フォルダを `/*` にマウント |
| API エンドポイント | `GET /api/hello` → `{ message: 'Hello from Hono!' }` |
| ポート | `process.env.PORT` → デフォルト `8080` |

### [`Dockerfile`](../../Dockerfile) の構成

- ベースイメージ: `icr.io/codeengine/node:22-alpine`（IBM Container Registry 公式）
- `package.json` → `npm install` → `public/` + `server.js` をコピー
- `EXPOSE 8080` / `CMD ["node", "server.js"]`
- `scripts/`・`devDependencies` はイメージに含まれない（ローカル専用）

### マージした既存ファイル

**`.gitignore`**:
- Code Engine 側の標準 Node.js `.gitignore` をベースに
- セキュリティ設定由来の `bin/`・`.logs/`・`tmp/` を末尾に追加

**`package.json`**:
- Code Engine 側の `name`・`version`・`description`・`main`・`repository`・`dependencies`（hono 等）をベース
- セキュリティ設定由来の `scripts`（`security:verify`・`secret-scan` 等）・`simple-git-hooks`・`devDependencies` を追加
- `"start": "node server.js"` を `scripts` 先頭に維持

## 学び

- PowerShell で日本語文字列をファイルに書き込む場合、`Add-Content` や文字列リテラルはエンコーディングが SJIS になりやすい。`[System.IO.File]::WriteAllLines` + `UTF8Encoding` を使うか、日本語を避けて英語コメントにする方が確実
- `Dockerfile` で `npm install` を行う場合、`devDependencies` も含まれてしまう。本番イメージを軽量化したい場合は `npm install --omit=dev` を使う
- IBM Code Engine はコンテナの `PORT` 環境変数を自動設定するため、`process.env.PORT || 8080` のパターンが推奨

## 今後の改善案

- `public/index.html` をプロジェクト固有の内容に書き換える
- `Dockerfile` を `npm install --omit=dev` に変更してイメージサイズを最適化する
- `/api/hello` に実際のアプリケーションロジックを追加する

## 関連ドキュメント

- [元リポジトリ](https://github.com/1ft-seabass/ibm-ce-simple-nodejs-hono-base)
- [IBM Code Engine ドキュメント](https://cloud.ibm.com/docs/codeengine)
- [セキュリティチェック導入ノート](./2026-06-26-15-16-17-security-check-setup.md)

---

**最終更新**: 2026-06-26
**作成者**: AI (Bob)
