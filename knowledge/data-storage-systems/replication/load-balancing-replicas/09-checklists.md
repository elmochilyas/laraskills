# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7.9 Load balancing across replicas (round-robin, least connections)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] ProxySQL for weighted balancing applied
- [ ] Round-robin for equal replicas applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Uneven replica sizing with random balancing**: A smaller replica receives the same traffic as larger ones and becomes the bottleneck. Use weighted balancing. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Per-replica CPU utilization within 10% of each other (equal replicas)
- [ ] Weighted replicas match configured ratio within 5% tolerance
- [ ] Zero traffic routed to unhealthy replicas

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] ProxySQL for weighted balancing applied
- [ ] Round-robin for equal replicas applied
- [ ] Always Monitor Replica Lag followed
- [ ] Enumerate replicas and their capacities completed
- [ ] If all replicas are equal → round-robin (uniform distribution) completed
- [ ] If replicas differ → weighted balancing via ProxySQL or custom connector completed
- [ ] If query response time varies → least-connections routing completed
- [ ] Implement strategy in connection pooler (ProxySQL) or custom Laravel DB connector completed

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

- [ ] Uneven replica sizing with random balancing**: A smaller replica receives the same traffic as larger ones and becomes the bottleneck. Use weighted balancing. prevented
- [ ] Always Monitor Replica Lag followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Read traffic distribution matches configured weights
- [ ] No single replica exceeds 80% utilization while others are idle
- [ ] Failing replica is automatically removed from rotation
- [ ] Balancer adds negligible latency (<1ms per query)
- [ ] Traffic ratio matches configured weights within 5%
- [ ] Per-replica CPU utilization within 10% of each other (equal replicas)
- [ ] Weighted replicas match configured ratio within 5% tolerance
- [ ] Zero traffic routed to unhealthy replicas
- [ ] Replica utilization proportional to weight within 5%
- [ ] No replica consistently overloaded

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
- [ ] Uneven load with Laravel random default: smaller replica becomes bottleneck prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Uneven replica sizing with random balancing**: A smaller replica receives the same traffic as larger ones and becomes the bottleneck. Use weighted balancing. prevented

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
