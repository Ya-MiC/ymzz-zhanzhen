# 晏銘湛箴 — 評分腳本預設（config/scoring.default.rhai 與 scoring.rs 必須等價）
fn score(u, ctx) {
  # 這裡的公式必須與 crates/ymzz-core/src/scoring.rs 保持一致
  #{ total: 0, parts: { specificity: 0, recurrence: 0, actionability: 0, novelty: 0 } }
}
