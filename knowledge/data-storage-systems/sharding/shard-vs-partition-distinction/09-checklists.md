# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.22 Shard vs. partition distinction (shard = separate server, partition = within same server)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Shard + partition applied
- [ ] Partition first, shard later applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using "sharding" and "partitioning" interchangeably**: They solve different problems at different scales. Clear terminology matters for architecture decisions. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Always Include Partition Key In WHERE followed
- [ ] Chosen approach meets data volume and throughput requirements
- [ ] Decision documented with clear rationale
- [ ] Team understands the chosen approach

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Shard + partition applied
- [ ] Partition first, shard later applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Always Include Partition Key In WHERE followed
- [ ] Automate Partition Lifecycle followed
- [ ] Define partitioning: splitting a table within a single database server for lifecycle management and query optimization completed
- [ ] Define sharding: splitting data across multiple database servers for horizontal scale completed
- [ ] Compare characteristics: completed
- [ ] Choose partitioning when: completed
- [ ] Choose sharding when: completed

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

- [ ] Using "sharding" and "partitioning" interchangeably**: They solve different problems at different scales. Clear terminology matters for architecture decisions. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Always Include Partition Key In WHERE followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Decision between partitioning and sharding is documented with rationale
- [ ] Chosen approach meets data volume and performance requirements
- [ ] Operational complexity is acceptable
- [ ] Data volume and throughput assessed
- [ ] Query patterns analyzed
- [ ] Chosen approach meets data volume and throughput requirements
- [ ] Decision documented with clear rationale
- [ ] Team understands the chosen approach
- [ ] Chosen approach meets all requirements for 2+ years
- [ ] Decision documented and understood by team

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
- [ ] Choosing sharding when partitioning would suffice (unnecessary complexity) prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using "sharding" and "partitioning" interchangeably**: They solve different problems at different scales. Clear terminology matters for architecture decisions. prevented

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
