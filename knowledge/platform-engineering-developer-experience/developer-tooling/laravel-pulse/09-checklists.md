# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** laravel-pulse
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Pulse installed and migrated
- [ ] `/pulse` route accessible only by authorized users
- [ ] `pulse:check` scheduler command active
- [ ] Built-in cards show live data (servers, queries, queues, exceptions)
- [ ] SQL storage configured for persistence
- [ ] Raw retention set to 1 hour default
- [ ] Performance: - Collection overhead: <1ms per request (single row write per event)
- [ ] Performance: - Database: 100 req/s = ~6000 entries/min; aggregation prunes efficiently
- [ ] Performance: - Dashboard queries: <10ms on aggregate tables

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Secure with authorization gate â€” route `pulse.*` should require authentication
- [ ] Architecture guideline: - Configure `config/pulse.php` for card layout, storage driver, retention
- [ ] Architecture guideline: - Use separate Pulse database for high-traffic apps to isolate monitoring from application data
- [ ] Architecture guideline: - Add custom cards in `config/pulse.php` `cards` array with display order
- [ ] Decision: Pulse vs Dedicated APM? - ensure correct choice is made
- [ ] Decision: Which Built-in Cards to Enable? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Laravel Pulse for Production Monitoring

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Collection overhead: <1ms per request (single row write per event)
- [ ] - Database: 100 req/s = ~6000 entries/min; aggregation prunes efficiently
- [ ] - Dashboard queries: <10ms on aggregate tables
- [ ] - SSE per dashboard tab: negligible overhead
- [ ] - Data store size: 50-200MB typical for busy app with 1-hour raw retention

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Pulse stores route names (may contain identifiers), query texts (may contain data)
- [ ] - Secure `/pulse` with authentication â€” application performance data is sensitive
- [ ] - Use gate-based authorization to restrict access

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
- [ ] Pulse installed and migrated
- [ ] `/pulse` route accessible only by authorized users
- [ ] `pulse:check` scheduler command active
- [ ] Built-in cards show live data (servers, queries, queues, exceptions)
- [ ] SQL storage configured for persistence
- [ ] Raw retention set to 1 hour default

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Using Pulse for debugging -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Pulse without scheduler -- apply preferred alternative
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
- Configure Laravel Pulse for Production Monitoring
### Decision Trees (from 07)
- Pulse vs Dedicated APM?
- Which Built-in Cards to Enable?
### Anti-Patterns (from 08)
- Using Pulse for debugging
- Pulse without scheduler
### Related Rules (from 06 skills)
- PULSE-RULE-001: Secure /pulse route
- PULSE-RULE-002: Run pulse:check scheduler
- PULSE-RULE-003: Monitor during deployments
- PULSE-RULE-005: Use SQL storage
- PULSE-RULE-006: Keep raw retention at 1 hour
### Related Skills (from 06 skills)
- Develop Custom Pulse Cards
- Integrate Laravel Nightwatch for Production APM
- Configure Laravel Telescope for Debugging

