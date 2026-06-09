# Knowledge Quality Backlog

**Date:** 2026-06-09  
**Sampling:** 105 KUs (5 per domain × 21), ~630 artifact files inspected

---

## Overall Assessment: **FAIR**

| Artifact Type | Grade | Notes |
|--------------|-------|-------|
| 04-standardized-knowledge.md | Good | All sections present, Laravel-specific content |
| 05-rules.md | Good | Proper structure where complete |
| 06-skills.md | Good | All workflow elements present |
| 07-decision-trees.md | Fair | Many meaningful trees, some minimal |
| 08-anti-patterns.md | **Poor** | 4.4% duplicated boilerplate |
| 09-checklists.md | Fair | Encoding issues, duplicate items |
| Cross-KU consistency | Fair | Template-driven generation artifacts |
| Encoding quality | Poor | Widespread non-ASCII artifacts |

---

## Critical Issues

### 1. Path Corruption in Knowledge Content
- **File:** `knowledge/api-crud-system-engineering/resource-controllers/singleton-resource-controllers/05-rules.md`
- **Impact:** PowerShell profile paths (`C:\Users\Pc\Documents\WindowsPowerShell\Microsoft.PowerShell_profile.ps1`) embedded in PHP code examples at lines 73, 78, 132
- **Risk:** Code examples are broken and non-functional; machine identity leaked into committed assets
- **Remediation:** Regenerate the file or manually fix corrupted code examples

### 2. 103 Identical 08-anti-patterns.md Files
- **Clusters:** 43 groups across 3 domains (testing-reliability-engineering, cost-resource-optimization, platform-engineering-developer-experience)
- **Content:** Generic boilerplate with "Unknown" fields, not Laravel-specific
- **Risk:** Agents reading these get zero actionable anti-pattern guidance
- **Remediation:** Replace with KU-specific anti-pattern content

### 3. Encoding Corruption (Widespread)
- Unicode replacement characters (`�`), mojibake em-dashes (`â€"`), smart quotes misencoded
- 99% of files contain non-ASCII artifacts from generation process
- Most severely affected: 09-checklists.md files
- **Remediation:** Run global encoding cleanup; existing `Normalize-Mojibake` function in tools/ is a good starting point

---

## High Priority

### 4. Stub File
- `knowledge/data-storage-systems/connections/connection-lifecycle/09-test.md` — 9 bytes, content: `test`
- **Remediation:** Populate with proper checklist or remove

### 5. Minimal Decision Trees
- 12 files under 500 bytes (all in devops-infrastructure)
- `envoyer/07-decision-trees.md` is 176 bytes with a single flat comparison
- **Remediation:** Expand to meaningful decision branches

---

## Moderate Priority

### 6. Metadata Mismatch
- `ai-intelligence-systems/agentic-workflows/01/08-anti-patterns.md`: Metadata claims KU is "Agent Prompting & Instructions" but directory is named "Agent Architecture Fundamentals"
- **Remediation:** Correct metadata header to match directory

### 7. Boilerplate Rules
- `data-storage-systems/connections/connection-lifecycle/05-rules.md`: Rules 3 and 4 are meta-rules with no actionable guidance ("Review And Apply Core Concepts", "Consider Architecture Guidelines")
- `devops-infrastructure/hosting-platforms/envoyer/05-rules.md`: Only 2 rules, non-standard format
- **Remediation:** Replace with specific, actionable rules

### 8. Generic Governance Content
- Some governance-compliance-engineering content reads as boilerplate ("Laravel Gates Policies is a critical capability...")
- **Remediation:** Add more Laravel-specific implementation details

---

## Low Priority

### 9. Generic Decision Tree Rule References
- Multiple decision trees use "Follow Best Practices", "Implement Error Handling" instead of KU-specific rules
- **Remediation:** Replace with references to specific rules/artifacts

### 10. Duplicate Checklist Items
- Some 09-checklists.md files have duplicate items across sections
- **Remediation:** Deduplicate during quality pass

---

## Quality Backlog (Priority Order)

| # | Severity | Item | Affected Files |
|---|----------|------|----------------|
| 1 | Critical | Path corruption in singleton-resource-controllers/05-rules.md | 1 |
| 2 | Critical | Replace 103 duplicated 08-anti-patterns.md files | 103 |
| 3 | High | Fix encoding corruption across all files | ~2,000+ |
| 4 | High | Populate 09-test.md stub | 1 |
| 5 | High | Expand 12 minimal decision trees | 12 |
| 6 | Moderate | Fix metadata mismatch in agentic-workflows/01/ | 1 |
| 7 | Moderate | Replace boilerplate rules | ~10 |
| 8 | Moderate | Expand envoyer/05-rules.md to standard format | 1 |
| 9 | Low | Replace generic rule refs in decision trees | Multiple |
| 10 | Low | Deduplicate checklist items | Multiple |
