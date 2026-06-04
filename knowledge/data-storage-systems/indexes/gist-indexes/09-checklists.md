# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.3 GiST indexes (geometric, full-text, range types)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Spatial queries applied
- [ ] Range exclusion applied
- [ ] Nearest-neighbor optimization applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using GiST for simple equality**: GiST supports equality but is slower than B-Tree or Hash for that purpose. prevented
- [ ] Not analyzing before GiST queries**: PostgreSQL's planner needs accurate statistics for GiST selectivity estimates. Stale stats cause poor plan choices. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] GiST index correctly serves intended spatial/range queries
- [ ] EXPLAIN confirms GiST index usage
- [ ] Tables analyzed after index creation

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Spatial queries applied
- [ ] Range exclusion applied
- [ ] Nearest-neighbor optimization applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Identify spatial or range query requirements completed
- [ ] Choose GiST as the index type completed
- [ ] Create index: `DB::statement('CREATE INDEX ON places USING GIST (location)')` completed
- [ ] Use appropriate operators: `&&` (overlap), `<->` (distance), `@>` (contains) completed
- [ ] Analyze the table after creation for accurate stats completed

---

# Performance Checklist

- [ ] Performance: B-Tree indexes provide O(log n) lookup for equality and range queries. Composite indexes require leftmost prefix matching. Each additional index ad...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Using GiST for simple equality**: GiST supports equality but is slower than B-Tree or Hash for that purpose. prevented
- [ ] Not analyzing before GiST queries**: PostgreSQL's planner needs accurate statistics for GiST selectivity estimates. Stale stats cause poor plan choices. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] GiST is appropriate for the query type (spatial, range, nearest-neighbor)
- [ ] B-Tree wouldn't suffice for the query pattern
- [ ] Table analyzed after index creation
- [ ] Operator class matches the intended query operators
- [ ] GiST index correctly serves intended spatial/range queries
- [ ] EXPLAIN confirms GiST index usage
- [ ] Tables analyzed after index creation
- [ ] Appropriate operator class selected

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Avoid Over-Indexing Write-Heavy Tables prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Using GiST for simple equality prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using GiST for simple equality**: GiST supports equality but is slower than B-Tree or Hash for that purpose. prevented
- [ ] Not analyzing before GiST queries**: PostgreSQL's planner needs accurate statistics for GiST selectivity estimates. Stale stats cause poor plan choices. prevented

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
