//! report.rs — 生成 docs/REDBLUE_REPORT.md

use crate::red_team::{default_cases, AttackCategory};
use std::collections::HashMap;
use std::fs;
use std::path::Path;

pub fn generate_report(out_dir: &Path, results: &HashMap<String, bool>) {
    let mut by_category: HashMap<AttackCategory, (usize, usize)> = HashMap::new();
    for case in &default_cases() {
        let entry = by_category.entry(case.category.clone()).or_insert((0, 0));
        let passed = results.get(&case.id).copied().unwrap_or(false);
        if passed {
            entry.1 += 1;
        }
        entry.0 += 1;
    }

    let mut md = String::from("# 紅藍對抗報告 (REDBLUE_REPORT.md)\n\n");
    md.push_str("自動生成，CI 每次運行與每晚定時產出。\n\n");
    md.push_str("| 類別 | 用例數 | 通過 | 失敗 | 狀態 |\n");
    md.push_str("|---|---|---|---|---|\n");
    let mut all_pass = true;
    for (cat, (total, passed)) in &by_category {
        let failed = total - passed;
        if failed > 0 {
            all_pass = false;
        }
        let status = if failed == 0 { "通過" } else { "失敗" };
        md.push_str(&format!(
            "| {:?} | {} | {} | {} | {} |\n",
            cat, total, passed, failed, status
        ));
    }
    md.push_str(&format!("\n**總體：{}**\n", if all_pass { "全部通過" } else { "存在失敗，CI 應失敗" }));

    let _ = fs::create_dir_all(out_dir);
    let path = out_dir.join("REDBLUE_REPORT.md");
    fs::write(&path, md).expect("寫入 REDBLUE_REPORT.md 失敗");
    println!("紅藍報告已生成：{}", path.display());
}
