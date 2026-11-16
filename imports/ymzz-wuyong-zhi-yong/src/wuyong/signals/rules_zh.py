"""中文規則（用戶文字通道 + 思考通道）。

rule 欄位：
  id      規則識別字（英文，供日誌/JSON）
  pattern 正規式（不分大小寫）
  score   0~1，單一規則的意圖強度
  hint    人類可讀說明（繁中）
"""

USER_RULES = [
    {"id": "zh_how_to", "pattern": r"怎麼做|怎么做|怎樣做|如何做|怎麼實現|如何實現|怎么实现",
     "score": 0.45, "hint": "用戶在問某件事怎麼做"},
    {"id": "zh_existing", "pattern": r"有沒有現成|有没有现成|有無現成|有沒有[^。？?]{0,12}(skill|工具|套件)|有没有[^。？?]{0,12}(skill|工具|插件)",
     "score": 0.55, "hint": "用戶在找現成的東西"},
    {"id": "zh_make", "pattern": r"幫我做|幫我寫|幫我建|幫我生成|幫我做一個|幫我寫一個",
     "score": 0.40, "hint": "用戶要求製作某物，可能有現成 skill"},
    {"id": "zh_skill_word", "pattern": r"\bskill\b|技能包|技能|外掛|插件",
     "score": 0.30, "hint": "提到 skill／技能"},
    {"id": "zh_best_practice", "pattern": r"最佳實踐|最佳实践|業界標準|业界标准|標準做法",
     "score": 0.45, "hint": "用戶要某領域的最佳實踐"},
    {"id": "zh_recommend", "pattern": r"推薦(一個|一隻|一下)?|介绍一个|介紹一個|找一個|找一个",
     "score": 0.40, "hint": "用戶要推薦／找某物"},
    {"id": "zh_can_you", "pattern": r"你會不會|能不能幫我|你可以幫我|可以幫我",
     "score": 0.30, "hint": "用戶探詢代理能力"},
    {"id": "zh_teach", "pattern": r"教我|帶我做|一步步|step ?by ?step",
     "score": 0.35, "hint": "用戶要教學式引導"},
]

THINKING_RULES = [
    {"id": "th_zh_existing_skill", "pattern": r"現成的 ?skill|现成的 ?skill|現成工具|现成工具|現成的工具|也许有现成|也許有現成|或許有現成|可能有現成",
     "score": 0.60, "hint": "思考中猜測存在現成 skill／工具"},
    {"id": "th_zh_unsure", "pattern": r"不確定怎麼|不确定怎么|不知道怎麼|不知道怎么|不知道如何",
     "score": 0.55, "hint": "模型自述能力不確定"},
    {"id": "th_zh_look_for", "pattern": r"找找看[^。]{0,10}(skill|工具)|搜尋[^。]{0,10}(skill|工具)|先找[^。]{0,10}(skill|工具)",
     "score": 0.65, "hint": "思考中決定先找工具／skill"},
    {"id": "th_zh_best_practice", "pattern": r"需要[^。]{0,12}最佳實踐|需要[^。]{0,12}最佳实践|業界[^。]{0,6}怎麼做",
     "score": 0.50, "hint": "思考中需要某領域最佳實踐"},
    {"id": "th_zh_gap", "pattern": r"我不熟悉|我沒做過|超出.{0,6}(能力|知識)|需要[^。]{0,10}(專門|特定)[^。]{0,6}(工具|能力)",
     "score": 0.50, "hint": "思考中承認能力缺口"},
]
