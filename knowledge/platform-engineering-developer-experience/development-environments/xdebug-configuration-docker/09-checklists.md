# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** development-environments
**Knowledge Unit:** xdebug-configuration-docker
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] IDE shows "listening for Xdebug connections"
- [ ] Breakpoints hit in web requests
- [ ] Breakpoints hit in CLI commands and tests
- [ ] Trigger mode works (no overhead until `XDEBUG_TRIGGER=1`)
- [ ] Profiling produces cachegrind output files
- [ ] Code coverage reports generated correctly
- [ ] Xdebug disabled when not actively debugging
- [ ] Performance: - Disabled (mode=off): zero overhead (Xdebug 3 mode system)
- [ ] Performance: - Develop mode: ~3-5% overhead
- [ ] Performance: - Debug mode (auto-start): ~50-200ms per request (TCP connection overhead)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Set `SAIL_XDEBUG_MODE` in .env, not docker-compose.yml
- [ ] Architecture guideline: - Port 9003 must be accessible from container to host
- [ ] Architecture guideline: - PhpStorm: zero-configuration with Docker Compose CLI interpreter
- [ ] Architecture guideline: - VS Code: PHP Debug extension with launch.json for Sail
- [ ] Architecture guideline: - CLI debugging: `sail artisan command` with Xdebug active

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Xdebug in Docker

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Disabled (mode=off): zero overhead (Xdebug 3 mode system)
- [ ] - Develop mode: ~3-5% overhead
- [ ] - Debug mode (auto-start): ~50-200ms per request (TCP connection overhead)
- [ ] - Coverage mode: 30-50% test execution overhead
- [ ] - Profile mode: 10-20% overhead + disk I/O for cachegrind output

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Never enable Xdebug in production â€” leaks code paths, slows requests, debug port is a security risk
- [ ] - Don't expose port 9003 to public networks
- [ ] - Production images (Forge) don't include Xdebug

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
- [ ] IDE shows "listening for Xdebug connections"
- [ ] Breakpoints hit in web requests
- [ ] Breakpoints hit in CLI commands and tests
- [ ] Trigger mode works (no overhead until `XDEBUG_TRIGGER=1`)
- [ ] Profiling produces cachegrind output files
- [ ] Code coverage reports generated correctly
- [ ] Xdebug disabled when not actively debugging

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Leaving debug mode on constantly -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Xdebug for all debugging -- apply preferred alternative
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
- Configure Xdebug in Docker
### Anti-Patterns (from 08)
- Leaving debug mode on constantly
- Xdebug for all debugging
### Related Rules (from 06 skills)
- XDEBUGD-RULE-001: Toggle on demand
- XDEBUGD-RULE-002: Use trigger mode
- XDEBUGD-RULE-003: Use `host.docker.internal`
- XDEBUGD-RULE-004: Start IDE listener first
- XDEBUGD-RULE-005: Restart Sail after config change
### Related Skills (from 06 skills)
- Configure Xdebug Integration with Sail
- Configure Laravel Sail
- Debug with Log Viewer Patterns

