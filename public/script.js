const form = document.getElementById('upload-form');

const imageInputs = [
  document.getElementById('images'),
  document.getElementById('image-2'),
  document.getElementById('image-3'),
  document.getElementById('image-4')
];

const preview = document.getElementById('preview');
const statusElement = document.getElementById('status');
const submitButton = document.getElementById('submit-button');

const IMAGE_WIDTH = 1920;
const IMAGE_HEIGHT = 1080;

const positionNames = [
  '① 左上',
  '② 右上',
  '③ 左下',
  '④ 右下'
];

const selectedFiles = [null, null, null, null];
const previewUrls = [null, null, null, null];

// プレビューを更新
function updatePreview() {
  preview.innerHTML = '';

  selectedFiles.forEach((file, index) => {
    const item = document.createElement('div');
    item.className = 'preview-item';

    const name = document.createElement('div');
    name.textContent = positionNames[index];

    item.appendChild(name);

    if (file) {
      const thumbnail = document.createElement('img');
      thumbnail.src = previewUrls[index];
      thumbnail.alt = file.name;

      const fileName = document.createElement('div');
      fileName.textContent = file.name;

      item.appendChild(thumbnail);
      item.appendChild(fileName);
    } else {
      const placeholder = document.createElement('div');
      placeholder.className = 'preview-placeholder';
      placeholder.textContent = '画像未選択';

      item.appendChild(placeholder);
    }

    preview.appendChild(item);
  });

  submitButton.disabled = selectedFiles.some(file => !file);
}

// 各入力欄の画像選択
imageInputs.forEach((input, index) => {
  input.addEventListener('change', async () => {
    const file = input.files[0];

    if (!file) return;

    // 選び直した場所の古い画像を解除
    selectedFiles[index] = null;

    if (previewUrls[index]) {
      URL.revokeObjectURL(previewUrls[index]);
      previewUrls[index] = null;
    }

    updatePreview();

    // PNG形式か確認
    if (file.type !== 'image/png') {
      statusElement.textContent =
        'PNG形式の画像だけ選択できます。';

      input.value = '';
      return;
    }

    const url = URL.createObjectURL(file);
    const image = new Image();

    image.src = url;

    // 画像を読み込み
    try {
      await image.decode();
    } catch {
      URL.revokeObjectURL(url);
      input.value = '';

      statusElement.textContent =
        '画像を読み込めませんでした。';

      return;
    }

    // 画像サイズを確認
    if (
      image.naturalWidth !== IMAGE_WIDTH ||
      image.naturalHeight !== IMAGE_HEIGHT
    ) {
      URL.revokeObjectURL(url);
      input.value = '';

      statusElement.textContent =
        positionNames[index] +
        'の画像を1920×1080にしてください。';

      return;
    }

    // 選択した画像を保存
    selectedFiles[index] = file;
    previewUrls[index] = url;

    updatePreview();

    const count = selectedFiles.filter(file => file).length;

    if (count === 4) {
      statusElement.textContent =
        '4枚すべての画像を確認しました。結合できます。';
    } else {
      statusElement.textContent =
        positionNames[index] +
        'の画像を確認しました。現在 ' +
        count +
        '枚選択済みです。';
    }
  });
});

// 画像を結合してダウンロード
form.addEventListener('submit', async (event) => {
  event.preventDefault();

  if (selectedFiles.some(file => !file)) {
    statusElement.textContent =
      '4か所すべてに画像を選択してください。';
    return;
  }

  const formData = new FormData();

  // 左上、右上、左下、右下の順番で送信
  selectedFiles.forEach(file => {
    formData.append('images', file);
  });

  submitButton.disabled = true;
  statusElement.textContent = '画像を結合しています...';

  try {
    const response = await fetch('/combine', {
      method: 'POST',
      body: formData
    });

    if (!response.ok) {
      const result = await response.json();
      throw new Error(result.error || '結合に失敗しました。');
    }

    const blob = await response.blob();
    const downloadUrl = URL.createObjectURL(blob);

    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = 'combined.png';

    document.body.appendChild(link);
    link.click();
    link.remove();

    setTimeout(() => {
      URL.revokeObjectURL(downloadUrl);
    }, 1000);

    statusElement.textContent =
      '結合が完了しました。ダウンロードを開始しました。';

  } catch (error) {
    statusElement.textContent = error.message;

  } finally {
    updatePreview();
  }
});

// 初期状態を設定
updatePreview();