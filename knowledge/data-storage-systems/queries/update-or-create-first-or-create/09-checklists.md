# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.26 updateOrCreate, firstOrCreate, firstOrNew
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use upsert for atomic create-or-update applied
- [ ] firstOrCreate for reference data applied
- [ ] firstOrNew for draft-like behavior applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Race condition with firstOrCreate**: Two requests simultaneously execute `firstOrCreate`. Both SELECT returns null. Both INSERT. Second INSERT violates unique constraint. Wrap in transaction or use upsert. prevented
- [ ] Using firstOrCreate in a loop**: `foreach ($items as $item) { Model::firstOrCreate(...) }` — N+1 pattern at the database level. Use upsert for batch operations. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] firstOrCreate used appropriately for non-concurrent single-row operations
- [ ] Batch operations use upsert instead of loops
- [ ] Race condition risk is mitigated with transactions

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use upsert for atomic create-or-update applied
- [ ] firstOrCreate for reference data applied
- [ ] firstOrNew for draft-like behavior applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Use `Model::firstOrCreate(['email' => $email], ['name' => $name])` for find-or-create completed
- [ ] Use `Model::firstOrNew(['email' => $email], ['name' => $name])` for unsaved instance completed
- [ ] Use `Model::updateOrCreate(['email' => $email], ['name' => $newName])` for conditional update completed
- [ ] Wrap in a database transaction for concurrent safety completed

---

# Performance Checklist

- [ ] Performance: Eager loading reduces query count from N+1 to 2 queries. chunkById is preferable to chunk for production processing as it avoids offset drift. Subq...

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Race condition with firstOrCreate**: Two requests simultaneously execute `firstOrCreate`. Both SELECT returns null. Both INSERT. Second INSERT violates unique constraint. Wrap in transaction or use upsert. prevented
- [ ] Using firstOrCreate in a loop**: `foreach ($items as $item) { Model::firstOrCreate(...) }` — N+1 pattern at the database level. Use upsert for batch operations. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Race condition risk is assessed for concurrent access
- [ ] Transaction wrapping used when atomicity is critical
- [ ] Batch operations use upsert instead of firstOrCreate in loops
- [ ] firstOrNew instance is explicitly saved when ready
- [ ] firstOrCreate used appropriately for non-concurrent single-row operations
- [ ] Batch operations use upsert instead of loops
- [ ] Race condition risk is mitigated with transactions
- [ ] Mass-assignment protection is properly configured

---

# Maintainability Checklist

- [ ] Code follows project conventions
- [ ] Configuration externalized
- [ ] Documentation updated
- [ ] Meaningful naming used

---

# Anti-Pattern Prevention Checklist

- [ ] Ignoring: Always Eager-Load Relationships In Loops prevented
- [ ] Unvalidated Assumptions About Behavior prevented
- [ ] ### Race condition with firstOrCreate prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Race condition with firstOrCreate**: Two requests simultaneously execute `firstOrCreate`. Both SELECT returns null. Both INSERT. Second INSERT violates unique constraint. Wrap in transaction or use upsert. prevented
- [ ] Using firstOrCreate in a loop**: `foreach ($items as $item) { Model::firstOrCreate(...) }` — N+1 pattern at the database level. Use upsert for batch operations. prevented

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
