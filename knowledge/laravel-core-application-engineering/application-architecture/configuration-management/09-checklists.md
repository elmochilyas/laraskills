# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Application Architecture & Structure
**Knowledge Unit:** Configuration Management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Verify: Use env() Only in Config Files
- [ ] Verify: Validate Required Values in Config Files
- [ ] Verify: Use the Environment File Cascade
- [ ] Verify: Clear and Rebuild Cache on Deploy
- [ ] No `env()` calls exist outside `config/` directory
- [ ] Every `env()` call in config files has a default value
- [ ] Required production values are validated and throw on missing
- [ ] `config:cache` runs as part of every deployment
- [ ] `config:clear` runs before `config:cache` in deployment scripts
- [ ] Deployment fails if `config:cache` encounters an error
- [ ] Cached config file permissions restrict access to web server user only
- [ ] Secrets are referenced via `env()` â€” no hardcoded secrets in config files
- [ ] Performance: ### Uncached Loading Cost
- [ ] Performance: 25 config files â†’ 3-8ms per request. Scales linearly with file count.
- [ ] Performance: ### Cached Loading Cost

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: ### Config File Loading Flow
- [ ] Architecture guideline: LoadConfiguration::bootstrap($app)
- [ ] Architecture guideline: â†’ glob config/*.php
- [ ] Architecture guideline: â†’ sort alphabetically
- [ ] Architecture guideline: â†’ foreach: require file, set key in repository
- [ ] Architecture guideline: â†’ apply environment-specific overrides
- [ ] Architecture guideline: â†’ register repository as 'config' singleton
- [ ] Architecture guideline: ### Cached vs Uncached
- [ ] Architecture guideline: Cached: single `require bootstrap/cache/config.php` â€” <0.5ms.
- [ ] Architecture guideline: Uncached: 25+ file reads, glob scan, array merges â€” 3-8ms.
- [ ] Architecture guideline: Always cache in production.
- [ ] Architecture guideline: ### Config Repository as Contract

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Best practice: Use env() Only in Config Files
- [ ] Best practice: Validate Required Values in Config Files
- [ ] Best practice: Use the Environment File Cascade
- [ ] Best practice: Clear and Rebuild Cache on Deploy
- [ ] Skill applied: Implement Config Caching in Deployment Pipeline
- [ ] Skill applied: Audit and Fix env() Misuse

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] ### Uncached Loading Cost
- [ ] 25 config files â†’ 3-8ms per request. Scales linearly with file count.
- [ ] ### Cached Loading Cost
- [ ] Single file â†’ <0.5ms regardless of count. File count has zero impact.
- [ ] ### Cache Miss Impact
- [ ] If `bootstrap/cache/config.php` doesn't exist, fallback to uncached is silent. No error or warning. Requires bootstra...
- [ ] ### env() Performance
- [ ] ~0.001ms per call. Accumulates at 50+ calls per request. Use `config()` for performance consistency.

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] ### Environment Variable Exposure
- [ ] Environment variables are accessible to any PHP process, `php artisan tinker`, `phpinfo()` output, and error backtraces.
- [ ] ### Secrets in Config Files
- [ ] Never hardcode secrets in `config/*.php`. Use `.env` (in `.gitignore`) or server-level environment variables.
- [ ] ### Cache File Permissions
- [ ] `bootstrap/cache/config.php` contains resolved configuration including secrets. Protect with filesystem permissions.
- [ ] ### Stale Cache After Deployment

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
- [ ] No `env()` calls exist outside `config/` directory
- [ ] Every `env()` call in config files has a default value
- [ ] Required production values are validated and throw on missing
- [ ] `config:cache` runs as part of every deployment
- [ ] `config:clear` runs before `config:cache` in deployment scripts
- [ ] Deployment fails if `config:cache` encounters an error
- [ ] Cached config file permissions restrict access to web server user only

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: `env()` Outside Config Files -- apply preferred alternative
    - [ ] Search entire codebase for `env(` excluding `config/` directory
    - [ ] Check Blade templates (`resources/views/`)
    - [ ] Check routes files (`routes/`)
- [ ] Prevent: Hardcoded Secrets in Config Files -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Config as Feature Flag Store -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern
- [ ] Prevent: Runtime Config Mutability -- apply preferred alternative
    - [ ] Ensure detection checklist passes for this anti-pattern

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
- Implement Config Caching in Deployment Pipeline
- Audit and Fix env() Misuse
### Decision Trees (from 07)
- `env()` vs `config()` Helper Usage
- Config Caching Strategy
- Config vs Database for Feature Flags
### Anti-Patterns (from 08)
- `env()` Outside Config Files
- Hardcoded Secrets in Config Files
- Config as Feature Flag Store
- Runtime Config Mutability
### Related Rules (from 06 skills)
- Use env() Only in Config Files (05-rules.md)
- Always Provide Default Values for env() Calls (05-rules.md)
- Validate Required Config Values in Production (05-rules.md)
- Never Use Configuration for Runtime Feature Flags (05-rules.md)
- Never Hardcode Secrets in Config Files (05-rules.md)
- Always Clear and Rebuild Config Cache on Deployment (05-rules.md)
### Related Skills (from 06 skills)
- Skill: Audit and Fix env() Misuse
- Skill: Optimize Bootstrap Performance
- Skill: Configure Deployment Pipeline

