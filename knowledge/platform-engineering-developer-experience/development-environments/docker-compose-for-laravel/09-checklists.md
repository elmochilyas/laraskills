# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** docker-compose-for-laravel
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] All services start with `docker-compose up -d`
- [ ] PHP-FPM container responds on port 9000
- [ ] Nginx serves the Laravel application
- [ ] Database accessible via service name and forwarded port
- [ ] Redis responds to ping
- [ ] Mailpit web UI accessible
- [ ] Health checks pass for all services
- [ ] Performance: - macOS bind mount: 5-10x slower I/O (use :cached or :delegated)
- [ ] Performance: - Service startup: 15-45s full stack; 2-5s individual restarts
- [ ] Performance: - RAM: 2-4GB full Sail stack

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Sail's Nginx + PHP-FPM + MySQL + Redis for standard setup
- [ ] Architecture guideline: - Add optional services via profiles (selenium, mailpit)
- [ ] Architecture guideline: - Use Docker Compose v2 (`docker compose`, not `docker-compose`)
- [ ] Architecture guideline: - Env variable substitution in compose file for customization

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Set Up Docker Compose for Laravel

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - macOS bind mount: 5-10x slower I/O (use :cached or :delegated)
- [ ] - Service startup: 15-45s full stack; 2-5s individual restarts
- [ ] - RAM: 2-4GB full Sail stack
- [ ] - Image sizes: PHP ~500MB, DB ~200-500MB each

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Development only â€” relaxed security (no read-only root fs, capabilities)
- [ ] - Port 3306 exposed â€” don't run on cloud VMs without firewall
- [ ] - Volume permissions on Linux may cause UID mismatches

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
- [ ] All services start with `docker-compose up -d`
- [ ] PHP-FPM container responds on port 9000
- [ ] Nginx serves the Laravel application
- [ ] Database accessible via service name and forwarded port
- [ ] Redis responds to ping
- [ ] Mailpit web UI accessible
- [ ] Health checks pass for all services

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Production Compose file -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Single-container everything -- apply preferred alternative
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
- Set Up Docker Compose for Laravel
### Anti-Patterns (from 08)
- Production Compose file
- Single-container everything
### Related Rules (from 06 skills)
- DC-RULE-001: Customize via .env, not docker-compose.yml
- DC-RULE-002: Add services via extension
- DC-RULE-003: Use bind mounts for dev
- DC-RULE-004: Use health checks
- DC-RULE-005: Set resource limits
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Configure Devcontainer for Laravel
- Customize Sail with Dockerfiles

