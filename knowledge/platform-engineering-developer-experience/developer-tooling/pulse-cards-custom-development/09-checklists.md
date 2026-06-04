# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** pulse-cards-custom-development
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Recorder captures metrics via `Pulse::record()`
- [ ] Card component retrieves values via `Pulse::values()`
- [ ] Card renders correctly on the Pulse dashboard
- [ ] Live updates via SSE work correctly
- [ ] Card width and position match configuration
- [ ] Performance acceptable (< 1000 records/second without batching)
- [ ] Performance: - Each `Pulse::record()` call: <0.5ms; batch for high-frequency metrics
- [ ] Performance: - Card render: <5ms per query on aggregated data
- [ ] Performance: - Dashboard render: <1s with 10+ cards; optimize slow cards

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Register in `config/pulse.php` under `cards` array
- [ ] Architecture guideline: - Use Livewire polling (configurable interval) for real-time updates
- [ ] Architecture guideline: - Cards should query aggregated data (binned) not raw entries
- [ ] Architecture guideline: - Wrap card rendering in try-catch so errors don't break entire dashboard
- [ ] Architecture guideline: - Use CSS Grid for responsive card layout
- [ ] Decision: When to Build Custom Pulse Cards? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Develop Custom Pulse Cards

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Each `Pulse::record()` call: <0.5ms; batch for high-frequency metrics
- [ ] - Card render: <5ms per query on aggregated data
- [ ] - Dashboard render: <1s with 10+ cards; optimize slow cards
- [ ] - Storage growth proportional to metric recording frequency

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Custom cards may expose sensitive business metrics (revenue, user counts)
- [ ] - Use Pulse's authorization gate to restrict card access
- [ ] - Cards should handle missing data gracefully

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
- [ ] Recorder captures metrics via `Pulse::record()`
- [ ] Card component retrieves values via `Pulse::values()`
- [ ] Card renders correctly on the Pulse dashboard
- [ ] Live updates via SSE work correctly
- [ ] Card width and position match configuration
- [ ] Performance acceptable (< 1000 records/second without batching)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Custom card as mini-application -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Recording from multiple sources without coordination -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern

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
- Develop Custom Pulse Cards
### Decision Trees (from 07)
- When to Build Custom Pulse Cards?
### Anti-Patterns (from 08)
- Custom card as mini-application
- Recording from multiple sources without coordination
### Related Rules (from 06 skills)
- PULSECARD-RULE-001: Extend Pulse\Card
- PULSECARD-RULE-002: Register in pulse.php
- PULSECARD-RULE-003: Use Pulse::record()
- PULSECARD-RULE-004: Use Pulse::values()
- PULSECARD-RULE-006: Dashboard width
### Related Skills (from 06 skills)
- Configure Laravel Pulse for Monitoring
- Configure Laravel Telescope for Debugging
- Integrate Laravel Nightwatch for Production APM

