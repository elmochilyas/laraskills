# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Cross-Cutting Concerns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Middleware operates exclusively on `$request`, `$response`, headers, cookies, sessions, or status codes
- [ ] No domain models (Eloquent models, entities) are instantiated or queried in middleware
- [ ] No business rules (eligibility checks, calculations, side effects) exist in middleware
- [ ] If concern was split, middleware does not call the service â€” controller does

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **What belongs in middleware:** Authentication, authorization (role-level), CSRF, rate limiting...
- [ ] Architecture guideline: - **What does NOT belong in middleware:** Business rules, complex data loading, business-side eff...
- [ ] Architecture guideline: - **Split concern pattern:** Middleware handles HTTP aspect. Service handles domain aspect. Middl...
- [ ] Architecture guideline: - **Dedicated middleware per concern:** One class per cross-cutting concern. Named by concern, no...
- [ ] Architecture guideline: - **Concern composition in groups:** Bundle related concerns into named groups for route assignment.
- [ ] Architecture guideline: - **Pull, don't push:** Middleware sets request attributes. Controllers pull what they need.
- [ ] Architecture guideline: - **Middleware bloat prevention:** Every middleware addition requires justification that the conc...
- [ ] Decision: Middleware vs Service/Action for a New Concern - ensure correct choice is made
- [ ] Decision: Single Concern per Middleware vs Grouped Concerns - ensure correct choice is made
- [ ] Decision: Split Concern Pattern (HTTP + Domain) vs All-in-One - ensure correct choice is made
- [ ] Decision: Middleware Registration Tier Selection - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Apply the Cross-Cutting Boundary Test to New Middleware
- [ ] Skill applied: Maintain a Documented Middleware Inventory
- [ ] Skill applied: Audit Security Middleware Coverage Across All Routes

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
- [ ] Middleware operates exclusively on `$request`, `$response`, headers, cookies, sessions, or status codes
- [ ] No domain models (Eloquent models, entities) are instantiated or queried in middleware
- [ ] No business rules (eligibility checks, calculations, side effects) exist in middleware
- [ ] If concern was split, middleware does not call the service â€” controller does

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Middleware as Business Logic Layer -- apply preferred alternative
    - [ ] Middleware does not reference domain models or repositories
    - [ ] Middleware operates only on HTTP primitives (headers, request, status codes)
    - [ ] Business logic is extracted to services/actions
- [ ] Prevent: One Middleware for Multiple Concerns -- apply preferred alternative
    - [ ] Every middleware class handles exactly one concern
    - [ ] Middleware is named by concern, not by usage location
    - [ ] Middleware can be composed selectively in route groups
- [ ] Prevent: Authentication in Controllers -- apply preferred alternative
    - [ ] No `Auth::check()` calls in controller methods
    - [ ] All protected routes have `auth` middleware in route definition
    - [ ] Removing auth middleware causes routes to fail (testable)
- [ ] Prevent: Cross-Cutting Concern Skipped by Route -- apply preferred alternative
    - [ ] All route groups with security requirements have explicit middleware stacks
    - [ ] No route is unintentionally unprotected
    - [ ] Security audit covers all route definitions
- [ ] Prevent: Concern Not Applied to Error Responses -- apply preferred alternative
    - [ ] Security headers are present on all response types (200, 404, 500, 403)
    - [ ] Headers are applied in both middleware and exception handler
    - [ ] Error responses pass the same security header checks as successful responses

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
- Apply the Cross-Cutting Boundary Test to New Middleware
- Maintain a Documented Middleware Inventory
- Audit Security Middleware Coverage Across All Routes
### Decision Trees (from 07)
- Middleware vs Service/Action for a New Concern
- Single Concern per Middleware vs Grouped Concerns
- Split Concern Pattern (HTTP + Domain) vs All-in-One
- Middleware Registration Tier Selection
### Anti-Patterns (from 08)
- Middleware as Business Logic Layer
- One Middleware for Multiple Concerns
- Authentication in Controllers
- Cross-Cutting Concern Skipped by Route
- Concern Not Applied to Error Responses
### Related Rules (from 06 skills)
- Apply the Cross-Cutting Boundary Test Before Writing Middleware (cross-cutting-concerns:5)
- One Middleware Class Per Cross-Cutting Concern (cross-cutting-concerns:5)
- Never Split a Single Concern Across Middleware and Controller Logic (cross-cutting-concerns:5)
### Related Skills (from 06 skills)
- Implement Custom Middleware with Single-Responsibility Pattern
- Maintain Middleware Inventory

