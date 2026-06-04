# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Database Testing
**Knowledge Unit:** Database Query Count Expectations
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Call `expectsDatabaseQueryCount()` before the act phase
- [ ] Apply rule: Use in every feature test that touches the database
- [ ] Apply rule: Document the expected query count with a comment
- [ ] Apply rule: Use zero-query expectations for cached endpoints
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `expectsDatabaseQueryCount()` called before the act phase
- [ ] Query budgets documented with explanatory comments
- [ ] Zero-query tests exist for cached endpoints
- [ ] Budgets updated deliberately when features change query patterns
- [ ] CI enforces query count expectations as blocking gate
- [ ] Avoid: Mistake
- [ ] Avoid: Placing expectation after the act phase
- [ ] Avoid: Not accounting for middleware queries

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **Exact count vs range**: Use exact count for deterministic endpoints. Use range for endpoints with variable query patterns.
- **Placement**: Call immediately before the act phase. Never after queries have already executed.
- **CI enforcement**: Make query count assertion failures blocking in CI. Budget increases require deliberate review.
- **Budget documentation**: Document expected query count near the test or in endpoint PHPDoc: `@query-count 5`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Call `expectsDatabaseQueryCount()` before the act phase
- [ ] Follow rule: Use in every feature test that touches the database
- [ ] Follow rule: Document the expected query count with a comment
- [ ] Follow rule: Use zero-query expectations for cached endpoints
- [ ] Follow rule: Review and update budgets deliberately during code review
- [ ] Follow rule: Establish middleware query baseline and account for it
- [ ] - [ ] `expectsDatabaseQueryCount()` called before the act phase
- [ ] - [ ] Query budgets documented with explanatory comments
- [ ] - [ ] Zero-query tests exist for cached endpoints
- [ ] - [ ] Budgets updated deliberately when features change query patterns

# Performance Checklist
- Expectation overhead: <0.1ms per test. Negligible.
- Query listing in failure output: Only triggers on failure. No impact on passing tests.
- Migration queries: NOT counted in per-test expectations (run once per process).
- Connection-specific counting: No additional overhead.

# Security Checklist
- Query count expectations don't have direct security implications.
- Zero-query expectations for cached endpoints can help verify that auth/session checks are also cached, preventing information disclosure.

# Reliability Checklist
- [ ] Ensure: Database query count expectations (`expectsDatabaseQueryCount()`) assert that sp...
- [ ] Verify: Call `expectsDatabaseQueryCount()` before the act phase
- [ ] Verify: Use in every feature test that touches the database
- [ ] Verify: Document the expected query count with a comment
- [ ] Verify: Use zero-query expectations for cached endpoints

# Testing Checklist
- [ ] `expectsDatabaseQueryCount()` called before the act phase
- [ ] Query budgets documented with explanatory comments
- [ ] Zero-query tests exist for cached endpoints
- [ ] Budgets updated deliberately when features change query patterns
- [ ] CI enforces query count expectations as blocking gate
- [ ] Middleware query baseline understood and accounted for
- [ ] Avoid: Mistake
- [ ] Avoid: Placing expectation after the act phase
- [ ] Avoid: Not accounting for middleware queries

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Call `expectsDatabaseQueryCount()` before the act phase
- [ ] Apply: Use in every feature test that touches the database
- [ ] Apply: Document the expected query count with a comment
- [ ] Apply: Use zero-query expectations for cached endpoints

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Placing expectation after the act phase
- [ ] Avoid mistake: Not accounting for middleware queries
- [ ] Avoid mistake: Using query count as proxy for performance
- [ ] Avoid mistake: Not updating budgets after feature changes

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Call `expectsDatabaseQueryCount()` before the act phase
- Use in every feature test that touches the database
- Document the expected query count with a comment
- Use zero-query expectations for cached endpoints
- Review and update budgets deliberately during code review
- Establish middleware query baseline and account for it
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Enforce Query Count Budgets with Expectations


