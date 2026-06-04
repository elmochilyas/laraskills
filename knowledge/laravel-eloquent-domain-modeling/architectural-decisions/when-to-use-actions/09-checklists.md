# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** When to Use Actions
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Action classes add negligible overhead â€” plain PHP objects resolved once ...
- [ ] Performance: - Chained model calls can cause N+1 queries if lazy-loading is triggered; eag...
- [ ] Performance: - `DB::transaction()` wrapping is safe for moderate operations; very long-run...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place actions in `App\Actions\{Domain}\{UseCase}Action.php`
- [ ] Architecture guideline: - Actions receive validated data (DTO or model), never raw request input
- [ ] Architecture guideline: - Actions do not extend a base class unless necessary
- [ ] Architecture guideline: - Wrap cross-aggregate operations in `DB::transaction()`
- [ ] Architecture guideline: - Queue slow actions instead of running synchronously

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Action classes add negligible overhead â€” plain PHP objects resolved once from the container
- [ ] - Chained model calls can cause N+1 queries if lazy-loading is triggered; eager-load before entering the action
- [ ] - `DB::transaction()` wrapping is safe for moderate operations; very long-running actions should chunk or queue

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Authorization gates should be checked inside the action or as middleware before the action
- [ ] - Actions should never receive raw request input â€” always validate with FormRequest first
- [ ] - Log action entry/exit with correlation IDs for audit trail

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

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Anemic Action (All Logic in Action, Models Empty) -- apply preferred alternative
    - [ ] Action contains `if` statements about model state (invariants)
    - [ ] Action sets model attributes directly instead of calling methods
    - [ ] Same business rule appears in multiple action files
- [ ] Prevent: Orchestration Sprawl (Action Exceeds 200 Lines) -- apply preferred alternative
    - [ ] Action file > 150 lines
    - [ ] Action has 3+ distinct responsibilities
    - [ ] Action tests have long setup sections
- [ ] Prevent: Action-as-Controller (HTTP Concerns in Actions) -- apply preferred alternative
    - [ ] Action imports `Illuminate\Http\*`
    - [ ] Action returns `RedirectResponse` or `JsonResponse`
    - [ ] Action test requires `$this->post()` or `$this->get()`
- [ ] Prevent: Actions for Simple CRUD (Over-Engineering) -- apply preferred alternative
    - [ ] Action is under 10 lines with a single `update()` or `save()`
    - [ ] Action touches only one model
    - [ ] Action has no transaction, no events, no dispatching
- [ ] Prevent: Missing Transaction Scope in Actions -- apply preferred alternative
    - [ ] Action modifies 2+ models without `DB::transaction()`
    - [ ] Action dispatches events without `DB::afterCommit()`
    - [ ] Action fails mid-way and leaves partial writes

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
### Anti-Patterns (from 08)
- Anemic Action (All Logic in Action, Models Empty)
- Orchestration Sprawl (Action Exceeds 200 Lines)
- Action-as-Controller (HTTP Concerns in Actions)
- Actions for Simple CRUD (Over-Engineering)
- Missing Transaction Scope in Actions

