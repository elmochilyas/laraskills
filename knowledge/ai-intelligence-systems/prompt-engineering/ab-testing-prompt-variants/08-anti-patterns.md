# ECC Anti-Patterns — AB Testing Prompt Variants

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | AB Testing Prompt Variants |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No AB Testing — Prompt Changes Based on Gut Feel
2. Testing Without Statistical Significance — Misleading Results
3. Multiple Changes Tested at Once — Can't Attribute Improvement
4. No Evaluation Dataset — Subjective Quality Assessment
5. AB Test Not Isolated — Other Variables Change During Test

---

## Repository-Wide Anti-Patterns

- AB test results not documented — learnings lost
- AB test period too short — doesn't cover edge cases

---

## Anti-Pattern 1: No AB Testing

### Category
Reliability

### Description
Prompt changes deployed based on subjective impression — no data-driven evaluation.

### Preferred Alternative
A/B test prompt variants with evaluation dataset. Measure success criteria objectively.

### Detection Checklist
- [ ] No prompt evaluation
- [ ] Changes based on gut feel
- [ ] No quantitative comparison

---

## Anti-Pattern 2: Multiple Changes Tested at Once

### Category
Testing

### Description
New prompt changes instructions AND examples AND format simultaneously — can't identify which change caused improvement.

### Preferred Alternative
Test one variable at a time. Keep control prompt unchanged.

### Detection Checklist
- [ ] Multiple changes in one test
- [ ] Can't attribute results
- [ ] No control group
