# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** xdebug-integration-sail
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] IDE shows "listening for Xdebug connections"
- [ ] Breakpoints hit when debugging web requests
- [ ] Breakpoints hit when debugging CLI commands and tests
- [ ] Variable inspection works during step debugging
- [ ] Profiling produces cachegrind output files
- [ ] Code coverage reports generated correctly
- [ ] Xdebug disabled when not needed (`SAIL_XDEBUG_MODE=off`)
- [ ] Performance: - Debug mode: 2-10x execution time (breakpoint pauses, IDE communication)
- [ ] Performance: - Profile mode: 10-30% overhead for call-graph data generation
- [ ] Performance: - Coverage mode: 20-50% overhead for line execution tracking

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Xdebug disabled by default in Sail; activated via env variables when debugging
- [ ] Architecture guideline: - Modes: develop (safe for daily use), debug (on-demand), profile (targeted), coverage (test runs)
- [ ] Architecture guideline: - Port 9003 (Xdebug 3 standard) â€” must be accessible from container to host
- [ ] Architecture guideline: - CLI debugging: prefix with `XDEBUG_MODE=debug` or set in sail shell
- [ ] Decision: Enable Xdebug by Default or On-Demand? - ensure correct choice is made
- [ ] Decision: Xdebug Mode Selection? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Xdebug Integration with Laravel Sail

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Debug mode: 2-10x execution time (breakpoint pauses, IDE communication)
- [ ] - Profile mode: 10-30% overhead for call-graph data generation
- [ ] - Coverage mode: 20-50% overhead for line execution tracking
- [ ] - Develop mode: 1-5% overhead (enhanced var_dump only â€” safe for daily dev)
- [ ] - Docker networking: 1-5ms per interaction (negligible)

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

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
- [ ] Breakpoints hit when debugging web requests
- [ ] Breakpoints hit when debugging CLI commands and tests
- [ ] Variable inspection works during step debugging
- [ ] Profiling produces cachegrind output files
- [ ] Code coverage reports generated correctly
- [ ] Xdebug disabled when not needed (`SAIL_XDEBUG_MODE=off`)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Xdebug as primary debugging tool for all issues -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Profiling in development as default -- apply preferred alternative
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
- Configure Xdebug Integration with Laravel Sail
### Decision Trees (from 07)
- Enable Xdebug by Default or On-Demand?
- Xdebug Mode Selection?
### Anti-Patterns (from 08)
- Xdebug as primary debugging tool for all issues
- Profiling in development as default
### Related Rules (from 06 skills)
- XDEBUG-RULE-001: Disable when not debugging
- XDEBUG-RULE-002: Never enable in production
- XDEBUG-RULE-003: Use trigger variables
- XDEBUG-RULE-004: Sail includes Xdebug
- XDEBUG-RULE-005: IDE key matching
### Related Skills (from 06 skills)
- Configure Laravel Sail
- Configure Xdebug in Docker
- Debug with Log Viewer Patterns

