# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.6 Replica lag monitoring (SHOW REPLICA STATUS, pt-heartbeat)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] pt-heartbeat for production monitoring applied
- [ ] Lag alerting applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Relying solely on Seconds_Behind_Master**: During network issues, SBM may show 0 while replica hasn't received new events. Use pt-heartbeat. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Lag metrics collected for every replica
- [ ] Alerts fire within 30 seconds of threshold breach
- [ ] Lag data available for post-incident analysis

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] pt-heartbeat for production monitoring applied
- [ ] Lag alerting applied
- [ ] Always Monitor Replica Lag followed
- [ ] Configure lag monitoring: completed
- [ ] For production, prefer pt-heartbeat (more accurate, works during replication errors) completed
- [ ] Collect lag metric every 10-60 seconds completed
- [ ] Set alert thresholds: completed
- [ ] Create dashboard showing lag over time per replica completed

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

- [ ] Relying solely on Seconds_Behind_Master**: During network issues, SBM may show 0 while replica hasn't received new events. Use pt-heartbeat. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Lag measurement configured and collecting data
- [ ] Alert thresholds set and tested
- [ ] Dashboard shows lag per replica over time
- [ ] Lag spikes correlate with events (DDL, traffic, deployments)
- [ ] pt-heartbeat installed and heartbeat table created
- [ ] Lag metrics collected for every replica
- [ ] Alerts fire within 30 seconds of threshold breach
- [ ] Lag data available for post-incident analysis
- [ ] pt-heartbeat (or equivalent) is the primary lag source
- [ ] pt-heartbeat provides accurate lag measurement for all replicas

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
- [ ] `Seconds_Behind_Master` shows 0 but replica hasn't processed events (relay log gap) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Relying solely on Seconds_Behind_Master**: During network issues, SBM may show 0 while replica hasn't received new events. Use pt-heartbeat. prevented

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
