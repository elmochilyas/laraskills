# ECC Anti-Patterns — Prompt Optimization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Prompt Optimization |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Token Count Awareness — Prompt Too Long
2. Redundant Instructions Repeated Across Prompts
3. No Prompt Compression — Wordy Instructions
4. Not Leveraging Model Instruction Following Differences
5. No Prompt Iteration — Same Prompt Forever

---

## Repository-Wide Anti-Patterns

- Prompt length never measured
- No prompt refactoring cycle

---

## Anti-Pattern 1: No Token Count Awareness

### Category
Cost Management

### Description
Prompt written without consideration of token count — unnecessarily expensive.

### Preferred Alternative
Count prompt tokens during development. Target minimum tokens for reliable output.

### Detection Checklist
- [ ] Token count unknown
- [ ] Unnecessary verbose prompts
- [ ] Higher costs than needed

---

## Anti-Pattern 2: No Prompt Iteration

### Category
Maintainability

### Description
Prompt written once and never revisited — doesn't improve over time.

### Preferred Alternative
Iterate prompts based on evaluation results. Track prompt version vs. quality metrics.

### Detection Checklist
- [ ] Prompt not updated
- [ ] No iteration cycle
- [ ] Stale prompts
