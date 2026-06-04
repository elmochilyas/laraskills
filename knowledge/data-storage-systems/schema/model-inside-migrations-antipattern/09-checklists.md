# Metadata

**Domain:** data-storage-systems
**Subdomain:** schema
**Knowledge Unit:** 1.23 Model usage inside migrations anti-pattern (use DB::table or raw SQL instead)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Use DB::table for data access in migrations applied
- [ ] Use raw SQL for complex transformations applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Using a model that has global scopes**: The model's `boot()` registers a `tenant_id` global scope. The migration doesn't set tenant context. The query filters by `tenant_id IS NULL` and affects no rows. prevented
- [ ] Using a model with accessors**: `User::first()->full_name` in a migration references an accessor that concatenates `first_name` and `last_name`. If `first_name` was renamed to `given_name` in a later migration, the migration fails. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] All migrations use `DB::table()` or raw SQL for data access
- [ ] Fresh database installs succeed regardless of current model state
- [ ] Model refactors never break migration execution

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Use DB::table for data access in migrations applied
- [ ] Use raw SQL for complex transformations applied
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed
- [ ] Separate Schema Changes From Data Changes followed
- [ ] Instead of `User::where('status', 'active')->update(['type' => 'customer'])`, use `DB::table('users')->where('status', 'active')->update(['type' =>... completed
- [ ] For complex transformations, use `DB::statement('UPDATE users SET ...')` with raw SQL completed
- [ ] Never call Eloquent model methods (scopes, accessors, mutators) within migration files completed
- [ ] If a data transformation requires application logic, dispatch a queue job from the migration and implement the logic outside the migration completed

---

# Performance Checklist

- [ ] Performance: DB::table() is slightly faster than Eloquent queries (no hydration overhead), but the difference is negligible in migration context.

---

# Security Checklist

- [ ] Security: Ensure proper access controls for database resources
- [ ] Security: Use encryption (TLS) for data in transit
- [ ] Security: Audit configuration changes and access patterns
- [ ] Security: Follow the principle of least privilege

---

# Reliability Checklist

- [ ] Using a model that has global scopes**: The model's `boot()` registers a `tenant_id` global scope. The migration doesn't set tenant context. The query filters by `tenant_id IS NULL` and affects no rows. prevented
- [ ] Using a model with accessors**: `User::first()->full_name` in a migration references an accessor that concatenates `first_name` and `last_name`. If `first_name` was renamed to `given_name` in a later migration, the migration fails. prevented
- [ ] Always Test Migrations Before Production followed
- [ ] Never Use Eloquent Models Inside Migrations followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] No Eloquent model references in any migration file
- [ ] All data access uses `DB::table()` or raw SQL
- [ ] `migrate:fresh` runs successfully without model-related errors
- [ ] `migrate:rollback` works after model refactors
- [ ] All migrations use `DB::table()` or raw SQL for data access
- [ ] Fresh database installs succeed regardless of current model state
- [ ] Model refactors never break migration execution
- [ ] Model scopes and accessors don't affect migration behavior

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
- [ ] ### Model with global scopes prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Using a model that has global scopes**: The model's `boot()` registers a `tenant_id` global scope. The migration doesn't set tenant context. The query filters by `tenant_id IS NULL` and affects no rows. prevented
- [ ] Using a model with accessors**: `User::first()->full_name` in a migration references an accessor that concatenates `first_name` and `last_name`. If `first_name` was renamed to `given_name` in a later migration, the migration fails. prevented

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
