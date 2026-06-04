# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.7 Lag-aware read splitting (route to primary when replica lag exceeds threshold)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Custom DB connector applied
- [ ] Permission-based routing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Checking lag on every query**: `SHOW REPLICA STATUS` itself adds load. Cache lag value and refresh at most every 1-5 seconds. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Lag-sensitive query staleness < defined threshold (e.g., 2s)
- [ ] Replicas serve >80% of read traffic during normal operation
- [ ] Zero stale data served to users from lag-sensitive paths

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Custom DB connector applied
- [ ] Permission-based routing applied
- [ ] Always Monitor Replica Lag followed
- [ ] Classify queries as lag-sensitive (user profile, order status) or lag-tolerant (reports, search results) completed
- [ ] Set up lag monitoring: check `SHOW REPLICA STATUS` every N seconds, cache lag value in memory/Redis completed
- [ ] Extend Laravel's `MySqlConnection` — in `select()`, check cached lag before routing completed
- [ ] If lag > threshold for sensitive queries, use write PDO (primary) instead of read PDO completed
- [ ] Always route tolerant queries to replicas regardless of lag completed

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

- [ ] Checking lag on every query**: `SHOW REPLICA STATUS` itself adds load. Cache lag value and refresh at most every 1-5 seconds. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Lag-sensitive queries return fresh data even during replication delay
- [ ] Lag-tolerant queries always route to replicas
- [ ] Lag value is cached and not checked per-query
- [ ] Fallback to primary works when replicas are unreachable
- [ ] Every read query has a sensitivity tag
- [ ] Lag-sensitive query staleness < defined threshold (e.g., 2s)
- [ ] Replicas serve >80% of read traffic during normal operation
- [ ] Zero stale data served to users from lag-sensitive paths
- [ ] All queries classified correctly per business requirements
- [ ] Read-after-write consistency bugs reduced to zero

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
- [ ] Checking lag on every query adds overhead â€” always cache prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Checking lag on every query**: `SHOW REPLICA STATUS` itself adds load. Cache lag value and refresh at most every 1-5 seconds. prevented

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
