---
tags: [setup, docs-structure, degit, template, initial]
---

**作成日**: 2026-06-26
**関連タスク**: docs 構造導入

## 問題

プロジェクト開始時点で `docs/` フォルダが存在せず、AI との協働パターンを整理・記録するための文書構造がなかった。
外部リポジトリのテンプレートを活用して、標準化された文書管理体制を導入する必要があった。

## 試行錯誤

### アプローチA: `Copy-Item -Recurse` で直接コピー

**試したこと**: `docs/` フォルダが存在しない状態で `Copy-Item -Recurse` を実行

**結果**: 失敗

**理由**: コピー先ディレクトリが存在しないとエラーになる

---

### アプローチB: `docs/` を事前作成してからコピー

**試したこと**: `New-Item -ItemType Directory` で `docs/` を作成後、`Copy-Item -Path "templates\*" -Recurse` を実行

**結果**: 部分的に失敗

**理由**: `-Recurse` オプションにより `actions/` 配下のファイルが `docs/` 直下にも重複展開され、`docs/README.md` も誤って削除してしまった

---

### アプローチC: 直下のファイルを個別処理（成功）

**試したこと**: 重複ファイルを `Get-ChildItem -File | Remove-Item` で削除後、不足した `README.md` を `npx degit` で再取得してコピー

**結果**: 成功

**コード例**:
```powershell
# 1. テンプレートを一時フォルダに取得
npx degit 1ft-seabass/my-ai-collaboration-patterns/patterns/docs-structure _tmp_degit --force

# 2. docs/ を作成してテンプレートをコピー
New-Item -ItemType Directory -Path ".\docs" -Force
Copy-Item -Path ".\_tmp_degit\templates\*" -Destination ".\docs\" -Recurse -Force

# 3. 重複した直下ファイルを削除
Get-ChildItem -Path ".\docs" -File | Remove-Item -Force

# 4. README.md を再取得して配置
npx degit 1ft-seabass/my-ai-collaboration-patterns/patterns/docs-structure _tmp_degit --force
Copy-Item -Path ".\_tmp_degit\templates\README.md" -Destination ".\docs\README.md" -Force

# 5. 一時フォルダを削除
Remove-Item -Path ".\_tmp_degit" -Recurse -Force
```

## 解決策

`npx degit` で `1ft-seabass/my-ai-collaboration-patterns` の `patterns/docs-structure` を取得し、`templates/` 配下のみを `docs/` 直下に配置した。

**実装場所**: `docs/`

**最終的なディレクトリ構造**:
```
docs/
├── README.md
├── actions/
│   ├── README.md
│   ├── 00_session_end.md
│   ├── 01_git_push.md
│   ├── check_my_security_prepare_level.md
│   ├── dev_refactoring.md
│   ├── dev_review.md
│   ├── dev_security.md
│   ├── dev_testing.md
│   ├── doc_letter.md
│   ├── doc_note.md
│   ├── doc_note_and_commit.md
│   ├── git_commit.md
│   └── help.md
├── letters/
│   ├── README.md
│   └── TEMPLATE.md
├── notes/
│   ├── README.md
│   └── TEMPLATE.md
└── tasks/
    ├── README.md
    └── TEMPLATE.md
```

**主なポイント**:
1. `templates/` というフォルダ名を作らず、中身を `docs/` 直下に直接配置
2. 初期段階では一般化されたテンプレートをそのまま使用（カスタマイズは後回し）
3. 一時フォルダ `_tmp_degit` は作業後に削除済み

## 学び

- `Copy-Item -Recurse` はコピー先が存在しない場合エラーになるため、事前にディレクトリ作成が必要
- サブディレクトリを持つフォルダを `-Recurse` コピーすると、サブディレクトリ内のファイルが親にも展開されることがある（PowerShell の挙動）
- `npx degit` はサブディレクトリ単位でも取得できるため、モノレポ形式のテンプレートリポジトリとの相性が良い

## 今後の改善案

- プロジェクトが成熟したら各テンプレートの内容をプロジェクト固有の内容にカスタマイズする
- `docs/actions/` の指示書をプロジェクトのワークフローに合わせて調整する

## 関連ドキュメント

- [テンプレート元リポジトリ](https://github.com/1ft-seabass/my-ai-collaboration-patterns/tree/main/patterns/docs-structure)
- [docs/README.md](../README.md)

---

**最終更新**: 2026-06-26
**作成者**: AI (Bob)
