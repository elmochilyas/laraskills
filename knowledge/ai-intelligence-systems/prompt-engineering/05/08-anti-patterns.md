# ECC Anti-Patterns — Prompt Performance

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Prompt Engineering |
| **Knowledge Unit** | Prompt Performance |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Long Prompts for Time-Sensitive Responses
2. No Prompt Caching — Same Prompt Rebuilt Every Request
3. Detailed Instructions for Simple Tasks
4. No Temperature Tuning for Task Type
5. Same Prompt Structure for Sync and Async

---

## Repository-Wide Anti-Patterns

- Prompt construction time not measured
- No comparison of prompt formats for latency

---

## Anti-Pattern 1: Long Prompts for Time-Sensitive Responses

### Category
Performance

### Description
Verbose system prompt for low-latency feature (autocomplete, classification) — each token adds latency.

### Preferred Alternative
Use minimal prompts for latency-sensitive features. Longer prompts for offline/queue processing.

### Detection Checklist
- [ ] Long prompt for low-latency feature
- [ ] Latency higher than acceptable
- [ ] Short prompt would suffice

---

## Anti-Pattern 2: No Prompt Caching

### Category
Performance

### Description
Prompt reconstructed from scratch on every request — string concatenation overhead.

### Preferred Alternative
Cache static parts of prompt (system instructions, examples). Append only dynamic parts per request.

### Detection Checklist
- [ ] Full prompt rebuild per request
- [ ] Redundant string operations
- [ ] No prompt caching
