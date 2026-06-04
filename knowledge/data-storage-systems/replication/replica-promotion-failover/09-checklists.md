# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.11 Replica promotion and failover (manual vs. automated)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automated failover for production applied
- [ ] Manual failover for maintenance applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No failover testing**: Failover works in theory. Test it. Monthly failover drills. Verify app reconnects without manual config changes. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failover completes within RTO (<60s automated, <5min manual)
- [ ] Data loss within RPO (<1s for semi-sync, seconds for async)
- [ ] Zero manual intervention for automated failover

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Automated failover for production applied
- [ ] Manual failover for maintenance applied
- [ ] Always Monitor Replica Lag followed
- [ ] Deploy orchestrator on control nodes (2-3 nodes for quorum) completed
- [ ] Configure health checks: ping primary every N seconds, mark dead after M failures completed
- [ ] Configure promotion rules: promote replica with most advanced GTID/binlog position completed
- [ ] Configure post-failover: update DNS/VIP, update ProxySQL hostgroups, update Laravel config cache completed
- [ ] Test failover: kill primary, verify promotion completes within RTO completed

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

- [ ] No failover testing**: Failover works in theory. Test it. Monthly failover drills. Verify app reconnects without manual config changes. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Orchestrator detects primary failure within health check interval
- [ ] Replica promoted within RTO
- [ ] Application queries succeed after failover (no manual config change)
- [ ] Old primary, when restored, doesn't rejoin as primary (split-brain prevention)
- [ ] Failover logged and alert sent
- [ ] Failover completes within RTO (<60s automated, <5min manual)
- [ ] Data loss within RPO (<1s for semi-sync, seconds for async)
- [ ] Zero manual intervention for automated failover
- [ ] Zero data loss during switchover
- [ ] Application functional within maintenance window

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
- [ ] Split-brain: old primary comes back and accepts writes â€” use VIP/storage fencing prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No failover testing**: Failover works in theory. Test it. Monthly failover drills. Verify app reconnects without manual config changes. prevented

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
