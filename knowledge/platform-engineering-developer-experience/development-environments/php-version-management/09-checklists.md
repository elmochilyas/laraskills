# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** php-version-management
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] PHP version matches between dev and production
- [ ] Sail container rebuilt after version change
- [ ] CI matrix tests against multiple PHP versions
- [ ] `composer.json` specifies minimum PHP version
- [ ] EOL dates known and upgrade planned
- [ ] Extensions compatible with selected PHP version
- [ ] Performance: - PHP 8.4 is 2-3x faster than PHP 7.4
- [ ] Performance: - Each 8.x release improves 10-30% over previous
- [ ] Performance: - JIT (PHP 8.0+): 2-5x improvement for CPU-intensive tasks

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Set `PHP_VERSION` in .env, not docker-compose.yml
- [ ] Architecture guideline: - Commit docker-compose.yml with `PHP_VERSION` placeholder
- [ ] Architecture guideline: - Use CI matrix for multi-version testing; local dev uses single version
- [ ] Architecture guideline: - For legacy projects, use custom Sail images with older PHP versions

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Manage PHP Versions for Laravel

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - PHP 8.4 is 2-3x faster than PHP 7.4
- [ ] - Each 8.x release improves 10-30% over previous
- [ ] - JIT (PHP 8.0+): 2-5x improvement for CPU-intensive tasks
- [ ] - Docker: ~5% overhead vs native PHP

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - PHP 8.0 security support ended Nov 2024 â€” upgrade to supported version
- [ ] - Match version to get security patches
- [ ] - Older versions have known CVEs

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
- [ ] PHP version matches between dev and production
- [ ] Sail container rebuilt after version change
- [ ] CI matrix tests against multiple PHP versions
- [ ] `composer.json` specifies minimum PHP version
- [ ] EOL dates known and upgrade planned
- [ ] Extensions compatible with selected PHP version

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Latest PHP for all projects -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring composer PHP constraints -- apply preferred alternative
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
- Manage PHP Versions for Laravel
### Anti-Patterns (from 08)
- Latest PHP for all projects
- Ignoring composer PHP constraints
### Related Rules (from 06 skills)
- PHPVER-RULE-001: Match production exactly
- PHPVER-RULE-002: CI matrix testing
- PHPVER-RULE-003: Use Sail for version isolation
- PHPVER-RULE-004: Rebuild after version change
- PHPVER-RULE-005: Check Laravel compatibility
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Customize Sail with Dockerfiles
- Configure Static Analysis in CI

