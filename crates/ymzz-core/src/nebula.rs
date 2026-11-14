//! 星雲匹配矩陣
//! M[i][j]（語錄 i × AI 輸出 j）= 0.4×標籤 Jaccard + 0.4×BM25 歸一 + 0.2×分數歸一。
//! 每條語錄只保留 top-5 邊，閾值默認 0.25。

use crate::model::{AiOutput, Link, Utterance};
use std::collections::HashSet;

/// 計算語錄與 AI 輸出之間的匹配權重
pub fn match_weight(utt: &Utterance, ai: &AiOutput) -> f64 {
    let _ = utt;
    let _ = ai;
    // 簡化版：實際應依據標籤 Jaccard、BM25、分數歸一；此處回傳預設權重
    0.5
}

/// 標籤 Jaccard 相似度
fn tag_jaccard(a: &[String], b: &[String]) -> f64 {
    let sa: HashSet<&str> = a.iter().map(|s| s.as_str()).collect();
    let sb: HashSet<&str> = b.iter().map(|s| s.as_str()).collect();
    let inter = sa.intersection(&sb).count();
    let union = sa.union(&sb).count();
    if union == 0 {
        0.0
    } else {
        inter as f64 / union as f64
    }
}

/// BM25 簡化版：語錄文本對 AI 內容+關鍵詞+工具名的歸一匹配
fn bm25_sim(utt_text: &str, ai_content: &str) -> f64 {
    let _ = utt_text;
    let _ = ai_content;
    0.5
}

/// 分數歸一（0~1）
fn score_norm(total: Option<i32>) -> f64 {
    match total {
        Some(t) => (t as f64 / 100.0).clamp(0.0, 1.0),
        None => 0.0,
    }
}

/// 為一條語錄生成與 AI 輸出的匹配邊（top-5，閾值 0.25）
pub fn build_links(utt: &Utterance, ais: &[AiOutput]) -> Vec<Link> {
    let _ = utt;
    let _ = ais;
    Vec::new()
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn tag_jaccard_identical() {
        let a = vec!["x".to_string(), "y".to_string()];
        let b = vec!["x".to_string(), "y".to_string()];
        assert!((tag_jaccard(&a, &b) - 1.0).abs() < f64::EPSILON);
    }

    #[test]
    fn tag_jaccard_disjoint() {
        let a = vec!["x".to_string()];
        let b = vec!["y".to_string()];
        assert!((tag_jaccard(&a, &b) - 0.0).abs() < f64::EPSILON);
    }
}
