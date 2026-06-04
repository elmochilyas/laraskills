# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** Action Class Patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Action class resolution is negligible â€” one PHP object per request
- [ ] Performance: - Queued actions must serialize minimal data (model keys, DTO), not full mode...
- [ ] Performance: - Transaction time: Keep DB work short; move I/O outside the transaction

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Place actions in `App\Actions\{Domain}\{Verb}{Entity}Action.php`
- [ ] Architecture guideline: - Name actions by what they do: `PayInvoiceAction`, `CancelSubscriptionAction`
- [ ] Architecture guideline: - Actions should not extend a base class unless necessary (framework-agnostic)
- [ ] Architecture guideline: - Sub-action composition is valid: `PlaceOrderAction` calls `GenerateShipmentAction`
- [ ] Architecture guideline: - For queued actions, serialize only model keys â€” re-fetch in `handle()`
- [ ] Decision: Action Class vs Model Method vs Inline Controller Logic - ensure correct choice is made
- [ ] Decision: Sync Action vs Queued Action - ensure correct choice is made
- [ ] Decision: Single Action vs Sub-Action Composition - ensure correct choice is made
- [ ] Decision: Constructor Injection vs Container Resolution Inside Method - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Action class resolution is negligible â€” one PHP object per request
- [ ] - Queued actions must serialize minimal data (model keys, DTO), not full model instances
- [ ] - Transaction time: Keep DB work short; move I/O outside the transaction

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Authorization checks should happen at the action boundary, not inside model methods
- [ ] - Never pass raw request input to actions â€” validate with FormRequest first
- [ ] - Log action entry/exit with correlation IDs for audit trails

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
- [ ] Prevent: God Action -- apply preferred alternative
    - [ ] Action has a mode/type parameter used for branching
    - [ ] Action exceeds 100 lines
    - [ ] Action tests use `describe` or comments to label different scenarios
- [ ] Prevent: Action-as-Controller -- apply preferred alternative
    - [ ] Action returns `RedirectResponse`, `Response`, or `JsonResponse`
    - [ ] Action imports from `Illuminate\Http`
    - [ ] Action has `Request` as a typed parameter
- [ ] Prevent: Container Resolution in Method Body -- apply preferred alternative
    - [ ] `app(`, `resolve(`, or `make(` appears in the method body
    - [ ] Action has fewer constructor parameters than services used
    - [ ] Tests use `$this->instance()` or `$this->swap()` for the action under test
- [ ] Prevent: Pre-emptive Action Proliferation -- apply preferred alternative
    - [ ] Action is under 20 lines with a single `update()` or `save()` call
    - [ ] Action has 0-1 constructor dependencies
    - [ ] Action is invoked from exactly one controller method
- [ ] Prevent: Transaction Boundary Neglect -- apply preferred alternative
    - [ ] Action modifies 2+ models or dispatches events
    - [ ] No `DB::transaction()` call exists in the method
    - [ ] `event()` is called directly without `DB::afterCommit()`

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
### Decision Trees (from 07)
- Action Class vs Model Method vs Inline Controller Logic
- Sync Action vs Queued Action
- Single Action vs Sub-Action Composition
- Constructor Injection vs Container Resolution Inside Method
### Anti-Patterns (from 08)
- God Action
- Action-as-Controller
- Container Resolution in Method Body
- Pre-emptive Action Proliferation
- Transaction Boundary Neglect

