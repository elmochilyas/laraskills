# Metadata
**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Performance & Data Integrity
**Knowledge Unit:** Detection
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Development environment has Debugbar or Telescope installed
- [ ] Critical endpoints have query count test assertions
- [ ] CI/CD pipeline includes query count smoke tests
- [ ] Production monitoring includes request duration alerts
- [ ] Debugbar is explicitly disabled in production via `.env` or service provider
- [ ] Route-specific thresholds configured (not a single global cap)
- [ ] Seed data is deterministic for query count tests
- [ ] Performance: - Query log collection uses memory proportional to query count â€” for 1k+ qu...
- [ ] Performance: - Telescope's query deductor runs O(nÂ²) comparison â€” on requests with thou...
- [ ] Performance: - `assertQueryCountLessThan` adds negligible overhead (counts via an event li...

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Register a query count middleware in the `local` stack that logs warnings above threshold
- [ ] Architecture guideline: - Add `assertQueryCountLessThan()` assertions to smoke tests for critical endpoints
- [ ] Architecture guideline: - Configure Telescope with sampling in production to capture only slow/anomalous requests
- [ ] Architecture guideline: - Include query count in observability metrics (Datadog, New Relic, OpenTelemetry)
- [ ] Decision: N+1 Detection Tool Selection - ensure correct choice is made
- [ ] Decision: Query Count Threshold Strategy - ensure correct choice is made
- [ ] Decision: Detection in CI/CD Pipeline - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Detect N+1 Query Problems with Automated Tooling

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] - Query log collection uses memory proportional to query count â€” for 1k+ query requests, `DB::getQueryLog()` can co...
- [ ] - Telescope's query deductor runs O(nÂ²) comparison â€” on requests with thousands of queries, the deductor itself be...
- [ ] - `assertQueryCountLessThan` adds negligible overhead (counts via an event listener) and is safe for CI
- [ ] - APM-based detection (alerting on request duration) catches N+1 regressions without explicit query counting overhead

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged
- [ ] - Debugbar exposes database queries, schema, environment config â€” never enable in production
- [ ] - Telescope in production should use `Telescope::filter()` to avoid logging sensitive query data
- [ ] - Ensure query logs do not contain PII or credentials (e.g., password reset tokens in query bindings)

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
- [ ] Development environment has Debugbar or Telescope installed
- [ ] Critical endpoints have query count test assertions
- [ ] CI/CD pipeline includes query count smoke tests
- [ ] Production monitoring includes request duration alerts
- [ ] Debugbar is explicitly disabled in production via `.env` or service provider
- [ ] Route-specific thresholds configured (not a single global cap)
- [ ] Seed data is deterministic for query count tests

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] No anti-patterns or common mistakes documented for this KU

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
- Detect N+1 Query Problems with Automated Tooling
### Decision Trees (from 07)
- N+1 Detection Tool Selection
- Query Count Threshold Strategy
- Detection in CI/CD Pipeline
### Related Rules (from 06 skills)
- Enable N+1 Detection in Development (performance-and-integrity/detection)
- Set Route-Specific Query Count Thresholds (performance-and-integrity/detection)
- Use Deterministic Seed Data for Query Count Tests (performance-and-integrity/detection)
- Never Deploy Debugbar to Production (performance-and-integrity/detection)
- Combine Automated Tests with Production Monitoring (performance-and-integrity/detection)
### Related Skills (from 06 skills)
- Prevent N+1 with Eager Loading Strategies
- Enforce Lazy Loading Violations with Strict Mode
- Implement Query Count Middleware

