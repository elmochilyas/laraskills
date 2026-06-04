# Metadata

**Domain:** data-storage-systems
**Subdomain:** queries
**Knowledge Unit:** 2.15 Scopes (global scopes, local scopes, dynamic scopes)
**Generated:** 2026-06-03
**Based on:** 02-knowledge-unit.md, 03-decomposition.md, 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Tenant isolation via global scope applied
- [ ] Soft delete filtering applied
- [ ] Common filters as local scopes applied
- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Bypassing global scopes accidentally**: Using `DB::table('posts')` instead of `Post::query()` bypasses the global scope. In multi-tenant apps, this leaks data. prevented
- [ ] withoutGlobalScope in production code**: Used as a shortcut instead of designing the query correctly. Should be reviewed carefully. prevented
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] Global scopes properly isolate tenant data
- [ ] Local scopes are reused across the codebase
- [ ] withoutGlobalScope is used only in justified cases

---

# Architecture Checklist

- [ ] Responsibilities clearly separated
- [ ] Correct layer selected
- [ ] Dependency boundaries respected
- [ ] No circular dependencies
- [ ] Domain boundaries respected

---

# Implementation Checklist

- [ ] Tenant isolation via global scope applied
- [ ] Soft delete filtering applied
- [ ] Common filters as local scopes applied
- [ ] Always Eager-Load Relationships In Loops followed
- [ ] Use chunkById Over chunk For Production followed
- [ ] Disable Lazy Loading In Non-Production followed
- [ ] For global scopes, register via `boot()` trait method or `addGlobalScope()` completed
- [ ] For local scopes, define `scopeActive($query)` and call as `Model::active()->get()` completed
- [ ] For dynamic scopes, define `scopeOfType($query, $type)` and call as `Model::ofType('admin')->get()` completed
- [ ] Use `Model::withoutGlobalScope('scope_name')` to bypass when necessary completed

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

- [ ] Bypassing global scopes accidentally**: Using `DB::table('posts')` instead of `Post::query()` bypasses the global scope. In multi-tenant apps, this leaks data. prevented
- [ ] withoutGlobalScope in production code**: Used as a shortcut instead of designing the query correctly. Should be reviewed carefully. prevented
- [ ] Always Eager-Load Relationships In Loops followed

---

# Testing Checklist

- [ ] Core concepts are understood and applied correctly
- [ ] Configuration follows documented best practices
- [ ] Common mistakes are avoided through code review
- [ ] Performance characteristics are validated with measurements
- [ ] Security considerations are addressed
- [ ] Global scopes don't accidentally leak data across tenants
- [ ] withoutGlobalScope usage is reviewed and justified
- [ ] Local scopes are named clearly (verb form: scopeActive, scopeRecent)
- [ ] Dynamic scopes accept parameters with clear names
- [ ] Global scopes properly isolate tenant data
- [ ] Local scopes are reused across the codebase
- [ ] withoutGlobalScope is used only in justified cases
- [ ] Scopes are clearly named and well-documented

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
- [ ] ### Bypassing global scopes accidentally prevented
- [ ] Wrong Decision Without Context Evaluation prevented
- [ ] Production Blindness prevented
- [ ] Bypassing global scopes accidentally**: Using `DB::table('posts')` instead of `Post::query()` bypasses the global scope. In multi-tenant apps, this leaks data. prevented
- [ ] withoutGlobalScope in production code**: Used as a shortcut instead of designing the query correctly. Should be reviewed carefully. prevented

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
