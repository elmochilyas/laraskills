# Metadata

**Domain:** data-storage-systems
**Subdomain:** sharding
**Knowledge Unit:** 6.15 Packages: allnetru/laravel-sharding (hash, range, db_range, redis strategies; Snowflake/sequence ID; coroutine fan-out)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Package + custom shard proxy applied
- [ ] Strategies per model applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Package as silver bullet**: The package handles routing, but shard key selection, rebalancing, and cross-shard transaction avoidance require careful design. Package is a tool, not a solution. prevented
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Sharding solution meets all functional requirements
- [ ] Team has clear understanding of chosen approach
- [ ] Migration path is defined and tested

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Package + custom shard proxy applied
- [ ] Strategies per model applied
- [ ] Choose High-Cardinality Shard Key followed
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Evaluate available packages: completed
- [ ] Evaluate infrastructure solutions: completed
- [ ] Compare against requirements: completed
- [ ] Decide: custom Laravel implementation vs infrastructure solution completed
- [ ] Document decision with rationale completed

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

- [ ] Package as silver bullet**: The package handles routing, but shard key selection, rebalancing, and cross-shard transaction avoidance require careful design. Package is a tool, not a solution. prevented
- [ ] Never Rely On Cross-Shard Transactions followed
- [ ] Failure modes documented

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Solution meets all sharding requirements
- [ ] Team can implement and maintain the solution
- [ ] Performance characteristics acceptable
- [ ] Migration path clear from current architecture
- [ ] Routes to correct shard correctly
- [ ] Sharding solution meets all functional requirements
- [ ] Team has clear understanding of chosen approach
- [ ] Migration path is defined and tested
- [ ] Custom sharding implementation meets all requirements
- [ ] All queries route to correct shard

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
- [ ] Choosing a package that doesn't meet requirements prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Package as silver bullet**: The package handles routing, but shard key selection, rebalancing, and cross-shard transaction avoidance require careful design. Package is a tool, not a solution. prevented

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
