//! MIT. Deterministic local document gate; no model, OCR, network or registry operations.
use serde_json::{json, Value};
use ymzz_core::integrity::compute_row_hash;

pub fn evaluate(input: &Value) -> Result<Value, String> {
    let text = input["text"].as_str().ok_or("TEXT_REQUIRED")?;
    if text.len() > 1_048_576 { return Err("TEXT_TOO_LARGE".into()); }
    let lines: Vec<&str> = text.lines().filter(|l| !l.trim().is_empty()).collect();
    // Produce a verifiable digest and simple local text inventory, not invented accounting/OCR.
    let words = text.split_whitespace().count();
    let row = json!({"text":text,"lines":lines.len(),"words":words});
    Ok(json!({"kind":"offline-text-inventory", "lines":lines.len(),"words":words,
        "row_hash":compute_row_hash("", &row),"input_hash":compute_row_hash("", input),
        "gate_passed":!text.trim().is_empty(), "engine":"ymzz-core/integrity"}))
}

pub fn stdio() {
    use std::io::{self, Read};
    let mut s=String::new();
    let result=io::stdin().take(1_100_000).read_to_string(&mut s).map_err(|_|"READ_ERROR".to_string())
        .and_then(|_|serde_json::from_str::<Value>(&s).map_err(|_|"INVALID_JSON".into()))
        .and_then(|v|evaluate(&v));
    match result { Ok(v)=>println!("{}",v), Err(e)=>{eprintln!("{}",e);std::process::exit(2)} }
}
#[cfg(test)]
mod tests {
    use super::*;
    #[test] fn stable_real_core_hash(){let v=json!({"text":"Hello\n湛箴"});let a=evaluate(&v).unwrap();assert_eq!(a,evaluate(&v).unwrap());assert_eq!(a["lines"],2);assert_eq!(a["gate_passed"],true);assert_eq!(a["row_hash"].as_str().unwrap().len(),64);}
    #[test] fn empty_fails_gate(){assert_eq!(evaluate(&json!({"text":"  "})).unwrap()["gate_passed"],false);}
    #[test] fn rejects_invalid(){assert!(evaluate(&json!({})).is_err());assert!(evaluate(&json!({"text":"a".repeat(1_048_577)})).is_err());}
}
