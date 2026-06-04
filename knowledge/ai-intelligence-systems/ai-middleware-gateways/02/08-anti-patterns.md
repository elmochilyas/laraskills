# ECC Anti-Patterns — Gateway Provider Failover

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | AI & Intelligence Systems |
| **Subdomain** | AI Middleware & Gateways |
| **Knowledge Unit** | Gateway Provider Failover |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Failover Without Provider-Specific Timeouts — Slow Provider Delays All
2. No Fallback Model Mapping — Same Model Name Fails on Backup
3. Failover Circuit Breaker Not Synced Across Instances
4. Failover Not Tested — Production First Exercise
5. Failover Without Cost Consideration — Backup More Expensive

---

## Repository-Wide Anti-Patterns

- No per-provider timeout configuration
- Failover latency not monitored

---

## Anti-Pattern 1: Failover Without Provider-Specific Timeouts

### Category
Reliability

### Description
Same timeout for all providers — a slow provider delays failover to backup.

### Preferred Alternative
Set provider-specific timeouts. Failover triggers when primary timeout is reached (not total timeout).

### Detection Checklist
- [ ] Same timeout for all providers
- [ ] Slow provider delays failover
- [ ] No per-provider timeout

---

## Anti-Pattern 2: Failover Not Tested

### Category
Testing

### Description
Failover path never tested — first exercise is during production outage.

### Preferred Alternative
Test failover in CI/staging: mock primary provider failure, verify backup serves requests.

### Detection Checklist
- [ ] Failover never tested
- [ ] First exercise in production
- [ ] No failover integration test
