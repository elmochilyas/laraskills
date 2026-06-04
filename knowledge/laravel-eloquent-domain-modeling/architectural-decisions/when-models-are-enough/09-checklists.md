# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Architectural Decisions
**Knowledge Unit:** When Models Are Enough
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Performance: - Accessors run on every read â€” cache computed values via `shouldCache` on ...
- [ ] Performance: - Mutators run on every write â€” expensive transformations (hashing, API cal...
- [ ] Performance: - Model methods don't add extra PHP classes to load â€” trivial benefit over ...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Accessors and mutators for computed/transformed values
- [ ] Architecture guideline: - Local scopes for reusable query filters
- [ ] Architecture guideline: - Model methods for state-changing operations
- [ ] Architecture guideline: - Custom casts for value object mapping
- [ ] Architecture guideline: - Let controllers/actions manage the transaction; model methods call `$this->save()` within their...

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Accessors run on every read â€” cache computed values via `shouldCache` on `Attribute::make`
- [ ] - Mutators run on every write â€” expensive transformations (hashing, API calls) should be extracted to actions/jobs
- [ ] - Model methods don't add extra PHP classes to load â€” trivial benefit over actions

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Model methods should not call external services or dispatch jobs (creates hidden side effects)
- [ ] - Never pass raw request data directly to model methods â€” validate first
- [ ] - Mass-assignable attributes should still be guarded; model methods should use explicit assignment

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
- [ ] Prevent: God Model (500+ Line Model Class) -- apply preferred alternative
    - [ ] Model file > 400 lines
    - [ ] Model uses 5+ traits covering unrelated concerns
    - [ ] Methods reference different bounded contexts
- [ ] Prevent: Tight Coupling (Model Calls External Services) -- apply preferred alternative
    - [ ] Model method calls any Facade (`Mail`, `Queue`, `Log`, `Cache`, `Http`)
    - [ ] Model method calls `dispatch()` or `dispatchNow()`
    - [ ] Model method tests require `Mail::fake()` or `Queue::fake()`
- [ ] Prevent: State Leak (Cross-Aggregate Writes in Model) -- apply preferred alternative
    - [ ] Model method writes to a different model's table
    - [ ] Model method calls `save()` or `delete()` on a different model instance
    - [ ] Model method uses `DB::table('other_table')` for writes
- [ ] Prevent: Missing Transaction Safety in Controllers -- apply preferred alternative
    - [ ] Model method calls `$this->save()` and caller does not manage transaction
    - [ ] Controller calls multiple model methods without `DB::transaction()`
    - [ ] Partial commits observed in database after failures
- [ ] Prevent: Anemic Domain Model (No Model Methods) -- apply preferred alternative
    - [ ] Model has no public domain methods â€” only getters/setters
    - [ ] `$model->update(['status' => ...])` appears in multiple controllers/actions
    - [ ] Actions contain business rules about the model's state

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
- God Model (500+ Line Model Class)
- Tight Coupling (Model Calls External Services)
- State Leak (Cross-Aggregate Writes in Model)
- Missing Transaction Safety in Controllers
- Anemic Domain Model (No Model Methods)

