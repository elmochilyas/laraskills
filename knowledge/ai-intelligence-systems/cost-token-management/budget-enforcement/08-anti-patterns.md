# ECC Anti-Patterns — Token Budget Enforcement

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Cost & Token Management |
| **Knowledge Unit** | Token Budget Enforcement |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Budget Checked Only at Request Start — Mid-Request Overages
2. No Streaming Budget Check — Stream Continues Beyond Budget
3. Hard Rejection Instead of Graceful Degradation
4. No Budget Reset Logic — Accumulated Budget Never Resets
5. Budget Check Without Bypass for Critical Features

---

## Repository-Wide Anti-Patterns

- Budget not enforced per time window (daily/monthly)
- No budget notification to users before enforcement

---

## Anti-Pattern 1: Budget Checked Only at Request Start

### Category
Cost Management

### Description
Token budget checked only before request starts — streaming request can exceed budget mid-stream.

### Preferred Alternative
Check budget incrementally during streaming. Stop stream and notify when budget exhausted.

### Detection Checklist
- [ ] Pre-request budget check only
- [ ] Mid-stream overages
- [ ] No incremental enforcement

---

## Anti-Pattern 2: Hard Rejection Instead of Graceful Degradation

### Category
UX

### Description
Budget exceeded results in hard error — user cannot use any AI features.

### Preferred Alternative
Degrade gracefully: use cheaper model, reduce max tokens, or offer queue for non-urgent requests.

### Detection Checklist
- [ ] Hard budget rejection
- [ ] No degradation strategy
- [ ] Users blocked entirely
