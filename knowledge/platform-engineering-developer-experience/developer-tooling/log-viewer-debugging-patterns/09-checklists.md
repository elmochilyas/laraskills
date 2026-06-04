# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** log-viewer-debugging-patterns
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Logs are structured (JSON) for machine parsing
- [ ] Context arrays included in all error/critical log entries
- [ ] Separate log channels for different subsystems
- [ ] Log rotation configured with retention policy
- [ ] Environment-based log levels set appropriately
- [ ] Log viewer (if installed) shows formatted log entries
- [ ] Performance: - Each log write = filesystem operation; excessive logging creates significan...
- [ ] Performance: - Level filtering: ignored levels filtered before formatting (<1Âµs check)
- [ ] Performance: - Stack channel with 3 channels = 3x I/O per log entry

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `config/logging.php` defines channels per environment
- [ ] Architecture guideline: - Use `stack` channel in production combining daily files + error notifications
- [ ] Architecture guideline: - Structured (JSON) in production for machine parsing; line format in development
- [ ] Architecture guideline: - Use `tap` feature for custom Monolog handler customization
- [ ] Architecture guideline: - Centralized aggregation via Logtail, Papertrail, or DataDog for production
- [ ] Decision: Log Level for Production? - ensure correct choice is made
- [ ] Decision: Structured vs Line Format? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Debug with Log Viewer Patterns

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Each log write = filesystem operation; excessive logging creates significant disk I/O
- [ ] - Level filtering: ignored levels filtered before formatting (<1Âµs check)
- [ ] - Stack channel with 3 channels = 3x I/O per log entry
- [ ] - Complex context arrays add formatting overhead

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Never log passwords, API tokens, credit card numbers, PII
- [ ] - Use context scrubbing: `substr($card, -4)` for last 4 digits
- [ ] - Log aggregation services handle sensitive data; ensure SOC2/compliance
- [ ] - Set appropriate log file permissions (rw-r-----)

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
- [ ] Logs are structured (JSON) for machine parsing
- [ ] Context arrays included in all error/critical log entries
- [ ] Separate log channels for different subsystems
- [ ] Log rotation configured with retention policy
- [ ] Environment-based log levels set appropriately
- [ ] Log viewer (if installed) shows formatted log entries

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Logging as debugging -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Same format everywhere -- apply preferred alternative
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
- Debug with Log Viewer Patterns
### Decision Trees (from 07)
- Log Level for Production?
- Structured vs Line Format?
### Anti-Patterns (from 08)
- Logging as debugging
- Same format everywhere
### Related Rules (from 06 skills)
- LOG-RULE-001: Use structured logging
- LOG-RULE-002: Use context arrays
- LOG-RULE-003: Configure log rotation
- LOG-RULE-004: Environment-based verbosity
- LOG-RULE-005: Use log channels
### Related Skills (from 06 skills)
- Install and Configure Laravel Debugbar
- Configure Laravel Telescope for Debugging
- Set Up Mailpit for Email Previews

