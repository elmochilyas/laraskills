# Metadata

**Domain:** data-storage-systems
**Subdomain:** replication
**Knowledge Unit:** 7-13 Plan Replication Topology
**Generated:** 2026-06-04
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Replica count meets read scaling requirements
- [ ] Topology supports failover RTO and RPO
- [ ] Cross-AZ placement verified
- [ ] Replication modes configured correctly per tier
- [ ] Topology diagram documented
- [ ] Capacity planning accounts for replica growth

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Determine minimum replica count applied
- [ ] Choose topology applied
- [ ] Apply placement applied
- [ ] Decide replication mode per tier applied
- [ ] Document topology with node IPs and roles applied
- [ ] Always Place Replicas in Different AZs followed
- [ ] Never Design Topology Without RPO/RTO Targets followed

---

# Performance Checklist

- [ ] Primary impact: each replica adds ~5-10% CPU/IO overhead
- [ ] Replica apply: single-threaded by default (MySQL)
- [ ] Cross-AZ: 1-5ms RTT vs same-AZ: 0.1-0.5ms

---

# Security Checklist

- [ ] Intra-VPC encryption recommended
- [ ] Cross-region: mandatory TLS
- [ ] Topology docs don't expose connection strings

---

# Reliability Checklist

- [ ] Always Document Topology With Node Roles followed
- [ ] Multi-AZ placement verified

---

# Testing Checklist

- [ ] Replica count meets read scaling requirements
- [ ] Topology supports failover RTO and RPO
- [ ] Cross-AZ placement verified
- [ ] Replication modes configured correctly for each tier
- [ ] Topology diagram documented and shared
- [ ] Capacity planning accounts for replica growth
- [ ] Single-tier vs multi-tier decision made
- [ ] Same-AZ vs multi-AZ vs multi-region decided

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Too few replicas for read traffic prevented
- [ ] Too many replicas causing overhead prevented
- [ ] Cross-region with sync replication prevented
- [ ] All replicas in same AZ prevented
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
