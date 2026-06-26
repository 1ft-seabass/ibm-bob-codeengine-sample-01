# ibm-ce-simple-nodejs-hono-base

IBM Code Engine 向けのシンプルな Node.js Hono ベースリポジトリです。

## 特徴

- Hono ウェブフレームワーク（軽量・高速）
- Node.js 22 Alpine ベースイメージ
- 静的ファイル配信対応

## ローカル開発

```bash
npm install
npm start
```

http://localhost:8080 でアクセスできます。

## IBM Code Engine へのデプロイ

このリポジトリの URL をソースコードとして指定すると、Dockerfile を使って自動的にビルド・デプロイされます。
