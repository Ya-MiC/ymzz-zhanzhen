//! 自動標籤：字雙元組 TF-IDF 取 top-3 關鍵詞 + 規則詞表（config 可改）。

use crate::model::Tag;
use std::collections::HashMap;

/// 載入規則詞表（config/action-words.txt，每行一詞）
pub fn load_action_words(path: &str) -> Vec<String> {
    std::fs::read_to_string(path)
        .ok()
        .map(|s| {
            s.lines()
                .map(|l| l.trim().to_string())
                .filter(|l| !l.is_empty())
                .collect()
        })
        .unwrap_or_default()
}

/// 中文雙元組（相鄰兩個 CJK 字元）
pub fn cjk_bigrams(text: &str) -> Vec<String> {
    let chars: Vec<char> = text.chars().collect();
    let mut out = Vec::new();
    for w in chars.windows(2) {
        if is_cjk(w[0]) && is_cjk(w[1]) {
            out.push(w.iter().collect());
        }
    }
    out
}

pub fn is_cjk(c: char) -> bool {
    matches!(
        c as u32,
        0x4E00..=0x9FFF | 0x3400..=0x4DBF | 0xF900..=0xFAFF | 0x3000..=0x303F
    )
}

/// TF-IDF 簡化版：對單一文件，以詞頻正規化後取 top-3
pub fn auto_tags(text: &str, top: usize, action_words: &[String]) -> Vec<Tag> {
    let mut freq: HashMap<String, usize> = HashMap::new();

    // 字雙元組
    for bg in cjk_bigrams(text) {
        *freq.entry(bg).or_insert(0) += 1;
    }

    // 拉丁單詞
    for word in text.split_whitespace() {
        let w: String = word.chars().filter(|c| c.is_alphanumeric()).collect();
        if w.len() >= 2 {
            *freq.entry(w.to_lowercase()).or_insert(0) += 1;
        }
    }

    // 規則詞表加權
    for aw in action_words {
        if text.contains(aw) {
            *freq.entry(aw.clone()).or_insert(0) += 2;
        }
    }

    let mut items: Vec<(String, usize)> = freq.into_iter().collect();
    items.sort_by(|a, b| b.1.cmp(&a.1));

    items
        .into_iter()
        .take(top)
        .map(|(name, _)| Tag { id: None, name })
        .collect()
}
