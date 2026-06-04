# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** laravel-sail
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Sail environment starts with `sail up -d`
- [ ] Application accessible at `http://localhost` (or configured port)
- [ ] Database accessible via `sail artisan migrate`
- [ ] Redis accessible for cache and queues
- [ ] Mailpit UI accessible for email previews
- [ ] `sail` alias configured for convenience
- [ ] PHP version matches production
- [ ] Performance: - Startup: 1-5min initial, 15-45s subsequent
- [ ] Performance: - macOS filesystem: bind mounts have slower I/O (Sail uses :cached)
- [ ] Performance: - RAM: 3-5GB full stack

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Default: Nginx (via laravel.test) + MySQL + Redis
- [ ] Architecture guideline: - Add optional services as needed (meilisearch, selenium, minio)
- [ ] Architecture guideline: - File synchronization via bind mount (.:/var/www/html)
- [ ] Architecture guideline: - Service communication via Docker network using service hostnames

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Laravel Sail

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Startup: 1-5min initial, 15-45s subsequent
- [ ] - macOS filesystem: bind mounts have slower I/O (Sail uses :cached)
- [ ] - RAM: 3-5GB full stack
- [ ] - PHP-FPM in Docker: ~5% overhead vs native

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Development only â€” exposes ports, debug tools, no security hardening
- [ ] - Forge compatibility: Sail setup mirrors Forge's production architecture
- [ ] - Don't expose Sail ports to public internet

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
- [ ] Sail environment starts with `sail up -d`
- [ ] Application accessible at `http://localhost` (or configured port)
- [ ] Database accessible via `sail artisan migrate`
- [ ] Redis accessible for cache and queues
- [ ] Mailpit UI accessible for email previews
- [ ] `sail` alias configured for convenience
- [ ] PHP version matches production

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Sail in production -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Full Sail for simple projects -- apply preferred alternative
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
- Configure Laravel Sail
### Anti-Patterns (from 08)
- Sail in production
- Full Sail for simple projects
### Related Rules (from 06 skills)
- SAIL-RULE-001: Use sail alias
- SAIL-RULE-002: Don't modify docker-compose.yml directly
- SAIL-RULE-003: Match PHP version to production
- SAIL-RULE-005: Run migrations after start
- SAIL-RULE-006: Use selective services
### Related Skills (from 06 skills)
- Customize Sail with Dockerfiles
- Set Up Docker Compose for Laravel
- Configure Devcontainer for Laravel

