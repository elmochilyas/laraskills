# Metadata

**Domain:** data-storage-systems
**Subdomain:** partitioning
**Knowledge Unit:** 8.13 Default partition considerations (catch-all partition risks)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] No default partition applied
- [ ] Monitor default partition size applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] MAXVALUE partition as "set and forget"**: "I'll add partitions later" → default grows for months. Partition pruning becomes useless. All queries scan the giant default. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Default partition stays small (< 10% of total)
- [ ] Pre-creation schedule covers future partition needs
- [ ] Monitoring alerts on default growth

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] No default partition applied
- [ ] Monitor default partition size applied
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Evaluate whether to use a default partition: completed
- [ ] If using MAXVALUE (range): completed
- [ ] If using DEFAULT (list): completed
- [ ] Schedule automatic remediation: completed
- [ ] Consider eliminating default partition and relying on pre-creation: completed

---

# Performance Checklist

- [ ] Performance: Partition pruning eliminates irrelevant partitions from query scan. Range partitioning enables partition-level DROP for instant archival.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] MAXVALUE partition as "set and forget"**: "I'll add partitions later" → default grows for months. Partition pruning becomes useless. All queries scan the giant default. prevented
- [ ] Always Include Partition Key In WHERE followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Default partition size monitored and alerts configured
- [ ] Pre-creation schedule covers all needed partitions
- [ ] Alternative (no default) INSERT-failure alert works
- [ ] Regular review of default partition values
- [ ] New partitions are added before data arrives
- [ ] Default partition stays small (< 10% of total)
- [ ] Pre-creation schedule covers future partition needs
- [ ] Monitoring alerts on default growth
- [ ] New partitions are proactively created

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Include Partition Key In WHERE prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] MAXVALUE partition collects years of data â€” becomes largest partition prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] MAXVALUE partition as "set and forget"**: "I'll add partitions later" → default grows for months. Partition pruning becomes useless. All queries scan the giant default. prevented

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
