# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.10 Verification during migrations (data integrity checks)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Automated verification script applied
- [ ] Verification in CI applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No verification before cutover**: "We'll correct it later" — old column is dropped, data is gone. Verify before contract phase. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Row counts match exactly between old and new structures
- [ ] Checksum/aggregate comparison confirms data correctness
- [ ] No constraint violations in the new structure

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Automated verification script applied
- [ ] Verification in CI applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Compare row counts: `SELECT COUNT(*) FROM old` vs `SELECT COUNT(*) FROM new` — must match exactly completed
- [ ] Compare checksums: `SELECT MD5(GROUP_CONCAT(col ORDER BY id)) FROM old` vs new — catches data differences completed
- [ ] Check for NULL violations: `SELECT COUNT(*) FROM new WHERE required_col IS NULL` completed
- [ ] Check FK violations: `SELECT COUNT(*) FROM child WHERE NOT EXISTS (SELECT 1 FROM parent WHERE id = child.parent_id)` completed
- [ ] Sample comparison: compare 1000 random rows side-by-side completed

---

# Performance Checklist

- [ ] Performance: Online DDL consumes IO and CPU during row copying. Monitor buffer pool and replication lag. Expand-contract dual-write doubles write throughput.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] No verification before cutover**: "We'll correct it later" — old column is dropped, data is gone. Verify before contract phase. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Row counts match between old and new structures
- [ ] Checksums or aggregates match
- [ ] No unexpected NULLs in required columns
- [ ] No FK violations in the new structure
- [ ] Sample comparison confirms data correctness
- [ ] Row counts match exactly between old and new structures
- [ ] Checksum/aggregate comparison confirms data correctness
- [ ] No constraint violations in the new structure
- [ ] Verification is automated and runs before traffic switch
- [ ] Failed verification triggers automated rollback

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Test Migrations Before Production prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### No verification before cut-over prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] No verification before cutover**: "We'll correct it later" — old column is dropped, data is gone. Verify before contract phase. prevented

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
