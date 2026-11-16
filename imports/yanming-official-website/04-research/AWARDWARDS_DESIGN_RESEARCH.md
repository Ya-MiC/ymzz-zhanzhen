# 設計研究報告 — Awwwards 審美趨勢與 GitHub 優秀庫

查詢日期：2026-11-14  
來源：awwwards.com（首頁 + 網站目錄）、GitHub 搜尋 API  
用途：為晏銘湛箴作品（官網、無用之用、無無即無）打上審美與技術標籤

---

## 一、Awwwards 審美趨勢觀察

### 1. 字體
- 使用 **Inter Tight 可變字體**（`InterTight-VariableFont_wght.ttf`，font-weight 100–900）
- 標題字級極大：`clamp(30px, 3.94px + 5.21vw, 104px)`（intro-texts）
- 副標題：`clamp(18px, 14.48px + 0.70vw, 28px)`
- 正文：`font-size: var(--text-size-primary)`，`line-height: 140%`–`150%`
- 英文標題常用 `text-transform: uppercase` 配上 `letter-spacing` 間距

### 2. 色彩
- 主色調：`--color-primary`（首頁主題色 `#3ea094` 青綠色）
- 背景層次：`--bg-primary`、`--bg-secondary`、`--bg-3rd`、`--bg-4rd` 多層背景
- 強調色：`--color-learn`、`--color-connect`、`#FA5D29`（橘紅）
- 文字：`--color-white`（深色背景）、深色文字在淺色背景
- 卡片背景：`#f8f8f8`、`#ededed`、`rgba(255,255,255,0.9)`

### 3. 圓角與邊框
- `--rounded-small`、`--rounded-normal`、`--rounded-large` 三級圓角
- 卡片：`border-radius: var(--rounded-normal)` 或 `var(--rounded-large)`
- 邊框：`1px solid var(--border-gray)` 或 `1px solid #383838`
- 圖片：`border-radius: var(--rounded-large)`，`overflow: hidden`

### 4. 佈局
- 12 欄 Grid 系統（`.grid__col-1` 至 `.grid__col-12`）
- 響應式斷點：576px / 768px / 1024px / 1280px
- `clamp()` 流動字級與間距
- Marquee 捲動文字頂部橫幅（`.marquee-top`）
- 畫廊網格：`.gallery-site`、`grid-typography`（排版網格）
- Modal：多尺寸（small/medium/large/x-large/fullscreen/bottom）

### 5. 動效與交互
- `transition: all .3s` 為主要動效時長
- 圖片懸停：`filter: brightness(80%)` 或 `brightness(90%)`
- 縮放：`transform: scale(1.05)`
- 漸現：`opacity` + `transform` 組合
- `overscroll-behavior: contain`

### 6. 組件模式
- Card（卡片）：`.card-site`、`card-directory`、`card-academy`、`card-jury`、`card-video`
- 導航：頂部導航 + 漢堡選單 + 下拉選單
- 篩選器：`.filter-box`（手風琴式展開）
- 標籤：`.c-tags`、`.dropdown-tags`
- 徽章：`.ribbon-pro`（72×82px）
- 吐司通知：`.snackbar-msg`
- 提示：`.tooltip`

---

## 二、GitHub 優秀庫審查（MIT 授權優先）

### 2.1 Vue 設計系統

| 庫名 | 所有者 | Stars | 授權 | 用途 | URL |
|------|--------|-------|------|------|-----|
| vue-design-system | arielsalminen | 2,194 | MIT | Vue.js UI 設計系統工具 | https://github.com/arielsalminen/vue-design-system |
| vue-design-system-demo | bradfrost | 16 | MIT | Vue 設計系統演示 | https://github.com/bradfrost/vue-design-system-demo |
| lux | pulibrary | 8 | MIT | Princeton 大學圖書館 Vue 組件 | https://github.com/pulibrary/lux |

### 2.2 無障礙組件庫（Reka UI / Radix Vue 後繼）

