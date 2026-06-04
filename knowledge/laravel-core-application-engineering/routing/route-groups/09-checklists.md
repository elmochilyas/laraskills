# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Route Groups
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use Groups for Middleware Stack Selection
- [ ] Verify: Keep Group Nesting Shallow
- [ ] Verify: Explicitly Close Groups
- [ ] Verify: Use Name Prefixes Consistently
- [ ] Group provides at least one shared attribute (not purely visual)
- [ ] Name prefix includes trailing dot (e.g., `admin.`)
- [ ] Middleware stack is the outermost grouping dimension
- [ ] Group nesting does not exceed 3 levels
- [ ] `php artisan route:list` shows correct merged prefixes and names
- [ ] No duplicate middleware in nested groups
- [ ] Performance: Route groups have zero runtime performance cost. Group attributes are resolve...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Basic Group Structure
- [ ] Architecture guideline: Route::middleware(['auth'])->prefix('admin')->name('admin.')->group(function () {
- [ ] Architecture guideline: Route::get('/dashboard', [AdminController::class, 'dashboard'])->name('dashboard');
- [ ] Architecture guideline: // Result: URL /admin/dashboard, name admin.dashboard, middleware auth
- [ ] Architecture guideline: ### Nested Groups
- [ ] Architecture guideline: Route::prefix('api')->name('api.')->group(function () {
- [ ] Architecture guideline: Route::prefix('v1')->name('v1.')->group(function () {
- [ ] Architecture guideline: Route::get('/users', [UserController::class, 'index'])->name('users.index');
- [ ] Architecture guideline: // Result: URL /api/v1/users, name api.v1.users.index
- [ ] Architecture guideline: ### Domain Group
- [ ] Architecture guideline: Route::domain('admin.example.com')->group(function () {
- [ ] Architecture guideline: Route::get('/users', [AdminUserController::class, 'index']);

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use Groups for Middleware Stack Selection
- [ ] Best practice: Keep Group Nesting Shallow
- [ ] Best practice: Explicitly Close Groups
- [ ] Best practice: Use Name Prefixes Consistently
- [ ] Skill applied: Organize Routes with Group Attributes
- [ ] Skill applied: Configure Multi-Level Nested Route Groups

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] Route groups have zero runtime performance cost. Group attributes are resolved at route registration time (bootstrap)...
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Middleware Inheritance
- [ ] Be aware that nested groups merge middleware. A middleware that was intended for a parent group also applies to child...
- [ ] ### Domain Grouping for Admin Routes
- [ ] Use domain-based groups for admin panels to keep admin routes isolated. This adds a layer of access control beyond mi...

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
- [ ] Group provides at least one shared attribute (not purely visual)
- [ ] Name prefix includes trailing dot (e.g., `admin.`)
- [ ] Middleware stack is the outermost grouping dimension
- [ ] Group nesting does not exceed 3 levels
- [ ] `php artisan route:list` shows correct merged prefixes and names
- [ ] No duplicate middleware in nested groups

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
- Organize Routes with Group Attributes
- Configure Multi-Level Nested Route Groups
### Decision Trees (from 07)
- Attribute Merging Strategy (Middleware vs Prefix vs Name)
- Shallow Nesting vs Deep Nesting for Group Hierarchy
- Domain-Based Groups vs Prefix-Based Groups
- Group-as-Organization vs Group-for-Shared-Attributes
### Related Rules (from 06 skills)
- Limit Group Nesting to Three Levels
- Always Include Trailing Dot in Name Prefixes
- Understand Attribute Merging Rules
- Group by Middleware Stack First
- Do Not Create Groups for Visual Organization Only
### Related Skills (from 06 skills)
- Configure Multi-Level Nested Route Groups
- Define Application Routes
- Implement Named Rate Limiters

