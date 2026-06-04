# ECC Anti-Patterns — Token Limits & Truncation

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Cost & Token Management |
| **Knowledge Unit** | Token Limits & Truncation |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Max Tokens Set — Unbounded Output Length
2. Truncating Input Without Notice — User Not Warned
3. Hard Truncation Losing Critical Context
4. Same Max Tokens for All Model Sizes
5. No Token Counting Before Sending Request

---

## Repository-Wide Anti-Patterns

- Token limit exceeded errors not logged
- No automatic context window management

---

## Anti-Pattern 1: No Max Tokens Set

### Category
Cost Management

### Description
No `max_tokens` parameter — LLM generates until it decides to stop, potentially very long.

### Preferred Alternative
Set `max_tokens` appropriate to task. Estimate required output length.

### Detection Checklist
- [ ] No max_tokens set
- [ ] Unpredictable output length
- [ ] Surprise token costs on long outputs

---

## Anti-Pattern 2: Truncating Input Without Notice

### Category
UX

### Description
Context exceeds model limit, silently truncated — user doesn't know some context was lost.

### Preferred Alternative
Count tokens before sending. Notify user when context exceeds limit. Summarize or prioritize recent context.

### Detection Checklist
- [ ] Silent truncation
- [ ] User not warned
- [ ] Critical context lost without notice
