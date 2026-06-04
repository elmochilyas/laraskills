# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Select Constraints
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] List/index queries use explicit `select()` with minimal columns
- [ ] Constrained eager loading includes the foreign key column
- [ ] Partial models loaded with `select()` are never saved to the database
- [ ] Sensitive columns excluded via `select()` (not just `$hidden`)
- [ ] `preventAccessingMissingAttributes()` enabled in development
- [ ] Separate select lists used for list vs detail views
- [ ] Performance: - Selecting 5 columns instead of 20 reduces row data transfer by ~75% â€” for...
- [ ] Performance: - Column reduction helps InnoDB read fewer pages from disk when columns are n...
- [ ] Performance: - Constrained eager loading reduces memory: loading 10k comments with only `i...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Define explicit select lists in repository methods â€” never rely on `SELECT *` in production q...
- [ ] Architecture guideline: - Use `addSelect()` in query scopes to extend rather than override the column list
- [ ] Architecture guideline: - Enable `preventAccessingMissingAttributes()` in development to catch partial model access bugs
- [ ] Architecture guideline: - Audit `SELECT *` queries via database monitoring tools
- [ ] Decision: select() Usage Strategy - ensure correct choice is made
- [ ] Decision: List vs Detail View Select Separation - ensure correct choice is made
- [ ] Decision: Partial Model Safety Decision - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Select Constraints for Efficient Data Retrieval

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Selecting 5 columns instead of 20 reduces row data transfer by ~75% â€” for 10k rows, this is ~500 KB vs ~2 MB
- [ ] - Column reduction helps InnoDB read fewer pages from disk when columns are narrower
- [ ] - Constrained eager loading reduces memory: loading 10k comments with only `id` and `body` instead of 15 columns save...
- [ ] - `$hidden` does not reduce I/O â€” data is still loaded; it only filters serialization

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Never select sensitive columns (ssn, password_reset_token, internal_notes) in non-privileged queries â€” `$hidden` ...
- [ ] - Use `select()` to avoid loading sensitive data entirely, not just `$hidden` to hide it

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] List/index queries use explicit `select()` with minimal columns
- [ ] Constrained eager loading includes the foreign key column
- [ ] Partial models loaded with `select()` are never saved to the database
- [ ] Sensitive columns excluded via `select()` (not just `$hidden`)
- [ ] `preventAccessingMissingAttributes()` enabled in development
- [ ] Separate select lists used for list vs detail views

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Implement Select Constraints for Efficient Data Retrieval
### Decision Trees (from 07)
- select() Usage Strategy
- List vs Detail View Select Separation
- Partial Model Safety Decision
### Related Rules (from 06 skills)
- Never Save Partial Models (performance-and-integrity/select-constraints)
- Always Include the Foreign Key in Constrained Eager Loading (performance-and-integrity/select-constraints)
- Use $hidden for Serialization, select() for I/O Reduction (performance-and-integrity/select-constraints)
- Use Different Select Sets for List vs. Detail Views (performance-and-integrity/select-constraints)
- Never Select Sensitive Columns in Non-Privileged Queries (performance-and-integrity/select-constraints)
### Related Skills (from 06 skills)
- Prevent N+1 with Eager Loading Strategies
- Design Index-Aware Queries
- Implement Read-Only Export with toBase

