const express = require('express');
const path = require('path');
const multer = require('multer');

const combineRouter = require('./routes/combine');

const app = express();
const PORT = process.env.PORT || 3000;

// publicフォルダのファイルを公開
app.use(express.static(path.join(__dirname, 'public')));

// 画像結合APIを登録
app.use('/combine', combineRouter);

// エラー処理
app.use((error, req, res, next) => {
  // すでにレスポンスを返している場合
  if (res.headersSent) {
    return next(error);
  }

  // Multerのアップロードエラー
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: '画像1枚あたり15MB以内にしてください。'
      });
    }

    return res.status(400).json({
      error: 'PNG画像を4枚まで選択してください。'
    });
  }

  // 入力画像に関するエラー
  if (error.statusCode === 400) {
    return res.status(400).json({
      error: error.message
    });
  }

  // 予期しないサーバーエラー
  console.error(error);

  return res.status(500).json({
    error: 'サーバーでエラーが発生しました。時間をおいて再度お試しください。'
  });
});

// サーバーを起動
app.listen(PORT, '0.0.0.0', () => {
  console.log(`Server is running on port ${PORT}`);
});