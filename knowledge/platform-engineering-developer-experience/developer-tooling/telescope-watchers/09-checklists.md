# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** telescope-watchers
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] All watchers enabled and capturing data in development
- [ ] Only Exception, SlowQuery, FailedJob enabled in production
- [ ] Watcher thresholds configured to filter noise
- [ ] Health check endpoints filtered via `Telescope::filter()`
- [ ] Tags visible in Telescope dashboard filtering
- [ ] Custom watchers (if created) capture correct data
- [ ] Performance: - QueryWatcher (with call stacks): highest overhead â€” disable call stacks i...
- [ ] Performance: - Each enabled watcher adds proportional overhead
- [ ] Performance: - 18 watchers on page with 50 queries = ~68 entries/request

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Development: all 18 watchers enabled
- [ ] Architecture guideline: - Staging: selective (Exception, SlowQuery, Mail, FailedJob)
- [ ] Architecture guideline: - Production: minimal (Exception, SlowQuery > 100ms, FailedJob)
- [ ] Architecture guideline: - Custom watchers: extend `Watcher`, implement `register()`, register via `Telescope::watcher()`
- [ ] Architecture guideline: - Environment-specific configs via `config/telescope.php` with env variable overrides
- [ ] Decision: Which Watchers to Enable Per Environment? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Telescope Watchers

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - QueryWatcher (with call stacks): highest overhead â€” disable call stacks in production
- [ ] - Each enabled watcher adds proportional overhead
- [ ] - 18 watchers on page with 50 queries = ~68 entries/request
- [ ] - 10 req/s = ~680 writes/second to storage
- [ ] - Memory: 1-5MB peak per request with all watchers

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - RequestWatcher captures request bodies, headers, session data (passwords, tokens, PII)
- [ ] - DumpWatcher captures variable contents â€” dangerous in production
- [ ] - Use `Telescope::filter()` to scrub sensitive data
- [ ] - Secure dashboard with authorization gates

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
- [ ] All watchers enabled and capturing data in development
- [ ] Only Exception, SlowQuery, FailedJob enabled in production
- [ ] Watcher thresholds configured to filter noise
- [ ] Health check endpoints filtered via `Telescope::filter()`
- [ ] Tags visible in Telescope dashboard filtering
- [ ] Custom watchers (if created) capture correct data

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Full capture as default -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Ignoring request size limits -- apply preferred alternative
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
- Configure Telescope Watchers
### Decision Trees (from 07)
- Which Watchers to Enable Per Environment?
### Anti-Patterns (from 08)
- Full capture as default
- Ignoring request size limits
### Related Rules (from 06 skills)
- TELWATCH-RULE-001: Enable all watchers in development
- TELWATCH-RULE-002: Selective watchers in production
- TELWATCH-RULE-003: Configure watcher thresholds
- TELWATCH-RULE-004: Filter sensitive data
- TELWATCH-RULE-005: Custom watchers extend Watcher
### Related Skills (from 06 skills)
- Configure Laravel Telescope for Debugging
- Configure Debugbar Collectors for Selective Profiling
- Install and Configure Laravel Debugbar

