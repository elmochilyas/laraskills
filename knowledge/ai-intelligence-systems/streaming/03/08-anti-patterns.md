# ECC Anti-Patterns — Streaming Token Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Streaming |
| **Knowledge Unit** | Streaming Token Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Token Count Tracking During Streaming
2. Stream Continuing Beyond User's Token Budget
3. No Early Stop When Token Budget Exceeded
4. Token Count Not Displayed to User
5. No Capped Token Limit for Streaming Requests

---

## Repository-Wide Anti-Patterns

- Streaming token costs not tracked per session
- No user-facing token usage indication

---

## Anti-Pattern 1: No Token Count Tracking During Stream

### Category
Cost Management

### Description
Streaming tokens not counted during stream — total cost unknown until stream completes.

### Preferred Alternative
Count tokens incrementally during streaming. Accumulate totals for cost tracking and budget enforcement.

### Detection Checklist
- [ ] Token count not tracked during stream
- [ ] Cost unknown mid-stream
- [ ] No per-stream token tracking

---

## Anti-Pattern 2: No Early Stop on Budget Exceeded

### Category
Cost Management

### Description
Stream continues generating even after user's token budget is exhausted — surprise costs.

### Preferred Alternative
Check token budget against accumulated tokens during streaming. Stop stream and notify user when budget exceeded.

### Detection Checklist
- [ ] Budget check only pre-stream
- [ ] Mid-stream budget exceeded
- [ ] Surprise overage costs
