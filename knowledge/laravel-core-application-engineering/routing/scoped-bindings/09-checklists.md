# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Scoped Bindings
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Enable Scoping by Default
- [ ] Verify: Use Resource Scoping
- [ ] Verify: Audit Non-Scoped Routes
- [ ] Nested resource routes auto-scope (Laravel 8+)
- [ ] Manual nested routes use `->scopeBindings()`
- [ ] Controller type-hints both parent and child models
- [ ] Cross-resource requests return 404 (child not belonging to parent)
- [ ] `withoutScopedBindings()` has a comment explaining the exception
- [ ] Composite index `(parent_id, id)` exists on the child table
- [ ] Controller does NOT duplicate scoping with manual `$post->comments()->findOrFail()`
- [ ] Performance: Scoped bindings add an additional WHERE clause to the child model query. This...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Automatic Scoping (Resources)
- [ ] Architecture guideline: Route::resource('posts.comments', CommentController::class);
- [ ] Architecture guideline: // {comment} is automatically scoped within {post}
- [ ] Architecture guideline: ### Explicit Scoping
- [ ] Architecture guideline: Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
- [ ] Architecture guideline: ->scopeBindings();
- [ ] Architecture guideline: // Adds where('post_id', $post->id) to comment resolution
- [ ] Architecture guideline: ### Disabling Scoping
- [ ] Architecture guideline: Route::get('/posts/{post}/comments/{comment}', [CommentController::class, 'show'])
- [ ] Architecture guideline: ->withoutScopedBindings();
- [ ] Architecture guideline: // {comment} resolved globally, regardless of {post}
- [ ] Decision: Scoped Bindings vs Unscoped Nested Routes - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Enable Scoping by Default
- [ ] Best practice: Use Resource Scoping
- [ ] Best practice: Audit Non-Scoped Routes
- [ ] Skill applied: Implement Scoped Bindings for Nested Routes
- [ ] Skill applied: Add Composite Indexes for Scoped Binding Performance

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Scoped bindings add an additional WHERE clause to the child model query. This has negligible performance impact and m...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Cross-Resource Access
- [ ] Without scoping, `/posts/1/comments/50` resolves comment 50 even if it belongs to post 2. This is a data exposure vul...
- [ ] ### Multi-Tenant Isolation
- [ ] In multi-tenant applications, scoped bindings prevent tenant A from accessing tenant B's child resources. Always scop...
- [ ] ### Authorization Is Not Scoping
- [ ] Scoped bindings prevent access to non-owned child resources but do not replace authorization (policies/gates). Author...

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
- [ ] Nested resource routes auto-scope (Laravel 8+)
- [ ] Manual nested routes use `->scopeBindings()`
- [ ] Controller type-hints both parent and child models
- [ ] Cross-resource requests return 404 (child not belonging to parent)
- [ ] `withoutScopedBindings()` has a comment explaining the exception
- [ ] Composite index `(parent_id, id)` exists on the child table
- [ ] Controller does NOT duplicate scoping with manual `$post->comments()->findOrFail()`

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
- Implement Scoped Bindings for Nested Routes
- Add Composite Indexes for Scoped Binding Performance
### Decision Trees (from 07)
- Scoped Bindings vs Unscoped Nested Routes
- Auto-Scoping via Resource Routes vs Explicit scopeBindings()
- Scoped Bindings vs Manual Controller-Level Scoping
- Disabling Scoping via withoutScopedBindings() vs Restructuring Routes
### Related Rules (from 06 skills)
- Enable Scoped Bindings for All Nested Routes
- Require Documentation for withoutScopedBindings()
- Prefer Resource Routes for Automatic Scoping
- Do Not Duplicate Scoping in Controllers
### Related Skills (from 06 skills)
- Add Composite Indexes for Scoped Binding Performance
- Implement Implicit Route Model Binding
- Configure Nested Resources with Shallow Nesting

