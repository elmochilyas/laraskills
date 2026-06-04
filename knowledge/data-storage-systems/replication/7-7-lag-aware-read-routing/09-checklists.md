# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7-7 Lag-Aware Read Routing
**Generated:** 2026-06-04
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Lag threshold defined per query type
- [ ] Lag check implemented before replica reads
- [ ] Fallback to primary when all replicas lag
- [ ] Lag measurement method chosen (pt-heartbeat or SBM)
- [ ] Per-query-type lag thresholds applied
- [ ] Time-sensitive reads excluded from replica routing

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Define lag threshold based on application requirements applied
- [ ] Implement a custom connection resolver or database middleware applied
- [ ] For Laravel: override `DB_READ_HOST` fallback logic or use a middleware applied
- [ ] Consider replica-level health checks applied
- [ ] Monitor how often reads are routed to primary applied
- [ ] Always Check Lag Before Reading From Replica followed
- [ ] Never Route Time-Sensitive Reads To Lagging Replicas followed

---

# Performance Checklist

- [ ] Lag check query adds ~1ms per read (if not cached)
- [ ] Cached lag values (10-100ms stale) reduce overhead

---

# Security Checklist

- [ ] Lag measurement must not expose credentials
- [ ] Fallback to primary is safe

---

# Reliability Checklist

- [ ] Always Check Lag Before Reading From Replica followed
- [ ] Never Route Time-Sensitive Reads To Lagging Replicas followed
- [ ] Fallback mechanism verified under load

---

# Testing Checklist

- [ ] Reads route to replica when lag is below threshold
- [ ] Reads route to primary when lag is above threshold
- [ ] Fallback works when all replicas lagging
- [ ] Threshold meets application data freshness requirements
- [ ] Lag threshold per query type vs global
- [ ] Check lag on every read vs cached lag value
- [ ] Fallback to primary vs fail reader with error

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Lag threshold too low — every read goes to primary prevented
- [ ] Lag threshold too high — stale data served prevented
- [ ] No monitoring for fallback rate prevented
- [ ] Production Blindness prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge

Reference: ./04-standardized-knowledge.md

# Related Rules

Reference: ./05-rules.md

# Related Skills

Reference: ./06-skills.md

# Related Decision Trees

Reference: ./07-decision-trees.md

# Related Anti-Patterns

Reference: ./08-anti-patterns.md
