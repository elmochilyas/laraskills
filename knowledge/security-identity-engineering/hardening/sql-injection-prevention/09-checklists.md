# Metadata
**Domain:** Security & Identity Engineering
**Subdomain:** Security Hardening
**Knowledge Unit:** SQL injection via parameterized bindings
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Prevent anti-pattern: Raw SQL Everywhere**: `whereRaw`, `selectRaw`, `orderByRaw` used instead of query builder
- [ ] Prevent anti-pattern: No Column Whitelist Policy**: User-controlled column names passed without validation
- [ ] Prevent anti-pattern: Production Query Logging**: `DB::enableQueryLog()` or `DB::listen()` active in production
- [ ] All Eloquent queries use parameter binding
- [ ] Query builder where clauses use array syntax or `?` bindings
- [ ] `whereRaw`, `orderByRaw`, `selectRaw` use parameter binding for user input
- [ ] No string concatenation in SQL anywhere in the codebase
- [ ] User input cast to expected types before query usage
- [ ] Avoid: Mistake
- [ ] Avoid: String interpolation in raw queries
- [ ] Avoid: User-controlled column names

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- Eloquent ORM for model queries: safe by default
- Query builder for complex joins/reports: safe by default with where()/having()
- Raw methods for database-specific features: always use parameterized bindings
- Column name whitelist: define in model or controller for sortable/filterable columns
- LIKE queries: parameterized binding plus escape of LIKE wildcards

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] - [ ] All Eloquent queries use parameter binding
- [ ] - [ ] Query builder where clauses use array syntax or `?` bindings
- [ ] - [ ] `whereRaw`, `orderByRaw`, `selectRaw` use parameter binding for user input
- [ ] - [ ] No string concatenation in SQL anywhere in the codebase

# Performance Checklist
- Parameterized binding has no performance cost vs string interpolation
- Prepared statements (which PDO uses) may be slightly slower for single queries but faster for repeated queries
- Column whitelisting adds negligible overhead (in_array check)

# Security Checklist
- **Parameterized Binding is Essential**: String interpolation in SQL is always an injection risk. No amount of validation/escaping is as safe as parameterized queries.
- **Second-Order Injection**: Data stored in the database that is later used in raw queries without binding. Sanitize output appropriately.
- **Column Name Injection**: Users can manipulate sort/filter columns if not whitelisted. `orderBy($request->input('sort'))` can lead to unauthorized data exposure.
- **JSON Column Injection**: JSON path expressions in MySQL/MariaDB may accept user input. Validate before use.

# Reliability Checklist
- [ ] Ensure: Laravel prevents SQL injection primarily through Eloquent ORM and the query buil...

# Testing Checklist
- [ ] All Eloquent queries use parameter binding
- [ ] Query builder where clauses use array syntax or `?` bindings
- [ ] `whereRaw`, `orderByRaw`, `selectRaw` use parameter binding for user input
- [ ] No string concatenation in SQL anywhere in the codebase
- [ ] User input cast to expected types before query usage
- [ ] Avoid: Mistake
- [ ] Avoid: String interpolation in raw queries
- [ ] Avoid: User-controlled column names

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Raw SQL Everywhere**: `whereRaw`, `selectRaw`, `orderByRaw` used instead of query builder
- [ ] Prevent: No Column Whitelist Policy**: User-controlled column names passed without validation
- [ ] Prevent: Production Query Logging**: `DB::enableQueryLog()` or `DB::listen()` active in production
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: String interpolation in raw queries
- [ ] Avoid mistake: User-controlled column names
- [ ] Avoid mistake: LIKE queries without escaping
- [ ] Avoid mistake: Assuming all Eloquent methods are safe

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Anti-Patterns
- Raw SQL Everywhere**: `whereRaw`, `selectRaw`, `orderByRaw` used instead of query builder
- No Column Whitelist Policy**: User-controlled column names passed without validation
- Production Query Logging**: `DB::enableQueryLog()` or `DB::listen()` active in production
## Skills
- Prevent SQL Injection with Parameter Binding and Eloquent


