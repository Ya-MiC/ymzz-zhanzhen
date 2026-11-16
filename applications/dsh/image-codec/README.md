# 真正 permissive 的 DSH 影像 adapter / real image replacement

新碼 MIT。這是對完整 DSH `attachment-local` **實際使用的 Sharp subset** 的實作，不假稱相容整個 Sharp API。完整原版 21,632 檔及原有 Sharp 測試不變；只有衍生 build copy 的唯一 runtime consumer 改用本套件，Sharp 留 dev-only 做獨立 fixture／oracle，其他 CUA/agent 功能未刪。

- image-rs 0.25.10：PNG/JPEG/GIF/WebP 全 raster decode；EXIF 8 種方向、16-bit→8-bit、alpha、動畫第一幀、比例 Lanczos3 resize/no enlargement。
- moxcms：實際 ICC RGB/gray/CMYK→sRGB，zune-jpeg 原始 CMYK；不是刪 profile 假裝已轉色。
- libwebp（BSD C codec，**不是 libvips**）：真正 lossy WebP，quality 85/75/60、method 0；JPEG 同品質階梯。輸出剝除 metadata。
- 子程序 stdin/stdout JSON/base64，無網路／檔案讀取介面；20秒、輸入／輸出大小與 pixels 上限，受控 EXE path、乾淨環境，實體 binary 從 app.asar.unpacked 啟動。這不是 OS sandbox 或任意影像的形式化安全證明。
- `node scripts/build-image-codec.mjs` 先核實完整 Cargo.lock licenses，再 cargo `--locked` 編譯。Rust 1.100.0＋C compiler；不得用舊 rustc 1.85 假裝可 build。
- 47 crates 固定 checksums、實際 license alternatives/notices。保留 libwebp vendor COPYING/PATENTS/AUTHORS、各 crate metadata 與 Rust 原始 standard-library notices（其 broad source inventory 包含非本平台元件，不代表全部被連入 Windows）。wrapper MIT 不重標 vendor C。
- **16 dedicated tests pass**；真正上游 `vitest run packages/attachment/attachment-local/tests` **98 pass, 1 inherited skip**。檢驗四格式、orientation、16-bit alpha、ICC pixel comparison、CMYK、失敗輸入；並非只測自造 mock。Windows 尚需下次 CI 結果，不能將 Linux 結果冒稱 Windows pass。

`codec-sources.lock.json`／`THIRD_PARTY_NOTICES.txt` 是 build 產生且隨包附帶的 provenance；binary 不進 Git。`evidence/image-codec-license-linux.json` 是實際 Linux build 記錄，Windows 會另產證據。npm graph clean 不覆蓋 Electron/LibreOffice 原生 payload；另有更嚴格 packaged gate，不能據此宣稱全產品 MIT 或已合格分發。

English: A functional, bounded image-rs/moxcms/libwebp implementation of the real DSH attachment pipeline, not a disabled optional dependency or relabeled Sharp binary. Source archive and original fixture tests are retained. Actual transforms and regressions are tested; no claim of complete Sharp compatibility, OS isolation, Windows qualification, or an all-permissive Electron/Office product follows from a clean codec/npm audit.

## CMYK / native brand follow-up

Current codec contains 48 locked crates, plus the actual pinned CC0 default CMYK display profile from [saucecontrol/Compact-ICC-Profiles](https://github.com/saucecontrol/Compact-ICC-Profiles), commit `bdd84663061bc4ae95ca70decff54f581e27f702`. Its original license/readme/profile bytes and hashes are retained under `third_party/compact-icc-profiles`; this is explicitly a partial snapshot, not the entire profile repository. The build validates all bytes and includes them in source fingerprint and notices.

19 real codec tests now include independently checked embedded-CMYK ICC RGB pixels, byte-identical output with the SAME profile used as explicit unprofiled fallback, and asymmetric EXIF pixel positions for all seven nontrivial rotations/mirrors. The fixture manually embeds and asserts the exact ICC bytes: Sharp's `withIccProfile` followed by CMYK output otherwise silently chooses a different profile. Do not claim all implicit CMYK defaults or all rendering engines are pixel-identical; moxcms and lcms interpolation can differ. All 98 upstream attachment assertions pass (one inherited skip unchanged).
