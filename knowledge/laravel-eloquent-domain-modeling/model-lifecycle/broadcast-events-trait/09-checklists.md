# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Model Lifecycle
**Knowledge Unit:** Model Broadcasting
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `BroadcastsEventsAfterCommit` used, not `BroadcastsEvents`
- [ ] `broadcastWith()` overridden to filter sensitive data
- [ ] Broadcast channels use appropriate privacy (private for user-specific, public for general)
- [ ] `broadcastAs()` provides semantic event names for frontend
- [ ] No eager-loaded relations included in broadcast payload without explicit allow-listing
- [ ] Broadcast trait is listed after domain traits in the `use` statement
- [ ] Broadcast payload tests are written
- [ ] Performance: - Broadcasting adds network round-trips â€” batch broadcasts for bulk operations
- [ ] Performance: - Use `BroadcastsEventsAfterCommit` to avoid broadcasting rolled-back data
- [ ] Performance: - Consider rate-limiting broadcasts for high-frequency updates

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Add `BroadcastsEventsAfterCommit` trait to models that need real-time updates
- [ ] Architecture guideline: - Override `broadcastWith()` to filter serialized attributes
- [ ] Architecture guideline: - Configure WebSockets integration (Laravel Reverb, Pusher) separately

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Model Broadcasting with BroadcastsEventsAfterCommit

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Broadcasting adds network round-trips â€” batch broadcasts for bulk operations
- [ ] - Use `BroadcastsEventsAfterCommit` to avoid broadcasting rolled-back data
- [ ] - Consider rate-limiting broadcasts for high-frequency updates

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - `broadcastWith()` controls what data reaches clients â€” always override to exclude sensitive data
- [ ] - Broadcast authentication uses Laravel's broadcasting auth routes â€” configure appropriately
- [ ] - Model broadcasts are public by default â€” use private channels for sensitive models

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
- [ ] `BroadcastsEventsAfterCommit` used, not `BroadcastsEvents`
- [ ] `broadcastWith()` overridden to filter sensitive data
- [ ] Broadcast channels use appropriate privacy (private for user-specific, public for general)
- [ ] `broadcastAs()` provides semantic event names for frontend
- [ ] No eager-loaded relations included in broadcast payload without explicit allow-listing
- [ ] Broadcast trait is listed after domain traits in the `use` statement
- [ ] Broadcast payload tests are written

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
- Set Up Model Broadcasting with BroadcastsEventsAfterCommit
### Related Rules (from 06 skills)
- Rule 1: Always Prefer `BroadcastsEventsAfterCommit` Over `BroadcastsEvents`
- Rule 2: Always Override `broadcastWith()` to Filter Sensitive Data
- Rule 3: Use Private Channels for Sensitive Models
- Rule 4: Override `broadcastAs()` for Semantic Event Names
- Rule 9: Place `BroadcastsEventsAfterCommit` After Other Traits
### Related Skills (from 06 skills)
- Commit Strategies for Transactional Safety
- Event Control / Quiet Operations for Suppression
- Observer Pattern for Lifecycle Hooks

