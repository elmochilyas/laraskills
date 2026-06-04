# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.20 Modulus vs. consistent hashing for rebalancing efficiency
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Modulo for fixed shard count applied
- [ ] Consistent hashing for elastic clusters applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Choosing modulus with plans to expand**: The first shard addition moves 100% of data. Expensive and risky. Use consistent hashing. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Chosen strategy meets data movement requirements
- [ ] Adding/removing shards moves correct proportion of data
- [ ] Routing remains correct during and after rebalancing

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Modulo for fixed shard count applied
- [ ] Consistent hashing for elastic clusters applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Evaluate modulo hashing (`key % N`): completed
- [ ] Evaluate consistent hashing (ring-based): completed
- [ ] Choose based on: completed
- [ ] Implement chosen approach with appropriate tuning completed
- [ ] Test with shard count changes to validate data movement completed

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

- [ ] Choosing modulus with plans to expand**: The first shard addition moves 100% of data. Expensive and risky. Use consistent hashing. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Strategy aligns with shard count stability requirements
- [ ] Data movement on shard change is as expected
- [ ] Routing is deterministic
- [ ] Implementation is correct and testable
- [ ] Keys route consistently to same shard
- [ ] Chosen strategy meets data movement requirements
- [ ] Adding/removing shards moves correct proportion of data
- [ ] Routing remains correct during and after rebalancing
- [ ] Adding or removing a shard moves exactly ~1/N of keys
- [ ] Distribution across shards is within ±10% of uniform

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
- [ ] Using modulo when shard count changes â€” massive data movement prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Choosing modulus with plans to expand**: The first shard addition moves 100% of data. Expensive and risky. Use consistent hashing. prevented

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
