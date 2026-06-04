# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.5 Replica lag causes (long transactions, DDL, heavy writes, insufficient replica capacity)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Monitor `Seconds_Behind_Master` (MySQL) applied
- [ ] Throttle writes during replica lag applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Adding replicas without increasing capacity**: More replicas don't fix lag if the primary is the bottleneck. Fix the primary first. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Replica lag consistently below threshold
- [ ] Root cause identified and resolved
- [ ] Monitoring alerts on lag before it affects users

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Monitor `Seconds_Behind_Master` (MySQL) applied
- [ ] Throttle writes during replica lag applied
- [ ] Always Monitor Replica Lag followed
- [ ] Measure current replica lag: `SHOW REPLICA STATUS` or `pt-heartbeat` check completed
- [ ] Identify lag pattern: constant lag (replica underprovisioned) vs spikes (DDL, burst writes) completed
- [ ] For constant lag: completed
- [ ] For lag spikes: completed
- [ ] Resolve based on cause: completed

---

# Performance Checklist

- [ ] Performance: Synchronous replication increases write latency but guarantees zero data loss. Asynchronous replication allows read scaling at the cost of eventual...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Adding replicas without increasing capacity**: More replicas don't fix lag if the primary is the bottleneck. Fix the primary first. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Root cause of lag identified
- [ ] Resolution applied (replica upgrade, DDL strategy change, etc.)
- [ ] Lag returns to acceptable level after resolution
- [ ] Monitoring confirms sustained improvement
- [ ] DDL executed with minimal replica lag impact
- [ ] Replica lag consistently below threshold
- [ ] Root cause identified and resolved
- [ ] Monitoring alerts on lag before it affects users
- [ ] DDL completes without causing replica lag alerts
- [ ] Schema change applied to all replicas consistently

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Monitor Replica Lag prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Assuming lag is always network-related (usually compute or IO) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Adding replicas without increasing capacity**: More replicas don't fix lag if the primary is the bottleneck. Fix the primary first. prevented

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered

---

# Final Approval Checklist

The work should not be considered complete unless:

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
