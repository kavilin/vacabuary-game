# Vocabulary Game 🎮

一個互動式的詞彙學習遊戲，使用 Disney 風格的 3D 渲染圖片。

## 功能特色

- 🎯 三個難度等級（Easy, Medium, Hard）
- 🎨 650+ 個詞彙，每個都有精美的 Disney 風格圖片
- 🎲 隨機選擇 4 個詞彙進行遊戲
- 📱 響應式設計，支援各種裝置

## 技術棧

- **Framework**: Next.js 15
- **Styling**: CSS
- **Image Generation**: Hugging Face (FLUX.1-schnell)
- **Deployment**: Netlify / Vercel

## 本地開發

```bash
# 安裝依賴
npm install

# 啟動開發伺服器
npm run dev

# 開啟瀏覽器訪問
http://localhost:3000
```

## 部署

此專案是完全靜態的，無需環境變數或 API keys。

### Netlify
1. Push 到 GitHub
2. 在 Netlify 導入 repository
3. 自動部署完成

### Vercel
1. Push 到 GitHub
2. 在 Vercel 導入 repository
3. 自動部署完成

## 專案結構

```
├── app/
│   ├── api/generate-game/  # 遊戲 API（讀取本地資料）
│   ├── game/               # 遊戲頁面
│   └── page.js             # 首頁
├── components/
│   └── GameBoard.js        # 遊戲主要元件
├── data/
│   └── vocabulary.json     # 詞彙資料（650+ 詞）
├── public/
│   └── images/             # 所有圖片（650+ 張）
└── scripts/                # 開發腳本（僅本地使用）
    ├── generate_vocab.js
    ├── enhance_prompts.js
    └── download_images_hf.js
```

## 開發腳本

`scripts/` 資料夾中的腳本僅用於本地開發，需要 API keys：

- **Gemini API** (用於生成和分類詞彙)
- **Hugging Face Token** (用於生成圖片)

這些腳本不會部署到生產環境。

## License

MIT
