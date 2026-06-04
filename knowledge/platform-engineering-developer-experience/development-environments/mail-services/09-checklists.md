# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** mail-services
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Mailpit accessible on port 1025 (SMTP) and 8025 (Web UI)
- [ ] Emails sent from Laravel appear in Mailpit inbox
- [ ] HTML and plain-text versions render correctly
- [ ] Attachments visible and downloadable
- [ ] CI tests use Mailpit API for email assertions
- [ ] Production `.env` uses real mail driver
- [ ] Mailpit is NOT running in production
- [ ] Performance: - SMTP overhead: 10-50ms per email
- [ ] Performance: - Memory: <50MB with 500 message limit
- [ ] Performance: - Web UI: instant load for <1000 messages

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Configure in `.env` per environment: SMTP for dev, SES/Mailgun for production
- [ ] Architecture guideline: - Sail includes Mailpit in docker-compose.yml by default
- [ ] Architecture guideline: - Each developer has their own Mailpit instance (part of Sail)
- [ ] Architecture guideline: - For team collaboration, consider shared Mailtrap inbox

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Mail Services in Laravel Dev

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - SMTP overhead: 10-50ms per email
- [ ] - Memory: <50MB with 500 message limit
- [ ] - Web UI: instant load for <1000 messages
- [ ] - API: <10ms response for typical queries

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Development only â€” never in production
- [ ] - No authentication on SMTP/HTTP endpoints (local-only access)
- [ ] - Captured emails may contain sensitive data
- [ ] - Run only on localhost or internal networks

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
- [ ] Mailpit accessible on port 1025 (SMTP) and 8025 (Web UI)
- [ ] Emails sent from Laravel appear in Mailpit inbox
- [ ] HTML and plain-text versions render correctly
- [ ] Attachments visible and downloadable
- [ ] CI tests use Mailpit API for email assertions
- [ ] Production `.env` uses real mail driver
- [ ] Mailpit is NOT running in production

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Mailpit as production email server -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Skipping production email verification -- apply preferred alternative
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
- Configure Mail Services in Laravel Dev
### Anti-Patterns (from 08)
- Mailpit as production email server
- Skipping production email verification
### Related Rules (from 06 skills)
- MAIL-RULE-001: Environment-specific mail config
- MAIL-RULE-002: Preview mailables
- MAIL-RULE-003: Use Mailpit API in tests
- MAIL-RULE-004: Clear between test runs
- MAIL-RULE-005: Start mail service
### Related Skills (from 06 skills)
- Set Up Mailpit for Email Previews
- Configure Laravel Sail
- Set Up Docker Compose for Laravel

