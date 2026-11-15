const express = require('express');
const multer = require('multer');

const { combineImages } = require('../services/imageService');

const router = express.Router();

// アップロードされた画像をメモリ上で受け取り
const upload = multer({
  storage: multer.memoryStorage(),
  limits: {
    files: 4,
    fileSize: 15 * 1024 * 1024
  },
  fileFilter: (req, file, callback) => {
    if (file.mimetype !== 'image/png') {
      const error = new Error(
      'PNG形式の画像だけアップロードできます。'
      );
      error.statusCode = 400;

      return callback(error);
    }

    callback(null, true);
  }
});

// 画像結合
router.post('/', upload.array('images', 4), async (req, res, next) => {
  try {
    // 画像が4枚あるか確認
    if (!req.files || req.files.length !== 4) {
      return res.status(400).json({
        error: '画像を4枚選択してください。'
      });
    }

    // 画像結合処理を呼び出し
    const output = await combineImages(req.files);

    // PNG画像として返す
    res.set({
      'Content-Type': 'image/png',
      'Content-Disposition': 'attachment; filename="combined.png"'
    });

    res.send(output);

  } catch (error) {
    next(error);
  }
});

module.exports = router;