const sharp = require('sharp');

const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1080;

// 4枚のPNG画像を2×2に結合
async function combineImages(files) {
  // 画像の形式とサイズを確認
  for (const file of files) {
    let metadata;

    try {
      metadata = await sharp(file.buffer).metadata();
    } catch {
      const error = new Error('画像ファイルを読み込めません。');
      error.statusCode = 400;
      throw error;
    }

    if (
      metadata.format !== 'png' ||
      metadata.width !== IMAGE_WIDTH ||
      metadata.height !== IMAGE_HEIGHT
    ) {
      const error = new Error(
        'すべての画像をPNG形式の1920×1080にしてください。'
      );
      error.statusCode = 400;
      throw error;
    }
  }

  // それぞれの画像を配置する位置
  const positions = [
    { left: 0, top: 0 },
    { left: IMAGE_WIDTH, top: 0 },
    { left: 0, top: IMAGE_HEIGHT },
    { left: IMAGE_WIDTH, top: IMAGE_HEIGHT }
  ];

  // Sharpに渡す画像データを作る
  const compositeImages = files.map((file, index) => ({
    input: file.buffer,
    left: positions[index].left,
    top: positions[index].top
  }));

  // 2×2に結合してPNG形式で返す
  const output = await sharp({
    create: {
      width: IMAGE_WIDTH * 2,
      height: IMAGE_HEIGHT * 2,
      channels: 4,
      background: { r: 0, g: 0, b: 0, alpha: 0 }
    }
  })
    .composite(compositeImages)
    .png()
    .toBuffer();

  return output;
}

module.exports = { combineImages };