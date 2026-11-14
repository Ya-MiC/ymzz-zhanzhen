# 第三方依賴與資產授權

## 設計系統（唯讀副本）

來源：`github.com/Ya-MiC/ymzz-wenrun-design-skill`（MIT）
路徑：`vendor/ymzz-wenrun-design-skill/`
內容：`tokens.css` 與 `LICENSE`
授權：MIT（與本專案相容）

本專案嚴格遵守「色不另造」：八個鎖定色僅取自 `tokens.css`，未經許可不自造新色值。

## 程式依賴

Rust 與 npm 生態依賴各自隨專案鎖定檔（`Cargo.lock`、`pnpm-lock.yaml`）分發，授權以各套件本身為準。CI 透過 `cargo-deny` 與 `pnpm licenses` 掃描，僅允許寬鬆授權（MIT、Apache-2.0、BSD、ISC），禁止 GPL、AGPL、SSPL、BUSL、Commons Clause、CC-NC、無授權檔。

## 字體與圖標

預設使用系統字體，避免字體授權風險。如後續加入第三方字體或圖標，須在此處註明出處與授權。
