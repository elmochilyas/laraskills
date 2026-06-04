# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Rendering Performance
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Eager Load All View Data Before Calling `view()`
- [ ] Enforce: Never Write Database Queries Inside `@php` Blocks
- [ ] Enforce: Pre-Compute Formatted Values in View Models
- [ ] Enforce: Cache Rendered Partials for Expensive, Rarely-Changing Sections
- [ ] Enforce: Pre-Compile All Views During Deployment
- [ ] Enforce: Profile Before Optimizing Views
- [ ] Enforce: Limit View Composition Depth to 3 Levels
- [ ] All database queries are eager-loaded before being passed to views
- [ ] No database queries or API calls exist inside `@php` blocks or templates
- [ ] Pre-computed view models handle all formatting (no inline `number_format`/`Str::limit`)
- [ ] Expensive, rarely-changing partials are cached
- [ ] View composition depth does not exceed 3 levels
- [ ] `php artisan view:cache` runs during deployment
- [ ] Slow view monitoring is configured (threshold < 100ms per view)
- [ ] No collection with >100 items is rendered without pagination
- [ ] Laravel Debugbar or Telescope shows view rendering time < 10ms per page

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### View Composition Depth
- [ ] Architecture guideline: ### Component vs @include Performance
- [ ] Architecture guideline: Use @include for simple partials. Use components for scoped UI pieces.
- [ ] Architecture guideline: ### Baseline Benchmarks
- [ ] Architecture guideline: ### Output Size Impact
- [ ] Architecture guideline: Network time dominates for large responses. Pagination and lazy loading reduce output size.
- [ ] Decision: Data Preparation Location (Controller vs View Model vs Template) - ensure correct choice is made
- [ ] Decision: Caching Strategy for View Partials - ensure correct choice is made
- [ ] Decision: View Composition Depth - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Eager Load All View Data Before Calling `view()`
- [ ] Apply rule: Never Write Database Queries Inside `@php` Blocks
- [ ] Apply rule: Pre-Compute Formatted Values in View Models
- [ ] Apply rule: Cache Rendered Partials for Expensive, Rarely-Changing Sections
- [ ] Apply rule: Pre-Compile All Views During Deployment
- [ ] Apply rule: Profile Before Optimizing Views
- [ ] Apply rule: Limit View Composition Depth to 3 Levels
- [ ] Skill applied: Profile and Optimize Slow View Rendering

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

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
- [ ] All database queries are eager-loaded before being passed to views
- [ ] No database queries or API calls exist inside `@php` blocks or templates
- [ ] Pre-computed view models handle all formatting (no inline `number_format`/`Str::limit`)
- [ ] Expensive, rarely-changing partials are cached
- [ ] View composition depth does not exceed 3 levels
- [ ] `php artisan view:cache` runs during deployment
- [ ] Slow view monitoring is configured (threshold < 100ms per view)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Database Queries Inside `@php` Blocks -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Formatting Inside `@foreach` Loops -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Optimizing Without Profiling -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Deep View Composition (5+ Levels) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: No View Pre-Compilation on Deployment -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
### Rules (from 05)
- Eager Load All View Data Before Calling `view()`
- Never Write Database Queries Inside `@php` Blocks
- Pre-Compute Formatted Values in View Models
- Cache Rendered Partials for Expensive, Rarely-Changing Sections
- Pre-Compile All Views During Deployment
- Profile Before Optimizing Views
- Limit View Composition Depth to 3 Levels
### Skills (from 06)
- Profile and Optimize Slow View Rendering
### Decision Trees (from 07)
- Data Preparation Location (Controller vs View Model vs Template)
- Caching Strategy for View Partials
- View Composition Depth
### Anti-Patterns (from 08)
- Database Queries Inside `@php` Blocks
- Formatting Inside `@foreach` Loops
- Optimizing Without Profiling
- Deep View Composition (5+ Levels)
- No View Pre-Compilation on Deployment
### Related Rules (from 06 skills)
- rendering-performance/05-rules.md: Eager Load All View Data Before Calling `view()`
- rendering-performance/05-rules.md: Never Write Database Queries Inside `@php` Blocks
- rendering-performance/05-rules.md: Pre-Compute Formatted Values in View Models
- rendering-performance/05-rules.md: Cache Rendered Partials for Expensive, Rarely-Changing Sections
- rendering-performance/05-rules.md: Pre-Compile All Views During Deployment
- rendering-performance/05-rules.md: Profile Before Optimizing Views
- rendering-performance/05-rules.md: Limit View Composition Depth to 3 Levels
### Related Skills (from 06 skills)
- View Models and Presenters: Implement View Models for Complex Template Data
- Component System: Create and Use Blade Components
- Blade Fragments: Implement Blade Fragment Responses for Turbo/HTMX Navigation
- Template Inheritance: Implement Template Inheritance Hierarchy

