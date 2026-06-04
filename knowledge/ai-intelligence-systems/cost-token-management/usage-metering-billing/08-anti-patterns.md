# ECC Anti-Patterns — Token Usage Metering

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | Cost & Token Management |
| **Knowledge Unit** | Token Usage Metering |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. No Usage Metering — Costs Not Attributable
2. Metering Without Real-Time Counters — Delayed Cost Data
3. Not Separating Input vs. Output Token Costs
4. No Metering Per Provider/Model — Can't Compare Costs
5. Metering Data Not Exposed for User Dashboards

---

## Repository-Wide Anti-Patterns

- Metering data never aggregated into reports
- No cost-per-feature breakdown

---

## Anti-Pattern 1: No Usage Metering

### Category
Cost Management

### Description
No metering system — can't attribute costs to features, users, or tenants.

### Preferred Alternative
Meter each LLM call: tokens, model, provider, feature, user ID, timestamp.

### Detection Checklist
- [ ] No usage metering
- [ ] Costs un-attributable
- [ ] No feature-level cost data
