---
tags: [security, secretlint, gitleaks, simple-git-hooks, pre-commit]
---

**作成日**: 2026-06-26
**関連タスク**: セキュリティチェック導入（secretlint + gitleaks）

## 問題

AI との協働でドキュメントや設定ファイルを扱う中で、APIキーやトークン等の機密情報がコミットに混入するリスクがあった。
特に `docs/notes/` に経緯を記録する運用では、curl 例や API 設定メモに本物の値が紛れやすい。
コミット前に自動でシークレットを検出する仕組みが必要だった。

## 試行錯誤

### アプローチA: gitleaks の自動インストール（失敗）

**試したこと**: `install-gitleaks.js` スクリプトを `node` で実行

**結果**: 失敗

**理由**: Windows 環境でダウンロードした ZIP ファイルが別プロセスにロックされており、`Expand-Archive` が `アクセスできません` エラーを返した。2回リトライしても同様。

---

### アプローチB: PowerShell で直接ダウンロード＆展開（成功）

**試したこと**: `Invoke-WebRequest` でダウンロードし、`Expand-Archive` で展開

**結果**: 成功

**コード例**:
```powershell
New-Item -ItemType Directory -Path ".\bin" -Force | Out-Null
Invoke-WebRequest -Uri "https://github.com/gitleaks/gitleaks/releases/download/v8.30.0/gitleaks_8.30.0_windows_x64.zip" -OutFile ".\bin\gitleaks.zip"
Expand-Archive -Path ".\bin\gitleaks.zip" -DestinationPath ".\bin" -Force
Remove-Item ".\bin\gitleaks.zip" -Force
.\bin\gitleaks.exe version
# → 8.30.0
```

## 解決策

`npx degit` で [`1ft-seabass/my-ai-collaboration-patterns/patterns/setup-pattern/setup-securecheck`](https://github.com/1ft-seabass/my-ai-collaboration-patterns/tree/main/patterns/setup-pattern/setup-securecheck) を取得し、ウィザード形式（Phase 0〜3）で順番に導入した。

**導入したファイル**:

| ファイル | 役割 |
|---------|------|
| `.secretlintrc.json` | secretlint 設定（preset-recommend） |
| `gitleaks.toml` | gitleaks 設定・allowlist |
| `package.json` | scripts・simple-git-hooks 設定 |
| `scripts/security-verify.js` | ヘルスチェック + テストラン |
| `scripts/install-gitleaks.js` | gitleaks インストーラー |
| `scripts/pre-commit.js` | pre-commit フック本体 |
| `.gitignore` | `bin/`・`.logs/`・`node_modules/`・`tmp/` を除外 |

**主なポイント**:
1. secretlint（クラウドサービス特化・精密検出）と gitleaks（高速・entropy検出・履歴スキャン）の二重チェック体制
2. simple-git-hooks により `package.json` のみで hooks 管理（`.husky/` 不要）
3. `postinstall` スクリプトで `npm install` 後に全員の hooks が自動有効化される
4. コミット時は staged ファイルのみスキャン（軽量）、`npm run security:verify:testrun` で全履歴スキャン可能

**最終ヘルスチェック結果**: 11/11 passed ✅

## 学び

- Windows 環境では `node` スクリプトから PowerShell の `Expand-Archive` を呼ぶと、ダウンロードしたファイルのロック競合が起きることがある。PowerShell から直接 `Invoke-WebRequest` + `Expand-Archive` で実行すると回避できる
- `gitleaks.toml` の allowlist に `tmp/` を最初から含めておくと、セットアップ用の一時ファイルがスキャン対象にならない
- シークレットが検出されたときはファイル修正より先にトークン側を無効化する（git 履歴に残るため）

## 今後の改善案

- プロジェクト固有の false positive が出た場合は `.secretlintrc.json` の `ignores` にファイルパターンを追加する
- `gitleaks.toml` の `allowlist.regexes` にプロジェクト内のプレースホルダーパターンを追加する

## 関連ドキュメント

- [テンプレート元リポジトリ](https://github.com/1ft-seabass/my-ai-collaboration-patterns/tree/main/patterns/setup-pattern/setup-securecheck)
- [gitleaks リリースページ](https://github.com/gitleaks/gitleaks/releases)
- [docs 構造導入ノート](./2026-06-26-14-58-46-docs-structure-setup.md)

---

**最終更新**: 2026-06-26
**作成者**: AI (Bob)
