# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** sail-customization-dockerfiles
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] `docker/` directory committed to version control
- [ ] Custom PHP extensions installed (`php -m | grep <extension>`)
- [ ] Custom system packages available
- [ ] PHP ini settings applied correctly
- [ ] Image builds without errors
- [ ] Application runs correctly with customizations
- [ ] Supervisord (if used) manages PHP-FPM + Horizon
- [ ] Performance: - Build cache: reordering early instructions invalidates downstream caches
- [ ] Performance: - Image size: each RUN adds a layer; chain commands with `&&`
- [ ] Performance: - Alpine images: ~150MB vs Debian ~400MB

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Publish via `sail:publish` before any customization
- [ ] Architecture guideline: - Add extensions after Sail's existing RUN instructions
- [ ] Architecture guideline: - Use Alpine base for smaller images; Debian for packages with Alpine incompatibilities
- [ ] Architecture guideline: - Build-time COPY for stable config; run-time volume mount for environment-specific settings

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Customize Sail with Dockerfiles

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Build cache: reordering early instructions invalidates downstream caches
- [ ] - Image size: each RUN adds a layer; chain commands with `&&`
- [ ] - Alpine images: ~150MB vs Debian ~400MB
- [ ] - Rebuild time: 1-5 minutes

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Development only â€” production images built separately (Forge/Docker CI)
- [ ] - Published Dockerfiles don't auto-update with Sail security patches
- [ ] - Compare with Sail's latest template periodically

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
- [ ] `docker/` directory committed to version control
- [ ] Custom PHP extensions installed (`php -m | grep <extension>`)
- [ ] Custom system packages available
- [ ] PHP ini settings applied correctly
- [ ] Image builds without errors
- [ ] Application runs correctly with customizations
- [ ] Supervisord (if used) manages PHP-FPM + Horizon

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Overloading the PHP container -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Unpublished customization -- apply preferred alternative
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
- Customize Sail with Dockerfiles
### Anti-Patterns (from 08)
- Overloading the PHP container
- Unpublished customization
### Related Rules (from 06 skills)
- SAILCUST-RULE-001: Don't modify vendor/sail directly
- SAILCUST-RULE-002: Chain RUN commands
- SAILCUST-RULE-003: Order by change frequency
- SAILCUST-RULE-004: Use shared scripts for multi-version
- SAILCUST-RULE-005: Rebuild after changes
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Set Up Docker Compose for Laravel
- Configure Devcontainer for Laravel

