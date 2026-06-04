# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Custom Route Keys
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Prefer Inline Syntax Over Model Override
- [ ] Verify: Ensure Column Uniqueness
- [ ] Verify: Document Custom Keys in Route Files
- [ ] Custom key column has a database unique constraint
- [ ] Custom key column has a database index
- [ ] Inline `{parameter:column}` syntax used, not `getRouteKeyName()` override
- [ ] Inline comment documents the binding column
- [ ] `route()` helper generates correct URLs using the custom key
- [ ] 404 returned for non-matching custom key values
- [ ] Performance: Custom keys require a database query on a potentially non-indexed column. Alw...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Inline Syntax
- [ ] Architecture guideline: Route::get('/users/{user:slug}', [UserController::class, 'show']);
- [ ] Architecture guideline: Route::get('/posts/{post:uuid}', [PostController::class, 'show']);
- [ ] Architecture guideline: ### Model Override
- [ ] Architecture guideline: class User extends Model
- [ ] Architecture guideline: public function getRouteKeyName(): string
- [ ] Architecture guideline: ### URL Generation
- [ ] Architecture guideline: route('users.show', $user); // Uses getRouteKey() value
- [ ] Decision: Inline Custom Key Syntax vs Model-Level getRouteKeyName() - ensure correct choice is made
- [ ] Decision: UUID/ULID Keys vs Auto-Increment IDs for Public Routes - ensure correct choice is made
- [ ] Decision: Unique Constraint Enforcement on Custom Key Columns - ensure correct choice is made
- [ ] Decision: Database Index Strategy for Custom Key Columns - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Prefer Inline Syntax Over Model Override
- [ ] Best practice: Ensure Column Uniqueness
- [ ] Best practice: Document Custom Keys in Route Files
- [ ] Skill applied: Configure Custom Route Keys with Inline Syntax
- [ ] Skill applied: Implement Model-Level Route Key Customization

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Custom keys require a database query on a potentially non-indexed column. Always ensure the custom key column has a d...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### UUID/ULID Exposure
- [ ] While UUIDs don't expose sequential IDs, they still identify specific resources. UUID-based routes should still imple...
- [ ] ### Slug Predictability
- [ ] Sequential or predictable slugs (e.g., `my-post-1`, `my-post-2`) can be enumerated. For sensitive resources, use UUID...

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
- [ ] Custom key column has a database unique constraint
- [ ] Custom key column has a database index
- [ ] Inline `{parameter:column}` syntax used, not `getRouteKeyName()` override
- [ ] Inline comment documents the binding column
- [ ] `route()` helper generates correct URLs using the custom key
- [ ] 404 returned for non-matching custom key values

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Missing Database Index on Custom Key Column -- apply preferred alternative
    - [ ] Every custom key column has a database index
    - [ ] Unique index is present for uniqueness-dependent keys (slugs, UUIDs)
    - [ ] Binding query EXPLAIN shows index usage (not full table scan)
- [ ] Prevent: Using UUID as Primary Key on Large Tables -- apply preferred alternative
    - [ ] Primary keys are auto-increment integers (not UUIDs) on large tables
    - [ ] Foreign keys are integers (not UUIDs)
    - [ ] UUID columns exist as secondary unique indexes for route binding
- [ ] Prevent: Inline Syntax Without Matching `getRouteKeyName()` for URL Generation -- apply preferred alternative
    - [ ] `route()` helper generates URLs matching the route's binding field
    - [ ] No mismatch between inline syntax and `getRouteKeyName()`
    - [ ] Generated URLs work when loaded in the browser
- [ ] Prevent: Model-Level Override for Single-Route Need -- apply preferred alternative
    - [ ] `getRouteKeyName()` is only overridden when ALL routes need the custom key
    - [ ] Single-route custom keys use inline syntax, not model override
    - [ ] Admin and internal routes use IDs (default binding) unless explicitly needed otherwise
- [ ] Prevent: Non-Unique Custom Key Column -- apply preferred alternative
    - [ ] All custom key columns have unique constraints
    - [ ] Binding queries return deterministic, single results
    - [ ] No duplicate values exist in binding columns

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
- Configure Custom Route Keys with Inline Syntax
- Implement Model-Level Route Key Customization
### Decision Trees (from 07)
- Inline Custom Key Syntax vs Model-Level getRouteKeyName()
- UUID/ULID Keys vs Auto-Increment IDs for Public Routes
- Unique Constraint Enforcement on Custom Key Columns
- Database Index Strategy for Custom Key Columns
### Anti-Patterns (from 08)
- Missing Database Index on Custom Key Column
- Using UUID as Primary Key on Large Tables
- Inline Syntax Without Matching `getRouteKeyName()` for URL Generation
- Model-Level Override for Single-Route Need
- Non-Unique Custom Key Column
### Related Rules (from 06 skills)
- Prefer Inline Custom Key Syntax
- Enforce Unique Constraints on Custom Key Columns
- Index Custom Key Columns
- Avoid Exposing Auto-Increment IDs in Public URLs
- Document Custom Keys in Route Files
### Related Skills (from 06 skills)
- Implement Implicit Route Model Binding
- Implement Explicit Route Model Binding
- Define Application Routes

