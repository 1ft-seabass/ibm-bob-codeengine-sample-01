// Hono フレームワーク本体（Express の代わり）
const { Hono } = require('hono');
// Node.js でサーバーを起動するための関数
const { serve } = require('@hono/node-server');
// 静的ファイル配信用のミドルウェア
const { serveStatic } = require('@hono/node-server/serve-static');

// Hono アプリケーションの初期化（Express は関数呼び出し、Hono はクラス）
const app = new Hono();

// 静的ファイル配信の設定（public フォルダの内容を公開）
app.use('/*', serveStatic({ root: './public' }));

// API エンドポイントの例（c は Context オブジェクト、Express の req/res を統合したもの）
app.get('/api/hello', (c) => {
  return c.json({ message: 'Hello from Hono!' });
});

// ポート設定（IBM Code Engine が PORT 環境変数を自動設定）
const port = process.env.PORT || 8080;

// サーバー起動（Hono は Web 標準の fetch API を使用）
serve({
  fetch: app.fetch,
  port: port,
}, (info) => {
  console.log("server start!");
  console.log(`app listening at http://localhost:${info.port}`);
});