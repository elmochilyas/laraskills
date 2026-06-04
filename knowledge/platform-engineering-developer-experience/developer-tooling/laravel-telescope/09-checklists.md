# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** laravel-telescope
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Telescope dashboard accessible at `/telescope` with authentication
- [ ] All watchers enabled and capturing data in development
- [ ] Production watchers limited to Exception, SlowQuery, FailedJob
- [ ] Health check endpoints filtered out
- [ ] Pruning scheduler configured and running
- [ ] Tags visible in dashboard filtering
- [ ] Performance: - Full recording overhead: 10-50ms per request
- [ ] Performance: - Selective recording (Exception only): <5ms
- [ ] Performance: - Database write: 100 req/s = 500-1000 entries/second

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - All watchers in development; selective (Exception, SlowQuery, FailedJob) in production
- [ ] Architecture guideline: - Storage: Database for simplicity; Redis for high-traffic; custom for compliance
- [ ] Architecture guideline: - Retention: 24h default for development; 7 days staging; 1 hour production
- [ ] Architecture guideline: - Access control: gate-based with authorization policy
- [ ] Architecture guideline: - Never enable DumpWatcher in production
- [ ] Decision: Telescope in Production? - ensure correct choice is made
- [ ] Decision: Database vs Redis Storage? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Laravel Telescope for Debugging

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Full recording overhead: 10-50ms per request
- [ ] - Selective recording (Exception only): <5ms
- [ ] - Database write: 100 req/s = 500-1000 entries/second
- [ ] - Database growth: 1-5GB with 24h retention for busy apps
- [ ] - Dashboard queries: use pruning, indexing, pagination for responsiveness

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Telescope records request data including PII, passwords, API tokens
- [ ] - Secure dashboard with authorization gates
- [ ] - Filter sensitive data via `Telescope::filter()`
- [ ] - Never expose `/telescope` without authentication
- [ ] - Consider GDPR/HIPAA compliance for recorded request data

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
- [ ] Telescope dashboard accessible at `/telescope` with authentication
- [ ] All watchers enabled and capturing data in development
- [ ] Production watchers limited to Exception, SlowQuery, FailedJob
- [ ] Health check endpoints filtered out
- [ ] Pruning scheduler configured and running
- [ ] Tags visible in dashboard filtering

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Telescope as real-time monitor -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Unlimited retention -- apply preferred alternative
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
- Configure Laravel Telescope for Debugging
### Decision Trees (from 07)
- Telescope in Production?
- Database vs Redis Storage?
### Anti-Patterns (from 08)
- Telescope as real-time monitor
- Unlimited retention
### Related Rules (from 06 skills)
- TELESCOPE-RULE-001: Selective watchers in production
- TELESCOPE-RULE-002: Secure /telescope route
- TELESCOPE-RULE-003: Schedule pruning
- TELESCOPE-RULE-004: Filter health checks
- TELESCOPE-RULE-005: Use tags
- TELESCOPE-RULE-006: Redis storage for high-traffic
### Related Skills (from 06 skills)
- Configure Telescope Watchers
- Develop Custom Pulse Cards
- Install and Configure Laravel Debugbar