| 庫名 | 所有者 | Stars | 授權 | 用途 | URL |
|------|--------|-------|------|------|-----|
| reka-ui | unovue | 6,957 | MIT | Vue 無障礙組件庫（原 Radix Vue） | https://github.com/unovue/reka-ui |
| ui | nuxt | 7,075 | MIT | Nuxt UI（基於 Reka UI + Tailwind） | https://github.com/nuxt/ui |
| sigma-ui | sigma-hub | 102 | MIT | 基於 Reka UI 的 Vue 組件 | https://github.com/sigma-hub/sigma-ui |

### 2.3 Tauri + Vue 模板與專案

| 庫名 | 所有者 | Stars | 授權 | 用途 | URL |
|------|--------|-------|------|------|-----|
| tauri-vue-template | Uninen | 494 | 未標註 | Tauri + Vue + TypeScript + Tailwind 4 模板 | https://github.com/Uninen/tauri-vue-template |
| yt-dlp-gui | imsyy | 700 | MIT | Tauri + Vue 桌面程序（影片下載器） | https://github.com/imsyy/yt-dlp-gui |
| manbo-tts | xmimu | 118 | MIT | Tauri + Vue 3 語音生成應用 | https://github.com/xmimu/manbo-tts |
| sunshine-control-panel | qiin2333 | 456 | MIT | Tauri + Vue 3 大屏桌面管理器 | https://github.com/qiin2333/sunshine-control-panel |
| tauri-vue-template | skymen | 104 | 未標註 | Tauri Vue 模板 | https://github.com/skymen/tauri-vue-template |

### ⚠️ 排除（非 MIT 授權）
- apple-matting（GPL-3.0）
- ZeroLaunch-rs（GPL-3.0）
- schematic-manager（AGPL-3.0）
- Murge（GPL-3.0）

---

## 三、為晏銘湛箴作品打上的標籤

### 3.1 官網（yanming-official-website）
- **審美標籤**：溫潤設計系統、四套色票（雲箋／陶土）、44px 熱區、水墨暈染動畫、Inter Tight 可變字體、12 欄 Grid、clamp 流動字級、圓角漸層卡片
- **技術標籤**：單檔 HTML、內嵌 CSS、GitHub Pages、MIT 授權
- **參考來源**：awwwards.com 審美趨勢、溫潤設計系統 v7.1

### 3.2 無無即無（ymzz-wuwong-ji-wung）
- **審美標籤**：溫潤設計系統、四套色票、44px 熱區、淺色／深色切換
- **技術標籤**：Tauri 2 + Rust + Vue 3 + TypeScript、SQLite 儲存、本地優先、MIT 授權
- **參考庫**：tauri-vue-template (Uninen)、reka-ui (unovue)、yt-dlp-gui (imsyy)

### 3.3 無用之用（ymzz-wuyong-zhi-yong）
- **審美標籤**：溫潤設計系統、技能池動態監測介面
- **技術標籤**：Python ≥3.11、MIT 授權、零遙測、skills.sh 排行榜監測
- **參考庫**：flowkit-labs/skills (reddit-automation)、vercel-labs/agent-browser

---

## 四、建議採用的開源庫（MIT 授權，可商用）

| 用途 | 建議庫 | 授權 | 理由 |
|------|--------|------|------|
| 無障礙組件底層 | reka-ui (unovue) | MIT | 6,957 stars，之前叫 Radix Vue，成熟穩定 |
| Nuxt UI 組件 | ui (nuxt) | MIT | 7,075 stars，基於 Reka UI + Tailwind |
| Tauri + Vue 模板 | tauri-vue-template (Uninen) | 未標註 | 494 stars，TypeScript + Tailwind 4 + CI/CD |
| Tauri + Vue 參考專案 | yt-dlp-gui (imsyy) | MIT | 700 stars，實際桌面程序實作 |
| Vue 設計系統參考 | vue-design-system (arielsalminen) | MIT | 2,194 stars，設計系統最佳實踐 |

---

## 五、下一步行動

1. 將 Reka UI 作為無無即無的組件底層（MIT 授權，無障礙內建）
2. 參考 tauri-vue-template 優化 Tauri 2 + Vue 3 骨架結構
3. 將 awwwards 的 clamp 流動字級、多層背景、圓角卡片融入官網與產品 UI
4. 將上述標籤寫入各倉庫 README 與 AGENTS.md
