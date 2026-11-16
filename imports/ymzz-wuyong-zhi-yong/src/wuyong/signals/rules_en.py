"""英文規則（用戶文字通道 + 思考通道）。格式同 rules_zh。"""

USER_RULES = [
    {"id": "en_find_skill", "pattern": r"find a skill|find skills|skill for|skills? that can|looking for a skill",
     "score": 0.60, "hint": "user explicitly asks to find a skill"},
    {"id": "en_is_there", "pattern": r"is there (a|an|any)[^.?！?]{0,24}(skill|tool|package)|any existing (skill|tool)",
     "score": 0.55, "hint": "user asks if an existing skill/tool exists"},
    {"id": "en_how_do_i", "pattern": r"how do i|how to (?:do|set ?up|build|create|use|install|configure)\b|how can i",
     "score": 0.45, "hint": "user asks how to do X"},
    {"id": "en_help_me", "pattern": r"help me (?:do|build|create|set ?up|make|write)\b|make me a|create (?:me )?a",
     "score": 0.35, "hint": "user asks agent to build something"},
    {"id": "en_best_practice", "pattern": r"best practices?(?: for| on)\b|industry standard",
     "score": 0.45, "hint": "user asks for best practices"},
    {"id": "en_recommend", "pattern": r"recommend (?:a|an|me)|any (?:good |nice )?(?:tool|library|package) for",
     "score": 0.45, "hint": "user asks for a recommendation"},
    {"id": "en_capability", "pattern": r"can you (?:do|handle|use)\b|do you (?:know|have) (?:a|any)",
     "score": 0.30, "hint": "user probes agent capability"},
    {"id": "en_extend", "pattern": r"extend (?:your |the )?capabilit|add a skill|install a skill",
     "score": 0.55, "hint": "user wants to extend agent capabilities"},
]

THINKING_RULES = [
    {"id": "th_en_existing_skill", "pattern": r"maybe (?:there'?s |there is )a skill|existing skill|there (?:might|may) be (?:a|an) (?:skill|tool)|perhaps a skill",
     "score": 0.60, "hint": "thinking suspects an existing skill"},
    {"id": "th_en_look_for", "pattern": r"let me look for a (?:tool|skill)|look for a (?:tool|skill)|search for a (?:skill|tool|package)|check if (?:there'?s |there is )a (?:skill|tool)",
     "score": 0.65, "hint": "thinking decides to look for a tool/skill"},
    {"id": "th_en_unsure", "pattern": r"i'?m not sure how to|not sure how (?:to|this)|i don'?t know how to",
     "score": 0.55, "hint": "thinking admits uncertainty"},
    {"id": "th_en_best_practice", "pattern": r"(?:need|want|check) (?:the )?best practices?|standard approach (?:for|to)|reference implementation",
     "score": 0.50, "hint": "thinking wants domain best practice"},
    {"id": "th_en_gap", "pattern": r"beyond my (?:knowledge|capabilities)|i (?:can'?t|cannot) (?:do|verify) this|i lack (?:the|domain) ",
     "score": 0.50, "hint": "thinking admits capability gap"},
]
