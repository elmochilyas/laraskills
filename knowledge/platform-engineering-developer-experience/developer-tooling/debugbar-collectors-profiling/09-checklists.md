# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** debugbar-collectors-profiling
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Debugbar visible in browser toolbar in local dev
- [ ] Query tab shows SQL with bindings and duration
- [ ] Only enabled collectors appear in the toolbar
- [ ] API routes do not include Debugbar injection
- [ ] Debugbar disabled in production (`DEBUGBAR_ENABLED=false`)
- [ ] Custom collectors display app-specific data correctly
- [ ] Performance: - Query collection: 0.1-0.5ms per query (100 queries = 10-50ms overhead)
- [ ] Performance: - Memory: 5-10MB additional for pages with 500 queries + large view data
- [ ] Performance: - Stack traces via `debug_backtrace()` are most expensive operation

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Register custom collectors via `Debugbar::addCollector()` or config `collectors` array
- [ ] Architecture guideline: - Disable Debugbar for non-HTML responses via middleware
- [ ] Architecture guideline: - Use `Debugbar::startMeasure()`/`stopMeasure()` for custom timing
- [ ] Architecture guideline: - Set `'capture_ajax' => false` in production/staging
- [ ] Decision: Which Collectors to Enable? - ensure correct choice is made
- [ ] Decision: Enable Stack Traces on Queries? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Configure Debugbar Collectors for Selective Profiling

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Query collection: 0.1-0.5ms per query (100 queries = 10-50ms overhead)
- [ ] - Memory: 5-10MB additional for pages with 500 queries + large view data
- [ ] - Stack traces via `debug_backtrace()` are most expensive operation
- [ ] - Response size inflation: 20-200KB added to HTML

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Debugbar exposes DB queries with values, session data, env config, app internals
- [ ] - Never enable in production or expose to non-admin users
- [ ] - Disable for API routes to prevent data leakage in JSON/XML responses

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
- [ ] Debugbar visible in browser toolbar in local dev
- [ ] Query tab shows SQL with bindings and duration
- [ ] Only enabled collectors appear in the toolbar
- [ ] API routes do not include Debugbar injection
- [ ] Debugbar disabled in production (`DEBUGBAR_ENABLED=false`)
- [ ] Custom collectors display app-specific data correctly

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Permanent Debugbar in staging -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Over-collecting -- apply preferred alternative
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
- Configure Debugbar Collectors for Selective Profiling
### Decision Trees (from 07)
- Which Collectors to Enable?
- Enable Stack Traces on Queries?
### Anti-Patterns (from 08)
- Permanent Debugbar in staging
- Over-collecting
### Related Rules (from 06 skills)
- DBGCOL-RULE-001: Disable in production
- DBGCOL-RULE-002: Disable for API routes
- DBGCOL-RULE-003: Selective collection
- DBGCOL-RULE-004: Limit stack trace depth
- DBGCOL-RULE-005: Custom collectors extend DataCollector
### Related Skills (from 06 skills)
- Install and Configure Laravel Debugbar
- Configure Laravel Telescope
- Debug with Log Viewer Patterns

