# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Query Strategy
**Knowledge Unit:** Global Scope Suppression
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] All suppression calls specify which scope(s) to suppress, not blanket `withoutGlobalScopes()`
- [ ] Suppression gated behind permission checks for security scopes
- [ ] Suppression reason documented in code comments
- [ ] Suppressed queries tested for correct expanded results
- [ ] No suppressed builder instances stored and reused across requests
- [ ] Audit trail captures suppression events
- [ ] Relationship builder suppression handled independently of parent builder

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Encapsulate scope suppression in query objects or repository methods, not inline in controllers
- [ ] Architecture guideline: - Create named methods for common suppression patterns: `$query->includeSoftDeletes()`
- [ ] Architecture guideline: - Never suppress scopes in base repository methods â€” suppress in specific query methods only
- [ ] Architecture guideline: - Review all suppression calls in code review â€” they are high-risk operations
- [ ] Architecture guideline: - Use `withoutGlobalScopes(['scope1', 'scope2'])` (array) over the variadic form for clarity
- [ ] Decision: Suppression Necessity and Method - ensure correct choice is made
- [ ] Decision: Scope Suppression Security Gating - ensure correct choice is made
- [ ] Decision: Suppression Encapsulation - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Suppress Global Scopes Safely with Permission Gating

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
- [ ] All suppression calls specify which scope(s) to suppress, not blanket `withoutGlobalScopes()`
- [ ] Suppression gated behind permission checks for security scopes
- [ ] Suppression reason documented in code comments
- [ ] Suppressed queries tested for correct expanded results
- [ ] No suppressed builder instances stored and reused across requests
- [ ] Audit trail captures suppression events
- [ ] Relationship builder suppression handled independently of parent builder

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Suppress Global Scopes Safely with Permission Gating
### Decision Trees (from 07)
- Suppression Necessity and Method
- Scope Suppression Security Gating
- Suppression Encapsulation
### Related Rules (from 06 skills)
- Always Use withoutGlobalScope(Specific::class) Instead of withoutGlobalScopes() (query-strategy/global-scope-suppression)
- Gate Scope Suppression Behind Permission Checks (query-strategy/global-scope-suppression)
- Prefer withTrashed() over withoutGlobalScope(SoftDeletingScope::class) (query-strategy/global-scope-suppression)
- Encapsulate Suppression in Named Query Methods (query-strategy/global-scope-suppression)
- Document Why Each Suppression Is Needed (query-strategy/global-scope-suppression)
- Log All Scope Suppression Events for Audit Trails (query-strategy/global-scope-suppression)
- Never Suppress Scopes on Stored or Reused Builder Instances (query-strategy/global-scope-suppression)
### Related Skills (from 06 skills)
- Implement Global Scopes for Cross-Cutting Concerns
- Implement toBase Pattern for Hydration Bypass
- Choose Between Eloquent and Query Builder

