# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Logging Strategies
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Map Log Levels to Exception Severity
- [ ] Enforce: Use Daily Log Driver in Production
- [ ] Enforce: Never Log Sensitive Data
- [ ] Enforce: Use Structured Logging for Production
- [ ] Enforce: Set Appropriate Log Level Per Environment
- [ ] Log levels are mapped per exception type (INFO/WARNING/ERROR)
- [ ] `daily` driver is used in production
- [ ] LOG_LEVEL is warning or higher in production
- [ ] Global context includes user_id, url, method, ip, request_id
- [ ] No sensitive data (PII, passwords, tokens) in log context
- [ ] External error tracker is integrated (if applicable)
- [ ] Alerting is configured for CRITICAL exception types

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers
- [ ] Architecture guideline: Use `daily` driver for production
- [ ] Architecture guideline: Configure log level per environment
- [ ] Architecture guideline: Integrate external error tracker on day one
- [ ] Architecture guideline: Add global context via `context()`
- [ ] Architecture guideline: Use dedicated channels for domain errors
- [ ] Architecture guideline: Configure alerts for critical exceptions

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values — configuration is externalized
- [ ] Apply rule: Map Log Levels to Exception Severity
- [ ] Apply rule: Use Daily Log Driver in Production
- [ ] Apply rule: Never Log Sensitive Data
- [ ] Apply rule: Use Structured Logging for Production
- [ ] Apply rule: Set Appropriate Log Level Per Environment
- [ ] Skill applied: Configure Exception Logging Strategy
- [ ] Skill applied: Implement Structured Logging

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] SQL injection vectors are eliminated
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] Log files are not publicly accessible

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Logging level is appropriate for production
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Log retention policy is defined and configured
- [ ] Disk space monitoring is in place for log storage

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Map Log Levels to Exception Severity
- Use Daily Log Driver in Production
- Never Log Sensitive Data
- Use Structured Logging for Production
- Set Appropriate Log Level Per Environment
### Skills (from 06)
- Configure Exception Logging Strategy
- Implement Structured Logging
