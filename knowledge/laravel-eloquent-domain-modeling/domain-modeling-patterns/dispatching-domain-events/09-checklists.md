# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Domain Modeling Patterns
**Knowledge Unit:** Dispatching Domain Events
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Dispatch Domain Events Only After the Database Transaction Commits
- [ ] Enforce: Carry Identity and Value Objects, Not Model Instances
- [ ] Enforce: Use the Recorded Events Pattern for Complex Operations
- [ ] Enforce: Name Domain Events in Past Tense
- [ ] Enforce: Register All Domain Event Listeners in EventServiceProvider
- [ ] Enforce: Use ShouldQueue for Non-Critical Side Effects
- [ ] Enforce: Include Correlation IDs in Every Domain Event
- [ ] Performance: - Synchronous listeners add time to the request
- [ ] Performance: - Queue domain events for operations that don't need immediate reaction
- [ ] Performance: - Serialization of events (for queuing) should avoid large payloads

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Event classes in `App\Events\Domain\*`
- [ ] Architecture guideline: - Listeners in `App\Listeners\Domain\*`
- [ ] Architecture guideline: - Register listeners in `EventServiceProvider`
- [ ] Architecture guideline: - Use `ShouldQueue` for non-critical side effects (notifications, projections)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Dispatch Domain Events Only After the Database Transaction Commits
- [ ] Apply rule: Carry Identity and Value Objects, Not Model Instances
- [ ] Apply rule: Use the Recorded Events Pattern for Complex Operations
- [ ] Apply rule: Name Domain Events in Past Tense
- [ ] Apply rule: Register All Domain Event Listeners in EventServiceProvider
- [ ] Apply rule: Use ShouldQueue for Non-Critical Side Effects
- [ ] Apply rule: Include Correlation IDs in Every Domain Event

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Synchronous listeners add time to the request
- [ ] - Queue domain events for operations that don't need immediate reaction
- [ ] - Serialization of events (for queuing) should avoid large payloads

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Events may contain sensitive data â€” ensure payload doesn't leak PII to logs or queues
- [ ] - Authorization is the sender's responsibility, not the event's

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
### Rules (from 05)
- Dispatch Domain Events Only After the Database Transaction Commits
- Carry Identity and Value Objects, Not Model Instances
- Use the Recorded Events Pattern for Complex Operations
- Name Domain Events in Past Tense
- Register All Domain Event Listeners in EventServiceProvider
- Use ShouldQueue for Non-Critical Side Effects
- Include Correlation IDs in Every Domain Event

