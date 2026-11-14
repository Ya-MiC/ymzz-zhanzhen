//! 默認評分公式（config/scoring.default.rhai 與 scoring.rs 必須等價，並有一致性測試）
//!
//! 分詞：中文字雙元組 + 拉丁單詞。四項各 0~1：
//! - specificity = clamp((數字/日期/專名 token 數 + 字數/80) / 6)
//! - recurrence = clamp(近似語句數 / 5)，近似 = 餘弦相似度 > 0.6，取前 5
//! - actionability = clamp(命中動作詞表個數 / 3)
//! - novelty = 1 − 與歷史語句的最大餘弦相似度（字雙元組 TF-IDF）
//! total = round(100 × (0.30·specificity + 0.20·recurrence + 0.25·actionability + 0.25·novelty))

use crate::tagger::{cjk_bigrams, is_cjk};
use crate::model::Utterance;
use std::collections::HashMap;

/// 評分輸出
#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ScoreResult {
    pub total: i32,
    pub parts: ScoreParts,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ScoreParts {
    pub specificity: f64,
    pub recurrence: f64,
    pub actionability: f64,
    pub novelty: f64,
}

fn clamp01(v: f64) -> f64 {
    v.clamp(0.0, 1.0)
}

/// 動作詞表（config/action-words.txt 的預設內容）
pub fn default_action_words() -> Vec<&'static str> {
    vec!["做", "建", "寫", "改", "買", "學", "去", "開始", "完成", "設計", "實作", "測試"]
}

/// 字雙元組 TF-IDF 向量（簡化：以詞頻正規化）
fn tfidf_vec(text: &str) -> HashMap<String, f64> {
    let mut freq: HashMap<String, f64> = HashMap::new();
    for bg in cjk_bigrams(text) {
        *freq.entry(bg).or_insert(0.0) += 1.0;
    }
    for word in text.split_whitespace() {
        let w: String = word.chars().filter(|c| c.is_alphanumeric()).collect();
        if w.len() >= 2 {
            *freq.entry(w.to_lowercase()).or_insert(0.0) += 1.0;
        }
    }
    let norm: f64 = freq.values().map(|v| v * v).sum::<f64>().sqrt();
    if norm > 0.0 {
        freq.iter_mut().for_each(|(_, v)| *v /= norm);
    }
    freq
}

/// 餘弦相似度
fn cosine(a: &HashMap<String, f64>, b: &HashMap<String, f64>) -> f64 {
    let mut dot = 0.0;
    for (k, v) in a {
        if let Some(w) = b.get(k) {
            dot += v * w;
        }
    }
    dot
}

/// 數字/日期/專名 token 數（簡化：連續數字序列）
fn count_numeric_named(text: &str) -> usize {
    let mut count = 0;
    let mut in_num = false;
    for c in text.chars() {
        if c.is_ascii_digit() {
            if !in_num {
                count += 1;
                in_num = true;
            }
        } else {
            in_num = false;
        }
    }
    count
}

/// 執行評分
pub fn score(text: &str, history: &[Utterance], action_words: &[&str]) -> ScoreResult {
    let char_count = text.chars().count() as f64;
    let numeric_named = count_numeric_named(text) as f64;

    // specificity
    let specificity = clamp01((numeric_named + char_count / 80.0) / 6.0);

    // actionability
    let mut action_hits = 0;
    for aw in action_words {
        if text.contains(*aw) {
            action_hits += 1;
        }
    }
    let actionability = clamp01(action_hits as f64 / 3.0);

    // novelty：與歷史最大餘弦相似度
    let vec = tfidf_vec(text);
    let max_sim = history
        .iter()
        .map(|u| cosine(&vec, &tfidf_vec(&u.text)))
        .fold(0.0, f64::max);
    let novelty = 1.0 - max_sim;

    // recurrence：近似語句數（餘弦 > 0.6），取前 5
    let similar_count = history
        .iter()
        .filter(|u| cosine(&vec, &tfidf_vec(&u.text)) > 0.6)
        .count()
        .min(5);
    let recurrence = clamp01(similar_count as f64 / 5.0);

    let total = (100.0
        * (0.30 * specificity + 0.20 * recurrence + 0.25 * actionability + 0.25 * novelty))
    .round() as i32;

    ScoreResult {
        total,
        parts: ScoreParts {
            specificity,
            recurrence,
            actionability,
            novelty,
        },
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    #[test]
    fn score_bounds() {
        let r = score("做一個寫作計畫，買書學習，開始寫作。", &[], &default_action_words());
        assert!(r.total >= 0 && r.total <= 100);
    }

    #[test]
    fn novelty_empty_history() {
        let r = score("hello world test", &[], &default_action_words());
        assert!((r.parts.novelty - 1.0).abs() < f64::EPSILON);
    }
}
