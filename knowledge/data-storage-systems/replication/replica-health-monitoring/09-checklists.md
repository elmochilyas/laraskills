# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.21 Replica health monitoring (connection failures, stale data)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Health check middleware applied
- [ ] Degraded mode applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Serving stale data from unhealthy replica**: Replica's SQL thread stopped 2 hours ago. App still routes reads to it. Users see 2-hour-old data. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] All replicas monitored for replication status and resource health
- [ ] Alerts fire within 30 seconds of failure or threshold breach
- [ ] Automated recovery handles common failures (SQL thread stop)

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Health check middleware applied
- [ ] Degraded mode applied
- [ ] Always Monitor Replica Lag followed
- [ ] Monitor replication status: completed
- [ ] Monitor replica resource health: completed
- [ ] Monitor query performance on replica: completed
- [ ] Health check every 10-60 seconds, aggregate metrics into dashboard completed
- [ ] Set alerts: completed

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

- [ ] Serving stale data from unhealthy replica**: Replica's SQL thread stopped 2 hours ago. App still routes reads to it. Users see 2-hour-old data. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Replication status monitored for all replicas
- [ ] System metrics collected and dashboarded
- [ ] Alerts configured for all critical and warning conditions
- [ ] Automated response scripts tested and documented
- [ ] Replica rebuild procedure documented and tested
- [ ] All replicas monitored for replication status and resource health
- [ ] Alerts fire within 30 seconds of failure or threshold breach
- [ ] Automated recovery handles common failures (SQL thread stop)
- [ ] Manual recovery procedure for irrecoverable failures documented and tested
- [ ] Replica data consistency verified regularly

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
- [ ] Replica running but not applying (IO thread OK, SQL thread stopped â€” stale data) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Serving stale data from unhealthy replica**: Replica's SQL thread stopped 2 hours ago. App still routes reads to it. Users see 2-hour-old data. prevented

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
