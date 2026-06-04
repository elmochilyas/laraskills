# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** laravel-nightwatch
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Nightwatch package installed and configured in production
- [ ] Data appearing in Nightwatch dashboard (requests, queries, queues)
- [ ] Alerting thresholds configured for relevant metrics
- [ ] Deployment tracking integrated with CI/CD pipeline
- [ ] No performance impact observed from Nightwatch agent
- [ ] Performance: - Collection overhead: 5-15ms per request (optimized, no stack traces)
- [ ] Performance: - Data transmission: batched, async via queued HTTP calls â€” no request late...
- [ ] Performance: - Memory: ~1-2MB per request peak

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Deploy alongside Laravel Pulse for comprehensive observability
- [ ] Architecture guideline: - Tag every deployment in CI/CD for performance correlation
- [ ] Architecture guideline: - Configure sampling per environment/critical route
- [ ] Architecture guideline: - Set severity levels for alerts (warning vs critical) to avoid alert fatigue
- [ ] Decision: Nightwatch vs Pulse for Production Monitoring? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Integrate Laravel Nightwatch for Production APM

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Collection overhead: 5-15ms per request (optimized, no stack traces)
- [ ] - Data transmission: batched, async via queued HTTP calls â€” no request latency impact
- [ ] - Memory: ~1-2MB per request peak
- [ ] - Adaptive sampling reduces overhead proportionally in high-traffic environments

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Paid service â€” budget for subscription cost
- [ ] - Data residency: Nightwatch sends performance data to Laravel's servers
- [ ] - Ensure network egress access to Nightwatch API in restricted networks
- [ ] - Route names may contain identifiers; query texts may contain data

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
- [ ] Nightwatch package installed and configured in production
- [ ] Data appearing in Nightwatch dashboard (requests, queries, queues)
- [ ] Alerting thresholds configured for relevant metrics
- [ ] Deployment tracking integrated with CI/CD pipeline
- [ ] No performance impact observed from Nightwatch agent

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Skipping Pulse -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Alert fatigue -- apply preferred alternative
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
- Integrate Laravel Nightwatch for Production APM
### Decision Trees (from 07)
- Nightwatch vs Pulse for Production Monitoring?
### Anti-Patterns (from 08)
- Skipping Pulse
- Alert fatigue
### Related Rules (from 06 skills)
- NW-RULE-001: Production APM
- NW-RULE-002: Deployment tracking
- NW-RULE-003: Configure alerting
### Related Skills (from 06 skills)
- Configure Laravel Pulse for Monitoring
- Configure Laravel Telescope for Debugging
- Monitor Production with Laravel Pulse

