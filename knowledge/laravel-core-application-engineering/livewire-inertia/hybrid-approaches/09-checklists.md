# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Hybrid Approaches
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Route-Level Stack Segregation
- [ ] Enforce: Separate Layouts Per Stack
- [ ] Enforce: Shared Laravel Infrastructure
- [ ] Enforce: Exclusive Asset Loading Per Stack
- [ ] Enforce: Documented Stack Boundary
- [ ] Enforce: No Duplicated Business Logic
- [ ] No route appears in both Livewire and Inertia route files
- [ ] Livewire routes load only Livewire assets (not JS framework bundle)
- [ ] Inertia routes load only Inertia assets (not Livewire JS)
- [ ] Both stacks share the same middleware pipeline for auth, CSRF, session
- [ ] No Blade template mixes `@inertia` and `<livewire:component>`
- [ ] Shared business logic resides in service classes, not duplicated in components/controllers
- [ ] Route-to-stack mapping is documented and accessible to all developers

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Route files separate: `routes/livewire.php`, `routes/inertia.php`
- [ ] Architecture guideline: - Both files included in a shared middleware group for auth/session consistency
- [ ] Architecture guideline: - Each stack needs its own layout file (Blade layout for Livewire, JS layout for Inertia)
- [ ] Architecture guideline: - Shared components (nav, footer) can be duplicated per layout or rendered via Blade includes in ...
- [ ] Architecture guideline: - API routes are shared â€” both stacks can call the same API endpoints
- [ ] Architecture guideline: - Database, models, services, and middleware are shared â€” only the frontend rendering differs
- [ ] Decision: Single Stack vs Hybrid Livewire + Inertia - ensure correct choice is made
- [ ] Decision: Route-Level Segregation vs Page-Level Segregation - ensure correct choice is made
- [ ] Decision: Gradual Migration vs Big Bang Stack Switch - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Route-Level Stack Segregation
- [ ] Apply rule: Separate Layouts Per Stack
- [ ] Apply rule: Shared Laravel Infrastructure
- [ ] Apply rule: Exclusive Asset Loading Per Stack
- [ ] Apply rule: Documented Stack Boundary
- [ ] Apply rule: No Duplicated Business Logic
- [ ] Skill applied: Implement Route-Level Stack Segregation

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
- [ ] No route appears in both Livewire and Inertia route files
- [ ] Livewire routes load only Livewire assets (not JS framework bundle)
- [ ] Inertia routes load only Inertia assets (not Livewire JS)
- [ ] Both stacks share the same middleware pipeline for auth, CSRF, session
- [ ] No Blade template mixes `@inertia` and `<livewire:component>`
- [ ] Shared business logic resides in service classes, not duplicated in components/controllers
- [ ] Route-to-stack mapping is documented and accessible to all developers

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mixing Livewire and Inertia on the Same Route -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Inconsistent Validation UX Across Stacks -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Duplicate Business Logic Across Stacks -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Over-Engineering the Stack Decision Early -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Hybrid Pages Without Clear Data Flow -- apply preferred alternative
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
- Route-Level Stack Segregation
- Separate Layouts Per Stack
- Shared Laravel Infrastructure
- Exclusive Asset Loading Per Stack
- Documented Stack Boundary
- No Duplicated Business Logic
### Skills (from 06)
- Implement Route-Level Stack Segregation
### Decision Trees (from 07)
- Single Stack vs Hybrid Livewire + Inertia
- Route-Level Segregation vs Page-Level Segregation
- Gradual Migration vs Big Bang Stack Switch
### Anti-Patterns (from 08)
- Mixing Livewire and Inertia on the Same Route
- Inconsistent Validation UX Across Stacks
- Duplicate Business Logic Across Stacks
- Over-Engineering the Stack Decision Early
- Hybrid Pages Without Clear Data Flow
### Related Rules (from 06 skills)
- Route-Level Stack Segregation (05-rules.md)
- Separate Layouts Per Stack (05-rules.md)
- Shared Laravel Infrastructure (05-rules.md)
- Exclusive Asset Loading Per Stack (05-rules.md)
- Documented Stack Boundary (05-rules.md)
- No Duplicated Business Logic (05-rules.md)
### Related Skills (from 06 skills)
- Evaluate and Select Frontend Stack (stack-selection-guide)
- Create an Inertia Page Component with Typed Props (inertia/page-components)
- Create a Well-Structured Livewire Component (livewire/component-architecture)

