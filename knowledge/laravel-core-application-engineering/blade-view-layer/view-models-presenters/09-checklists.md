# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** View Models and Presenters
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Never Include Business Logic in View Models
- [ ] Enforce: Only Create View Models When Templates Exceed a Complexity Threshold
- [ ] Enforce: Test View Models in Isolation Without Views or HTTP
- [ ] Enforce: Use Readonly Properties for Eager-Computed Values
- [ ] Enforce: Keep Constructor Parameters Focused â€” Maximum 3
- [ ] Enforce: Do Not Use View Models for API Responses
- [ ] Enforce: Prevent Orphaned View Models
- [ ] View model contains only presentation logic (formatting, computed values, null handling)
- [ ] No write/mutation methods exist in view model
- [ ] View model is unit-testable without views or HTTP
- [ ] Constructor parameters are typed, specific, and 3 or fewer
- [ ] View model passes data to template via clean method/property calls
- [ ] No business logic (queries, calculations, state changes) in view model
- [ ] View model is not used for API responses or DTO purposes
- [ ] Orphaned view models are detected and removed regularly

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Directory Organization
- [ ] Architecture guideline: â”œâ”€â”€ Orders/
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ OrderShowViewModel.php
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ OrderListItemViewModel.php
- [ ] Architecture guideline: â”‚   â””â”€â”€ OrderFormViewModel.php
- [ ] Architecture guideline: â”œâ”€â”€ Users/
- [ ] Architecture guideline: â”‚   â”œâ”€â”€ UserProfileViewModel.php
- [ ] Architecture guideline: â”‚   â””â”€â”€ UserSettingsViewModel.php
- [ ] Architecture guideline: â””â”€â”€ Dashboard/
- [ ] Architecture guideline: â””â”€â”€ DashboardViewModel.php
- [ ] Architecture guideline: ### View Model vs View Composer
- [ ] Architecture guideline: ### View Model vs Presenter Pattern

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Never Include Business Logic in View Models
- [ ] Apply rule: Only Create View Models When Templates Exceed a Complexity Threshold
- [ ] Apply rule: Test View Models in Isolation Without Views or HTTP
- [ ] Apply rule: Use Readonly Properties for Eager-Computed Values
- [ ] Apply rule: Keep Constructor Parameters Focused â€” Maximum 3
- [ ] Apply rule: Do Not Use View Models for API Responses
- [ ] Apply rule: Prevent Orphaned View Models
- [ ] Skill applied: Implement View Models for Complex Template Data

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
- [ ] View model contains only presentation logic (formatting, computed values, null handling)
- [ ] No write/mutation methods exist in view model
- [ ] View model is unit-testable without views or HTTP
- [ ] Constructor parameters are typed, specific, and 3 or fewer
- [ ] View model passes data to template via clean method/property calls
- [ ] No business logic (queries, calculations, state changes) in view model
- [ ] View model is not used for API responses or DTO purposes

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Business Logic in View Models -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: View Model for Every View -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Leaking View Models to API Responses -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Constructor Explosion (4+ Parameters) -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Mutable View Models (No Readonly) -- apply preferred alternative
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
- Never Include Business Logic in View Models
- Only Create View Models When Templates Exceed a Complexity Threshold
- Test View Models in Isolation Without Views or HTTP
- Use Readonly Properties for Eager-Computed Values
- Keep Constructor Parameters Focused â€” Maximum 3
- Do Not Use View Models for API Responses
- Prevent Orphaned View Models
### Skills (from 06)
- Implement View Models for Complex Template Data
### Decision Trees (from 07)
- View Model vs Template Inline Formatting
- View Model vs API Resource
- Eager vs Lazy Computation in View Models
### Anti-Patterns (from 08)
- Business Logic in View Models
- View Model for Every View
- Leaking View Models to API Responses
- Constructor Explosion (4+ Parameters)
- Mutable View Models (No Readonly)
### Related Rules (from 06 skills)
- view-models-presenters/05-rules.md: Never Include Business Logic in View Models
- view-models-presenters/05-rules.md: Only Create View Models When Templates Exceed a Complexity Threshold
- view-models-presenters/05-rules.md: Test View Models in Isolation Without Views or HTTP
- view-models-presenters/05-rules.md: Use Readonly Properties for Eager-Computed Values
- view-models-presenters/05-rules.md: Keep Constructor Parameters Focused â€” Maximum 3
- view-models-presenters/05-rules.md: Do Not Use View Models for API Responses
- view-models-presenters/05-rules.md: Prevent Orphaned View Models
### Related Skills (from 06 skills)
- Rendering Performance: Profile and Optimize Slow View Rendering
- Component System: Create and Use Blade Components
- View Composers and Creators: Implement View Composers for Shared Data
- Blade Testing: Write Assertions for Blade View Rendering

