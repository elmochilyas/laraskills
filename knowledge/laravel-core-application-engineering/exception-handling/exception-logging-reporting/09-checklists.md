# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Error Tracking Integration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Always Use `daily` Log Driver in Production, Never `single`
- [ ] Enforce: Integrate an External Error Tracker on Day One of Every Production-Deployed Application
- [ ] Enforce: Never Log Sensitive Data in Exception Contexts
- [ ] Enforce: Log Expected Exceptions at INFO Level, Not ERROR
- [ ] Enforce: Add Global Context to Every Exception Report
- [ ] Enforce: Use Appropriate Log Level per Environment â€” Debug in Local, Warning in Production
- [ ] Enforce: Use a Stack Channel to Send to Both File and Error Tracker
- [ ] Enforce: Configure Alerts for Critical Exception Types
- [ ] Enforce: Use Structured JSON Logging for Production Log Aggregation
- [ ] `daily` log driver is configured for production (not `single`)
- [ ] Production `LOG_LEVEL` is set to `warning` (not `debug`)
- [ ] Structured JSON logging is enabled (JsonFormatter)
- [ ] External error tracker is installed and configured with DSN
- [ ] `stack` channel sends to both file and error tracker
- [ ] Alerts are configured for CRITICAL/ERROR exceptions
- [ ] Log files are not publicly accessible (outside `public/`)
- [ ] Log retention is configured (typically 30 days)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Use `daily` driver for production (never `single`)
- [ ] Architecture guideline: - Configure log level per environment: `debug` in local, `warning` in production
- [ ] Architecture guideline: - Integrate external error tracker (Sentry/Flare/Bugsnag) on day one
- [ ] Architecture guideline: - Add global context via `context()` method on the Handler
- [ ] Architecture guideline: - Use dedicated log channels for domain-specific errors (billing, audit)
- [ ] Architecture guideline: - Configure alerts for critical exceptions (PagerDuty, Opsgenie, Slack)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Always Use `daily` Log Driver in Production, Never `single`
- [ ] Apply rule: Integrate an External Error Tracker on Day One of Every Production-Deployed Application
- [ ] Apply rule: Never Log Sensitive Data in Exception Contexts
- [ ] Apply rule: Log Expected Exceptions at INFO Level, Not ERROR
- [ ] Apply rule: Add Global Context to Every Exception Report
- [ ] Apply rule: Use Appropriate Log Level per Environment â€” Debug in Local, Warning in Production
- [ ] Apply rule: Use a Stack Channel to Send to Both File and Error Tracker
- [ ] Apply rule: Configure Alerts for Critical Exception Types
- [ ] Apply rule: Use Structured JSON Logging for Production Log Aggregation
- [ ] Skill applied: Configure Production Logging and Error Tracking
- [ ] Skill applied: Set Up Exception Context Enrichment and Suppression

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
- [ ] `daily` log driver is configured for production (not `single`)
- [ ] Production `LOG_LEVEL` is set to `warning` (not `debug`)
- [ ] Structured JSON logging is enabled (JsonFormatter)
- [ ] External error tracker is installed and configured with DSN
- [ ] `stack` channel sends to both file and error tracker
- [ ] Alerts are configured for CRITICAL/ERROR exceptions
- [ ] Log files are not publicly accessible (outside `public/`)

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
- Always Use `daily` Log Driver in Production, Never `single`
- Integrate an External Error Tracker on Day One of Every Production-Deployed Application
- Never Log Sensitive Data in Exception Contexts
- Log Expected Exceptions at INFO Level, Not ERROR
- Add Global Context to Every Exception Report
- Use Appropriate Log Level per Environment â€” Debug in Local, Warning in Production
- Use a Stack Channel to Send to Both File and Error Tracker
- Configure Alerts for Critical Exception Types
- Use Structured JSON Logging for Production Log Aggregation
### Skills (from 06)
- Configure Production Logging and Error Tracking
- Set Up Exception Context Enrichment and Suppression
### Related Rules (from 06 skills)
- Always Use daily Log Driver in Production, Never single
- Integrate an External Error Tracker on Day One
- Never Log Sensitive Data in Exception Contexts
- Use Appropriate Log Level per Environment â€” Debug in Local, Warning in Production
- Use a Stack Channel to Send to Both File and Error Tracker
- Configure Alerts for Critical Exception Types
- Use Structured JSON Logging for Production Log Aggregation
### Related Skills (from 06 skills)
- Set Up Exception Reporting and Logging Configuration (exception-fundamentals)
- Configure Environment-Specific Exception Handling (global-exception-handling)

