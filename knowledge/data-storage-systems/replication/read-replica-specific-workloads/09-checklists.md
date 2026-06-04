# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.15 Read replica-specific workloads (reporting, analytics, search)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Dedicated replica for reporting applied
- [ ] Replica sizing per workload applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Running reports on user-facing replicas**: A heavy report query blocks user requests on the same replica. Dedicate replicas per workload type. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] User-facing query latency: p99 < 100ms during batch report execution
- [ ] Reporting queries complete within expected SLA
- [ ] No resource contention between workload classes

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Dedicated replica for reporting applied
- [ ] Replica sizing per workload applied
- [ ] Always Monitor Replica Lag followed
- [ ] Profile database queries: identify heavy consumers (aggregations, full scans, complex joins) completed
- [ ] Classify workloads: user-facing (low latency), reporting (batch), analytics (BI tools), search indexing completed
- [ ] Map each class to a dedicated replica connection in Laravel: completed
- [ ] Size each replica according to workload requirements (reporting: high CPU, analytics: high storage, user-facing: balanced) completed
- [ ] Update application code: use `DB::connection('mysql_reporting')` for reports completed

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

- [ ] Running reports on user-facing replicas**: A heavy report query blocks user requests on the same replica. Dedicate replicas per workload type. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] User-facing query latency is stable during report execution
- [ ] Reporting replica CPU utilization stays below 80% during heavy aggregation
- [ ] Analytics replica has sufficient storage for BI tool queries
- [ ] All application connections use correct named connection for their workload
- [ ] No heavy queries leak into user-facing replicas
- [ ] User-facing query latency: p99 < 100ms during batch report execution
- [ ] Reporting queries complete within expected SLA
- [ ] No resource contention between workload classes
- [ ] Each named connection routes to its designated replica
- [ ] Zero heavy queries on user-facing replicas (verified via monitoring)

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
- [ ] Heavy queries accidentally run on user-facing replica (code review miss) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Running reports on user-facing replicas**: A heavy report query blocks user requests on the same replica. Dedicate replicas per workload type. prevented

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
