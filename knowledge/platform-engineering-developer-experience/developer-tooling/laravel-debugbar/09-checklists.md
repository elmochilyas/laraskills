# Metadata
**Domain:** platform-engineering-developer-experience
**Subdomain:** developer-tooling-debugging
**Knowledge Unit:** laravel-debugbar
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Debugbar toolbar visible in browser on local dev pages
- [ ] Query tab shows SQL queries with bindings and duration
- [ ] Route/request details display correctly
- [ ] Mail tab shows captured email previews
- [ ] All collector tabs toggle correctly
- [ ] Debugbar NOT visible in production
- [ ] API routes do not include toolbar injection
- [ ] Performance: - Query capture: 0.1-0.5ms per query (500 queries = 50-250ms overhead)
- [ ] Performance: - Memory: 5-10MB additional for pages with many queries/large view data
- [ ] Performance: - Response size: 20-200KB added to HTML

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Register as middleware at end of stack for full request lifecycle capture
- [ ] Architecture guideline: - Disable for non-HTML responses (JSON, XML, file downloads, streamed responses)
- [ ] Architecture guideline: - Use `Debugbar::startMeasure()`/`stopMeasure()` for custom code section profiling
- [ ] Architecture guideline: - Clear Debugbar data on redirect to avoid memory accumulation
- [ ] Decision: Debugbar vs Telescope for Development? - ensure correct choice is made
- [ ] Decision: Enable Debugbar in Staging? - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Install and Configure Laravel Debugbar

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Query capture: 0.1-0.5ms per query (500 queries = 50-250ms overhead)
- [ ] - Memory: 5-10MB additional for pages with many queries/large view data
- [ ] - Response size: 20-200KB added to HTML
- [ ] - AJAX debugging adds ~5ms per request overhead

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
- [ ] Debugbar toolbar visible in browser on local dev pages
- [ ] Query tab shows SQL queries with bindings and duration
- [ ] Route/request details display correctly
- [ ] Mail tab shows captured email previews
- [ ] All collector tabs toggle correctly
- [ ] Debugbar NOT visible in production
- [ ] API routes do not include toolbar injection

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Permanent full capture -- apply preferred alternative
    - [ ] Automated checks detect this pattern
    - [ ] CI pipeline includes relevant checks
    - [ ] Code review guidelines mention this pattern
- [ ] Prevent: Debugbar as primary debugging tool for complex issues -- apply preferred alternative
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
- Install and Configure Laravel Debugbar
### Decision Trees (from 07)
- Debugbar vs Telescope for Development?
- Enable Debugbar in Staging?
### Anti-Patterns (from 08)
- Permanent full capture
- Debugbar as primary debugging tool for complex issues
### Related Rules (from 06 skills)
- DBG-RULE-001: Disable in production
- DBG-RULE-002: Disable for API routes
- DBG-RULE-003: Use IP whitelisting
- DBG-RULE-004: Avoid during performance testing
### Related Skills (from 06 skills)
- Configure Debugbar Collectors for Selective Profiling
- Configure Laravel Telescope for Debugging
- Configure Laravel Pulse for Monitoring

