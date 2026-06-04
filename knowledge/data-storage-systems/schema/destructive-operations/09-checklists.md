# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema/production-schema-operations
**Knowledge Unit:** 11.13 Destructive operations (DROP COLUMN, DROP TABLE, TRUNCATE) safety
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Safe DROP COLUMN applied
- [ ] DROP TABLE checklist applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] DROP COLUMN as part of standard migration**: "I added a column then dropped it in the next migration" — data is gone. Use expand-contract to allow rollback. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Destructive operations only after verified zero references
- [ ] Pre-operation backup exists and is tested
- [ ] Deprecated suffix period catches lingering references

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Safe DROP COLUMN applied
- [ ] DROP TABLE checklist applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Add `_deprecated` suffix to the column name (or rename table to `_old`) — this breaks any code that still references it completed
- [ ] Monitor application error logs for references to the deprecated structure completed
- [ ] If no errors after 1-2 weeks, proceed with the DROP completed
- [ ] Take a backup of the affected data before dropping completed
- [ ] Execute the DROP as a standard migration completed

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

- [ ] DROP COLUMN as part of standard migration**: "I added a column then dropped it in the next migration" — data is gone. Use expand-contract to allow rollback. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Compatibility window has passed without errors
- [ ] Application logs show zero references to the structure
- [ ] Backup taken before the destructive operation
- [ ] Migration DDL is tested on staging
- [ ] Rollback plan exists (restore from backup)
- [ ] Destructive operations only after verified zero references
- [ ] Pre-operation backup exists and is tested
- [ ] Deprecated suffix period catches lingering references
- [ ] Data is recoverable from backup if needed
- [ ] Application logs confirm no breakage after removal

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
- [ ] ### DROP COLUMN as part of standard workflow prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] DROP COLUMN as part of standard migration**: "I added a column then dropped it in the next migration" — data is gone. Use expand-contract to allow rollback. prevented

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
