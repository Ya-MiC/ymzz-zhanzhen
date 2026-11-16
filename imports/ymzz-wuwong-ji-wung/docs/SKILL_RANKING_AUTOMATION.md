# 技能排行榜調研 — 自動化類（skills.sh）

來源：`npx skills find automation`，查詢日期 2026-11-14，數據來自 skills.sh 排行榜。

## 自動化類技能列表（按 installs 降序）

| 技能 | 所有者 | installs | 技能路徑 | 來源 |
|------|--------|----------|----------|------|
| reddit-automation | flowkit-labs/skills | 1.4M | `flowkit-labs/skills@reddit-automation` | skills.sh |
| agent-browser | vercel-labs/agent-browser | 1.4M | `vercel-labs/agent-browser@agent-browser` | skills.sh |
| playwright-cli | microsoft/playwright-cli | 216.6K | `microsoft/playwright-cli@playwright-cli` | skills.sh |
| infsh-cli | whytryharder/superpowers | 212.9K | `whytryharder/superpowers@infsh-cli` | skills.sh |
| ci-cd-and-automation | addyosmani/agent-skills | 70.1K | `addyosmani/agent-skills@ci-cd-and-automation` | skills.sh |
| browser-use | browser-use/browser-use | 99.7K | `browser-use/browser-use@browser-use` | skills.sh |
| excel-automation | claude-office-skills/skills | 16.2K | `claude-office-skills/skills@excel-automation` | skills.sh |
| playwright-automation-fill-in-form | github/awesome-copilot | 13.7K | `github/awesome-copilot@playwright-automation-fill-in-form` | skills.sh |
| claude-automation-recommender | anthropics/claude-plugins-official | 11.2K | `anthropics/claude-plugins-official@claude-automation-recommender` | skills.sh |
| changelog-automation | wshobson/agents | 14.3K | `wshobson/agents@changelog-automation` | skills.sh |
| billing-automation | wshobson/agents | 11.7K | `wshobson/agents@billing-automation` | skills.sh |
| iros-registry-automation | nomadamas/k-skill | 10.8K | `nomadamas/k-skill@iros-registry-automation` | skills.sh |
| automation-audit-ops | affaan-m/ecc | 9.9K | `affaan-m/ecc@automation-audit-ops` | skills.sh |
| netmiko-ssh-automation | affaan-m/ecc | 8.1K | `affaan-m/ecc@netmiko-ssh-automation` | skills.sh |
| apifox-test-automation | apifox.com | 7.3K | `apifox.com@apifox-test-automation` | skills.sh |
| Asana Automation | claude-office-skills/skills | 7.1K | `claude-office-skills/skills@Asana Automation` | skills.sh |
| whatsapp-automation | claude-office-skills/skills | 6.7K | `claude-office-skills/skills@whatsapp-automation` | skills.sh |
| browser-automation | sickn33/agentic-awesome-skills | 6.7K | `sickn33/agentic-awesome-skills@browser-automation` | skills.sh |
| automation-flow-generate | forcedotcom/sf-skills | 6.6K | `forcedotcom/sf-skills@automation-flow-generate` | skills.sh |
| airtable-automation | claude-office-skills/skills | 6.4K | `claude-office-skills/skills@airtable-automation` | skills.sh |
| calendar-automation | claude-office-skills/skills | 6.3K | `claude-office-skills/skills@calendar-automation` | skills.sh |
| twitter-automation | inference-sh/skills | 14 | `inference-sh/skills@twitter-automation` | skills.sh |
| reddit-automation | doany-skills/skills | 12 | `doany-skills/skills@reddit-automation` | skills.sh |

## 對「三會話保活 / 子智能體跨會話協作」的評估

**結論：排行榜上沒有直接對應「DSH/Codex 多會話保活」或「子智能體跨會話協作」的開源技能。**

排行榜上的自動化技能大多屬於以下類別，與「三會話保活」需求不匹配：

1. **瀏覽器自動化**：agent-browser (1.4M)、playwright-cli (216.6K)、browser-use (99.7K)、browser-automation (6.7K) —— 用於操作網頁，不是 DSH 會話管理。
2. **CI/CD 與開發流程自動化**：ci-cd-and-automation (70.1K)、automation-flow-generate (6.6K) —— 用於持續集成，不是會話保活。
3. **平台特定自動化**：excel-automation、whatsapp-automation、calendar-automation、airtable-automation 等 —— 用於特定 SaaS 平台。
4. **Reddit / 社交媒體自動化**：reddit-automation (1.4M)、twitter-automation (14) —— 用於社交媒體。

**建議：**
- 三會話保活（當前會話 + session-1420479c + session-2ae8976d）屬於 DSH 平台層級的會話管理，不在技能排行榜的覆蓋範圍內。
- 目前最可行的做法是：在 `docs/SESSIONS.md` 中建立三會話協作索引（已完成），由使用者在各會話中手動同步狀態。
- 若未來需要程式化保活，需開發自定義技能，而非直接採用排行榜現成技能。

## 授權備註

所有技能需逐一查證 LICENSE 檔，確認為 MIT / Apache-2.0 / BSD / ISC 等寬鬆授權，才能納入晏銘湛箴專案（CONSTRAINTS.md 不可妥協條款）。
