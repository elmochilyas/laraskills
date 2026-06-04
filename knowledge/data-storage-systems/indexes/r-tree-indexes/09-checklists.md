# Metadata

**Domain:** data-storage-systems
**Subdomain:** indexes
**Knowledge Unit:** 3.7 R-Tree indexes (MySQL spatial data)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Location-based search applied
- [ ] Geofencing applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No spatial index**: Spatial queries without spatial index perform full table scan. Adding `SPATIAL INDEX` is essential. prevented
- [ ] Indexing non-spatial data with spatial index**: Spatial indexes are only useful for `GEOMETRY` type columns with spatial queries. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] SPATIAL INDEX created on GEOMETRY column
- [ ] Spatial queries use index (confirmed by EXPLAIN)
- [ ] Distance, containment, and intersection queries work correctly

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Location-based search applied
- [ ] Geofencing applied
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed
- [ ] Write Sargable WHERE Conditions followed
- [ ] Add GEOMETRY column to table in migration completed
- [ ] Create spatial index: `$table->spatialIndex('location')` completed
- [ ] Query using spatial functions: `->whereRaw('ST_Distance_Sphere(location, POINT(?, ?)) < 1000', [$lat, $lng])` completed
- [ ] Verify with EXPLAIN that the spatial index is used completed

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

- [ ] No spatial index**: Spatial queries without spatial index perform full table scan. Adding `SPATIAL INDEX` is essential. prevented
- [ ] Indexing non-spatial data with spatial index**: Spatial indexes are only useful for `GEOMETRY` type columns with spatial queries. prevented
- [ ] Avoid Over-Indexing Write-Heavy Tables followed
- [ ] Always Index Foreign Key Columns followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Column is GEOMETRY type
- [ ] SPATIAL INDEX created on the geometry column
- [ ] Query uses spatial functions (MBRContains, ST_Within, etc.)
- [ ] EXPLAIN shows index usage
- [ ] SPATIAL INDEX created on GEOMETRY column
- [ ] Spatial queries use index (confirmed by EXPLAIN)
- [ ] Distance, containment, and intersection queries work correctly
- [ ] No spatial queries without supporting index

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
- [ ] ### No spatial index prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No spatial index**: Spatial queries without spatial index perform full table scan. Adding `SPATIAL INDEX` is essential. prevented
- [ ] Indexing non-spatial data with spatial index**: Spatial indexes are only useful for `GEOMETRY` type columns with spatial queries. prevented

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
