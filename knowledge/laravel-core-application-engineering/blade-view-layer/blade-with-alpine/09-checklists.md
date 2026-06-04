# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Blade / View Layer
**Knowledge Unit:** Blade with Alpine.js
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Keep Alpine State Client-Only, Use Livewire for Server State
- [ ] Enforce: Add `@click.away` to Every Dropdown and Overlay
- [ ] Enforce: Keep Alpine Components Small and Focused
- [ ] Enforce: Use CSP-Compatible Alpine Loading
- [ ] Enforce: Reinitialize Alpine After Turbo Drive Navigation
- [ ] Enforce: Avoid Expensive Operations in `x-init`
- [ ] Enforce: Do Not Replace Blade Logic with Alpine
- [ ] Alpine components initialize correctly on page load
- [ ] `@click.away` is attached to all dropdown/overlay components
- [ ] No expensive API calls or computations block initialization in `x-init`
- [ ] Alpine reinitializes correctly after Turbo Drive navigation (if Turbo is used)
- [ ] Alpine and Livewire (if both used) have clear state boundaries â€” Alpine for client, Livewire for server
- [ ] CSP allows inline event handlers or uses nonce-based loading
- [ ] Server-rendered (Blade) and client-rendered (Alpine) content boundaries are clear
- [ ] `x-for` lists with 1000+ items are paginated or use Livewire instead

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Alpine vs Livewire
- [ ] Architecture guideline: ### Alpine vs Full JS Framework (React/Vue)
- [ ] Architecture guideline: ### Loading Alpine
- [ ] Architecture guideline: {{-- CDN with defer --}}
- [ ] Architecture guideline: <script defer src="https://cdn.jsdelivr.net/npm/alpinejs@3.x.x/dist/cdn.min.js"></script>
- [ ] Architecture guideline: {{-- With plugins --}}
- [ ] Architecture guideline: <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/mask@3.x.x/dist/cdn.min.js"></script>
- [ ] Architecture guideline: <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/focus@3.x.x/dist/cdn.min.js"></script>
- [ ] Architecture guideline: <script defer src="https://cdn.jsdelivr.net/npm/@alpinejs/collapse@3.x.x/dist/cdn.min.js"></script>
- [ ] Decision: Alpine.js vs Livewire for Client Interactivity - ensure correct choice is made
- [ ] Decision: Alpine.js vs Full JS Framework (React/Vue/Inertia) - ensure correct choice is made
- [ ] Decision: Alpine Component Scope â€” Single Large vs Multiple Small Components - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Keep Alpine State Client-Only, Use Livewire for Server State
- [ ] Apply rule: Add `@click.away` to Every Dropdown and Overlay
- [ ] Apply rule: Keep Alpine Components Small and Focused
- [ ] Apply rule: Use CSP-Compatible Alpine Loading
- [ ] Apply rule: Reinitialize Alpine After Turbo Drive Navigation
- [ ] Apply rule: Avoid Expensive Operations in `x-init`
- [ ] Apply rule: Do Not Replace Blade Logic with Alpine
- [ ] Skill applied: Integrate Alpine.js with Blade Templates for Client-Side Interactivity

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
- [ ] Alpine components initialize correctly on page load
- [ ] `@click.away` is attached to all dropdown/overlay components
- [ ] No expensive API calls or computations block initialization in `x-init`
- [ ] Alpine reinitializes correctly after Turbo Drive navigation (if Turbo is used)
- [ ] Alpine and Livewire (if both used) have clear state boundaries â€” Alpine for client, Livewire for server
- [ ] CSP allows inline event handlers or uses nonce-based loading
- [ ] Server-rendered (Blade) and client-rendered (Alpine) content boundaries are clear

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Alpine for Server-Bound State -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Missing `@click.away` on Overlays and Dropdowns -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Alpine Replacing Blade Template Logic -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Giant `x-data` Objects -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Alpine Not Reinitialized After Turbo Drive Navigation -- apply preferred alternative
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
- Keep Alpine State Client-Only, Use Livewire for Server State
- Add `@click.away` to Every Dropdown and Overlay
- Keep Alpine Components Small and Focused
- Use CSP-Compatible Alpine Loading
- Reinitialize Alpine After Turbo Drive Navigation
- Avoid Expensive Operations in `x-init`
- Do Not Replace Blade Logic with Alpine
### Skills (from 06)
- Integrate Alpine.js with Blade Templates for Client-Side Interactivity
### Decision Trees (from 07)
- Alpine.js vs Livewire for Client Interactivity
- Alpine.js vs Full JS Framework (React/Vue/Inertia)
- Alpine Component Scope â€” Single Large vs Multiple Small Components
### Anti-Patterns (from 08)
- Alpine for Server-Bound State
- Missing `@click.away` on Overlays and Dropdowns
- Alpine Replacing Blade Template Logic
- Giant `x-data` Objects
- Alpine Not Reinitialized After Turbo Drive Navigation
### Related Rules (from 06 skills)
- blade-with-alpine/05-rules.md: Keep Alpine State Client-Only, Use Livewire for Server State
- blade-with-alpine/05-rules.md: Add `@click.away` to Every Dropdown and Overlay
- blade-with-alpine/05-rules.md: Keep Alpine Components Small and Focused
- blade-with-alpine/05-rules.md: Use CSP-Compatible Alpine Loading
- blade-with-alpine/05-rules.md: Reinitialize Alpine After Turbo Drive Navigation
- blade-with-alpine/05-rules.md: Avoid Expensive Operations in `x-init`
- blade-with-alpine/05-rules.md: Do Not Replace Blade Logic with Alpine
### Related Skills (from 06 skills)
- Component System: Create and Use Blade Components
- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Service Injection: Use @inject for Non-Entity Read-Only Services
- Layout Strategies: Implement Multi-Layout Strategy

