# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Ordering and Priority
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Custom middleware position relative to framework middleware is correct (before/after)
- [ ] Exact FQCNs used â€” no aliases or shortened class names
- [ ] Comment explains why the middleware must run at this position
- [ ] In Laravel 11 full override, all default framework middleware is included
- [ ] `prependToPriorityList`/`appendToPriorityList` used in Laravel 12+ instead of full override

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Priority sort algorithm:** Iterate priority array â†’ find matching middleware in merged arra...
- [ ] Architecture guideline: - **Priority chain (default):** HandlePrecognitiveRequests â†’ EncryptCookies â†’ AddQueuedCookie...
- [ ] Architecture guideline: - **Non-priority middleware:** Always runs after all priority middleware. Relative order is deter...
- [ ] Architecture guideline: - **Alias resolution:** Middleware aliases are resolved to FQCN before priority sorting via `Midd...
- [ ] Architecture guideline: - **O(n*m) complexity:** Priority items Ã— middleware items. For 40 priority items and 10 route m...
- [ ] Architecture guideline: - **Laravel 11+ priority API:** `$middleware->priority([...])` (replace), `->prependToPriorityLis...
- [ ] Architecture guideline: - **Laravel 10- priority API:** `protected $middlewarePriority = [...]` array in `Kernel.php`.
- [ ] Decision: Default Priority Chain vs Custom Priority Override - ensure correct choice is made
- [ ] Decision: prependToPriorityList/appendToPriorityList vs Full Priority Array Replacement - ensure correct choice is made
- [ ] Decision: Priority Placement vs Non-Priority Default for Custom Middleware - ensure correct choice is made
- [ ] Decision: Framework Middleware in Priority Chain vs Route-Level Ordering - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Add Custom Middleware to the Priority Array at the Correct Position
- [ ] Skill applied: Review the Priority Array After a Major Laravel Version Upgrade

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
- [ ] Custom middleware position relative to framework middleware is correct (before/after)
- [ ] Exact FQCNs used â€” no aliases or shortened class names
- [ ] Comment explains why the middleware must run at this position
- [ ] In Laravel 11 full override, all default framework middleware is included
- [ ] `prependToPriorityList`/`appendToPriorityList` used in Laravel 12+ instead of full override

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Auth After SubstituteBindings -- apply preferred alternative
    - [ ] `Authenticate` runs before `SubstituteBindings` in priority chain
    - [ ] Route model binding queries can access `Auth::user()`
    - [ ] Scoped bindings (tenant, ownership) work correctly
- [ ] Prevent: Rate Limiting After Auth -- apply preferred alternative
    - [ ] Login endpoint has rate limiting that runs before auth
    - [ ] Password reset endpoint is throttled
    - [ ] Registration endpoint has per-IP rate limiting
- [ ] Prevent: CSRF Before Session -- apply preferred alternative
    - [ ] Session middleware runs before CSRF middleware
    - [ ] All POST forms work (no 419 CSRF mismatch)
    - [ ] CSRF token can be validated against session
- [ ] Prevent: Complete Priority Override Without Framework Middleware -- apply preferred alternative
    - [ ] Full priority override includes all framework middleware
    - [ ] Targeted insertion is preferred over full override
    - [ ] No framework middleware runs at non-priority position unintentionally
- [ ] Prevent: Not Adding Custom Middleware to Priority When Position Matters -- apply preferred alternative
    - [ ] Custom middleware with position requirements is in the priority array
    - [ ] Middleware that must run before auth is placed before auth in priority
    - [ ] Execution order is verified by test

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
- Add Custom Middleware to the Priority Array at the Correct Position
- Review the Priority Array After a Major Laravel Version Upgrade
### Decision Trees (from 07)
- Default Priority Chain vs Custom Priority Override
- prependToPriorityList/appendToPriorityList vs Full Priority Array Replacement
- Priority Placement vs Non-Priority Default for Custom Middleware
- Framework Middleware in Priority Chain vs Route-Level Ordering
### Anti-Patterns (from 08)
- Auth After SubstituteBindings
- Rate Limiting After Auth
- CSRF Before Session
- Complete Priority Override Without Framework Middleware
- Not Adding Custom Middleware to Priority When Position Matters
### Related Rules (from 06 skills)
- Add Custom Middleware to the Priority Array When Position Matters (middleware-ordering-priority:5)
- Do Not Override the Entire Priority Array Without Including All Framework Middleware (middleware-ordering-priority:5)
- Use Exact FQCNs in the Priority Array (middleware-ordering-priority:5)
- Document Why Each Custom Middleware Is Placed at Its Priority Position (middleware-ordering-priority:5)
### Related Skills (from 06 skills)
- Review Priority Array After Laravel Version Upgrade

