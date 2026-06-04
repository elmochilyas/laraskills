# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Stack Selection Guide
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Match Stack to Team Skills
- [ ] Enforce: Choose Livewire for CRUD and Admin
- [ ] Enforce: Choose Inertia for Complex Client UIs
- [ ] Enforce: Never Mix Stacks on the Same Page
- [ ] Enforce: Consider SSR Before Choosing Inertia
- [ ] Enforce: Evaluate Real-Time Requirements
- [ ] Stack selection documented with rationale referencing team skills and application requirements
- [ ] Team is capable of maintaining the chosen stack (training budgeted if needed)
- [ ] SSR strategy decided for Inertia (Node.js server budgeted and deployed)
- [ ] Real-time requirements evaluated against built-in capabilities vs WebSocket integration
- [ ] Bundle size implications understood and acceptable
- [ ] Mobile/future API needs considered in the decision
- [ ] Not planning to mix stacks on the same page

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Routes are server-defined in both stacks â€” Inertia doesn't expose a public API
- [ ] Architecture guideline: - Both stacks share the same Laravel middleware, auth, session, and CSRF protection
- [ ] Architecture guideline: - Livewire components live in `app/Livewire/` with Blade templates in `resources/views/livewire/`
- [ ] Architecture guideline: - Inertia page components live in `resources/js/Pages/` with controllers returning `Inertia::rend...
- [ ] Architecture guideline: - The decision can be made per-route prefix (hybrid approach) but not per-page
- [ ] Decision: Livewire vs Inertia for Frontend Stack Selection - ensure correct choice is made
- [ ] Decision: Team Skill-Based vs Feature-Based Stack Selection - ensure correct choice is made
- [ ] Decision: Incremental Adoption vs Full Commitment to Stack - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Match Stack to Team Skills
- [ ] Apply rule: Choose Livewire for CRUD and Admin
- [ ] Apply rule: Choose Inertia for Complex Client UIs
- [ ] Apply rule: Never Mix Stacks on the Same Page
- [ ] Apply rule: Consider SSR Before Choosing Inertia
- [ ] Apply rule: Evaluate Real-Time Requirements
- [ ] Skill applied: Evaluate and Select Frontend Stack

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
- [ ] Stack selection documented with rationale referencing team skills and application requirements
- [ ] Team is capable of maintaining the chosen stack (training budgeted if needed)
- [ ] SSR strategy decided for Inertia (Node.js server budgeted and deployed)
- [ ] Real-time requirements evaluated against built-in capabilities vs WebSocket integration
- [ ] Bundle size implications understood and acceptable
- [ ] Mobile/future API needs considered in the decision
- [ ] Not planning to mix stacks on the same page

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Choosing a Stack Based on Familiarity Without Considering Requirements -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Switching Stacks Mid-Project -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Choosing Livewire for a Public-Facing SPA With Complex Client Interactions -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Choosing Inertia for a Server-Driven Admin Panel With Simple CRUD -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Not Planning for SEO Before Stack Selection -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Stack Selection Based on "What's New" Rather Than Stability -- apply preferred alternative
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
- Match Stack to Team Skills
- Choose Livewire for CRUD and Admin
- Choose Inertia for Complex Client UIs
- Never Mix Stacks on the Same Page
- Consider SSR Before Choosing Inertia
- Evaluate Real-Time Requirements
### Skills (from 06)
- Evaluate and Select Frontend Stack
### Decision Trees (from 07)
- Livewire vs Inertia for Frontend Stack Selection
- Team Skill-Based vs Feature-Based Stack Selection
- Incremental Adoption vs Full Commitment to Stack
### Anti-Patterns (from 08)
- Choosing a Stack Based on Familiarity Without Considering Requirements
- Switching Stacks Mid-Project
- Choosing Livewire for a Public-Facing SPA With Complex Client Interactions
- Choosing Inertia for a Server-Driven Admin Panel With Simple CRUD
- Not Planning for SEO Before Stack Selection
- Stack Selection Based on "What's New" Rather Than Stability
### Related Rules (from 06 skills)
- Match Stack to Team Skills (05-rules.md)
- Choose Livewire for CRUD and Admin (05-rules.md)
- Choose Inertia for Complex Client UIs (05-rules.md)
- Never Mix Stacks on the Same Page (05-rules.md)
- Consider SSR Before Choosing Inertia (05-rules.md)
- Evaluate Real-Time Requirements (05-rules.md)
### Related Skills (from 06 skills)
- Implement Route-Level Stack Segregation (hybrid-approaches)
- Configure and Deploy Inertia SSR (inertia/ssr-configuration)
- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Create an Inertia Page Component with Typed Props (inertia/page-components)

