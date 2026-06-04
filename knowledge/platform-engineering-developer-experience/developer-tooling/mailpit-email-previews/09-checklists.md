# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** mailpit-email-previews
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Mailpit SMTP accessible on port 1025
- [ ] Web UI accessible on port 8025
- [ ] Emails sent from Laravel appear in Mailpit inbox
- [ ] HTML and plain-text versions render correctly
- [ ] Attachments visible and downloadable
- [ ] CI tests can access Mailpit API for assertions
- [ ] Performance: - SMTP overhead: 5-20ms per email (SMTP conversation, parsing, storage)
- [ ] Performance: - Storage: 5-50KB per email incl. attachments; 500-message limit = <25MB
- [ ] Performance: - API response: <10ms for typical queries

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Configure via environment variables in `.env` for local development
- [ ] Architecture guideline: - Run as Docker service (Sail default) or standalone binary for non-Docker projects
- [ ] Architecture guideline: - Mailpit's API is compatible with MailHog's API in most cases
- [ ] Architecture guideline: - Default 500-message limit prevents unbounded storage
- [ ] Decision: Mailpit vs Alternatives for Email Testing? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Mailpit for Email Previews

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - SMTP overhead: 5-20ms per email (SMTP conversation, parsing, storage)
- [ ] - Storage: 5-50KB per email incl. attachments; 500-message limit = <25MB
- [ ] - API response: <10ms for typical queries
- [ ] - Web UI: smooth up to 10,000 messages

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Development only â€” never deploy Mailpit in production
- [ ] - Captured emails may contain sensitive data (PII, tokens, links); secure access to web UI
- [ ] - Default ports: 1025 (SMTP), 8025 (HTTP); ensure no port conflicts

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
- [ ] Mailpit SMTP accessible on port 1025
- [ ] Web UI accessible on port 8025
- [ ] Emails sent from Laravel appear in Mailpit inbox
- [ ] HTML and plain-text versions render correctly
- [ ] Attachments visible and downloadable
- [ ] CI tests can access Mailpit API for assertions

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mailpit as production mail server -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring Mailpit in automated tests -- apply preferred alternative
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
- Set Up Mailpit for Email Previews
### Decision Trees (from 07)
- Mailpit vs Alternatives for Email Testing?
### Anti-Patterns (from 08)
- Mailpit as production mail server
- Ignoring Mailpit in automated tests
### Related Rules (from 06 skills)
- MAILPIT-RULE-001: Development-only
- MAILPIT-RULE-002: Sail includes Mailpit
- MAILPIT-RULE-003: Use API for CI testing
- MAILPIT-RULE-004: Automatic pruning
### Related Skills (from 06 skills)
- Debug with Log Viewer Patterns
- Configure Laravel Sail
- Set Up Mail Services

