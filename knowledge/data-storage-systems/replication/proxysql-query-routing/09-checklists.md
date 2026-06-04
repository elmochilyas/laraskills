# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.17 ProxySQL query routing rules for read/write split
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Default rule applied
- [ ] User-based routing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No FOR UPDATE handling**: `SELECT ... FOR UPDATE` must go to write. Without specific rule, it routes to read replica, causing stale locks. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] 100% of SELECT queries (non-FOR UPDATE) routed to replicas
- [ ] 100% of write queries routed to primary
- [ ] Zero routing errors in ProxySQL logs

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Default rule applied
- [ ] User-based routing applied
- [ ] Always Monitor Replica Lag followed
- [ ] Add servers to ProxySQL: completed
- [ ] Configure query rules in order of priority: completed
- [ ] Configure monitoring user for health checks completed
- [ ] Load rules to runtime: `LOAD MYSQL QUERY RULES TO RUNTIME` completed
- [ ] Save to disk: `SAVE MYSQL QUERY RULES TO DISK` completed

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

- [ ] No FOR UPDATE handling**: `SELECT ... FOR UPDATE` must go to write. Without specific rule, it routes to read replica, causing stale locks. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] SELECT queries (non-FOR UPDATE) hit replicas
- [ ] SELECT...FOR UPDATE queries hit primary
- [ ] INSERT, UPDATE, DELETE queries hit primary
- [ ] DDL (ALTER, CREATE, DROP) queries hit primary
- [ ] ProxySQL stats show correct hostgroup distribution
- [ ] 100% of SELECT queries (non-FOR UPDATE) routed to replicas
- [ ] 100% of write queries routed to primary
- [ ] Zero routing errors in ProxySQL logs
- [ ] All custom-routed queries hit correct hostgroups
- [ ] No unintended matches from broad patterns

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
- [ ] `SELECT ... FOR UPDATE` routed to replica â€” stale locks and data prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No FOR UPDATE handling**: `SELECT ... FOR UPDATE` must go to write. Without specific rule, it routes to read replica, causing stale locks. prevented

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
