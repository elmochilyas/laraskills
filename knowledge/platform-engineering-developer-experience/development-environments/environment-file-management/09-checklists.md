# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** environment-file-management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `.env` in `.gitignore`
- [ ] `.env.example` committed with all required variables documented
- [ ] `env()` only called in `config/` files
- [ ] Application code uses `config()` helper
- [ ] Config caching works in production
- [ ] Critical env vars validated at bootstrap
- [ ] Environment-specific files created for testing/Dusk
- [ ] Performance: - Config caching: reduces bootstrap by 10-30ms in production
- [ ] Performance: - env() call overhead: negligible in config files (loaded once)
- [ ] Performance: - config() calls cached in memory after first access

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - `env()` only in `config/` files; `config()` everywhere else
- [ ] Architecture guideline: - Base values in config files; overrides in `.env`; server env vars for deployment platforms
- [ ] Architecture guideline: - Production: always cache config. Development: never cache config
- [ ] Architecture guideline: - Same .env structure (same keys), different values per environment

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Manage Laravel Environment Files

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Config caching: reduces bootstrap by 10-30ms in production
- [ ] - env() call overhead: negligible in config files (loaded once)
- [ ] - config() calls cached in memory after first access
- [ ] - Reading .env on every request (uncached): 1-3ms file I/O

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Never commit `.env` to version control
- [ ] - Rotate APP_KEY carefully â€” old encrypted data becomes unreadable
- [ ] - Never log environment variable values
- [ ] - Use deployment platform's encrypted storage for production secrets

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
- [ ] `.env` in `.gitignore`
- [ ] `.env.example` committed with all required variables documented
- [ ] `env()` only called in `config/` files
- [ ] Application code uses `config()` helper
- [ ] Config caching works in production
- [ ] Critical env vars validated at bootstrap
- [ ] Environment-specific files created for testing/Dusk

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Hard-coding secrets in config files -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Multiple .env files in production -- apply preferred alternative
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
- Manage Laravel Environment Files
### Anti-Patterns (from 08)
- Hard-coding secrets in config files
- Multiple .env files in production
### Related Rules (from 06 skills)
- ENV-RULE-001: `env()` only in config files
- ENV-RULE-002: Cache config in production
- ENV-RULE-003: Never cache in development
- ENV-RULE-004: Keep .env.example updated
- ENV-RULE-005: Validate required vars at bootstrap
### Related Skills (from 06 skills)
- Set Up Docker Compose for Laravel
- Configure Laravel Sail
- Set Up Automated Environment Setup Scripts

