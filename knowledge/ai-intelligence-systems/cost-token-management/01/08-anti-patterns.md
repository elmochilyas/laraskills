# ECC Anti-Patterns — Cost & Token Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Cost & Token Management |
| **Knowledge Unit** | Cost & Token Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Token Tracking — Surprise API Bills
2. No Per-User Token Budgets — Single User Drains Budget
3. Same Max Tokens for All Requests
4. No Token Cost Alerting — Budget Exceeded Without Warning
5. Not Culling Conversation History to Reduce Token Usage

---

## Repository-Wide Anti-Patterns

- No cost attribution per feature/endpoint
- Token costs not logged for analysis

---

## Anti-Pattern 1: No Token Tracking

### Category
Cost Management

### Description
No system tracks token usage per request, per user, or per session — surprise bills at month end.

### Preferred Alternative
Track token usage (input + output) per request. Log to database for cost analysis and budgeting.

### Detection Checklist
- [ ] No token tracking
- [ ] API costs unknown
- [ ] Cannot attribute costs to features

---

## Anti-Pattern 2: No Per-User Token Budgets

### Category
Cost Management

### Description
No per-user or per-tenant token limits — one user's heavy usage impacts project budget.

### Preferred Alternative
Set per-user daily/monthly token budgets. Enforce limits at request time.

### Detection Checklist
- [ ] No user token budgets
- [ ] Single user can exhaust budget
- [ ] No usage limits per user
