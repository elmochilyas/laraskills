# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.24 Hot shard mitigation (split, move tenants, rebalance)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automated detection → alert → action applied
- [ ] Whale tenant to dedicated shard applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Ignoring hot shard until it fails**: Hot shard degrades gradually. Alert at 70%, plan mitigation at 80%, execute at 90%. Don't wait for 100%. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Hot shard utilization returns to within ±20% of average
- [ ] Root cause identified and addressed
- [ ] No data loss during mitigation

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Automated detection → alert → action applied
- [ ] Whale tenant to dedicated shard applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Identify hot shard from monitoring (CPU, IOPS, connections, latency deviating from others) completed
- [ ] Diagnose root cause: completed
- [ ] Apply mitigation: completed
- [ ] Verify mitigation reduces hot shard utilization completed
- [ ] Monitor for secondary hot shards after mitigation completed

---

# Performance Checklist

- [ ] Performance: Fan-out queries issue N parallel queries bounded by the slowest shard. Shard key selection determines query locality. Connection management must ac...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Ignoring hot shard until it fails**: Hot shard degrades gradually. Alert at 70%, plan mitigation at 80%, execute at 90%. Don't wait for 100%. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Hot shard identified and root cause determined
- [ ] Mitigation applied and verified
- [ ] No secondary hot shard created
- [ ] Long-term fix identified (shard key redesign, caching, etc.)
- [ ] Hot keys identified and cached
- [ ] Hot shard utilization returns to within ±20% of average
- [ ] Root cause identified and addressed
- [ ] No data loss during mitigation
- [ ] Monitoring confirms mitigation effectiveness
- [ ] Hot shard read load reduced by > 50%

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Choose High-Cardinality Shard Key prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] Treating symptom (high CPU) without fixing root cause (bad shard key) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Ignoring hot shard until it fails**: Hot shard degrades gradually. Alert at 70%, plan mitigation at 80%, execute at 90%. Don't wait for 100%. prevented

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
