# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** database-services
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Database container running and accessible
- [ ] Migrations run without errors
- [ ] Seed data populates correctly
- [ ] DB credentials match between .env and docker-compose.yml
- [ ] Persistent volume preserves data across restarts
- [ ] SQLite configured for unit tests
- [ ] Integration tests run against production-matching engine
- [ ] Performance: - Docker DB: <1ms network latency (same host)
- [ ] Performance: - SQLite in-memory: 2-5x faster tests than MySQL/PostgreSQL
- [ ] Performance: - Named volumes: better performance than bind mounts for DB files

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Add `database-services` to docker-compose.yml services section
- [ ] Architecture guideline: - Configure `config/database.php` with multiple connections for app + analytics/reporting
- [ ] Architecture guideline: - Use `migrate:fresh --seed` to reset DB to known state during development
- [ ] Architecture guideline: - Each developer their own database container (isolated data)

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Database Services in Laravel Dev

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Docker DB: <1ms network latency (same host)
- [ ] - SQLite in-memory: 2-5x faster tests than MySQL/PostgreSQL
- [ ] - Named volumes: better performance than bind mounts for DB files
- [ ] - macOS: Docker DB is 20-30% slower than native
- [ ] - Memory: allocate 4GB+ Docker memory for DB containers

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Dev DB passwords are typically simple â€” never reuse in production
- [ ] - Dev data should be anonymized/synthetic, not production PII
- [ ] - No backups needed for dev DB (recreatable via migrations + seeders)

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
- [ ] Database container running and accessible
- [ ] Migrations run without errors
- [ ] Seed data populates correctly
- [ ] DB credentials match between .env and docker-compose.yml
- [ ] Persistent volume preserves data across restarts
- [ ] SQLite configured for unit tests
- [ ] Integration tests run against production-matching engine

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Running migrations on production from local -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Sharing one dev database across the team -- apply preferred alternative
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
- Configure Database Services in Laravel Dev
### Anti-Patterns (from 08)
- Running migrations on production from local
- Sharing one dev database across the team
### Related Rules (from 06 skills)
- DB-RULE-001: Match production engine
- DB-RULE-002: Use persistent volumes
- DB-RULE-003: Migration-first development
- DB-RULE-004: Use seed data
- DB-RULE-005: SQLite for unit tests
### Related Skills (from 06 skills)
- Configure Cache and Queue Services
- Set Up Docker Compose for Laravel
- Configure Laravel Sail

