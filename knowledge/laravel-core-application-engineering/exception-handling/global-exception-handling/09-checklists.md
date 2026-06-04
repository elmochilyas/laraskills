# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Production vs Debug Display
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Never Run Production with APP_DEBUG=true
- [ ] Enforce: Use Environment-Specific Error Pages â€” Detailed in Local, Generic in Production
- [ ] Enforce: Register a Catch-All renderable() for Throwable in Production
- [ ] Enforce: Filter Expected Exceptions from ERROR-Level Reporting
- [ ] Enforce: Set Appropriate Log Levels per Exception Type Using the $levels Property
- [ ] Enforce: Add Global Context via context() to Every Exception Report
- [ ] Enforce: Keep Handler Logic Simple and Free of Complex Dependencies
- [ ] Enforce: Render Inertia Error Components via the Handler, Not in Controllers
- [ ] `APP_DEBUG=false` in production `.env`
- [ ] `APP_DEBUG=true` in local `.env`
- [ ] API error messages are generic in production (no `$e->getMessage()` leaked for 500s)
- [ ] API error messages are detailed in local environment
- [ ] Catch-all `renderable()` for `Throwable` exists in production
- [ ] Expected exceptions are filtered from ERROR-level reporting
- [ ] Global context is configured via `context()` method
- [ ] Handler logic is simple with no complex dependencies

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Configure `shouldRenderJsonWhen` for API routes to ensure JSON error responses
- [ ] Architecture guideline: - Never report expected exceptions (validation errors, 404s) at ERROR level
- [ ] Architecture guideline: - Add global context (user ID, request ID) to all exception reports
- [ ] Architecture guideline: - Test exception handler behavior with integration tests for each request type
- [ ] Architecture guideline: - Use environment-specific error pages: detailed in local, branded in production
- [ ] Architecture guideline: - Log exceptions with structured format (JSON) for log aggregation

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Never Run Production with APP_DEBUG=true
- [ ] Apply rule: Use Environment-Specific Error Pages â€” Detailed in Local, Generic in Production
- [ ] Apply rule: Register a Catch-All renderable() for Throwable in Production
- [ ] Apply rule: Filter Expected Exceptions from ERROR-Level Reporting
- [ ] Apply rule: Set Appropriate Log Levels per Exception Type Using the $levels Property
- [ ] Apply rule: Add Global Context via context() to Every Exception Report
- [ ] Apply rule: Keep Handler Logic Simple and Free of Complex Dependencies
- [ ] Apply rule: Render Inertia Error Components via the Handler, Not in Controllers
- [ ] Skill applied: Configure Environment-Specific Exception Handling

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

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
- [ ] `APP_DEBUG=false` in production `.env`
- [ ] `APP_DEBUG=true` in local `.env`
- [ ] API error messages are generic in production (no `$e->getMessage()` leaked for 500s)
- [ ] API error messages are detailed in local environment
- [ ] Catch-all `renderable()` for `Throwable` exists in production
- [ ] Expected exceptions are filtered from ERROR-level reporting
- [ ] Global context is configured via `context()` method

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
### Rules (from 05)
- Never Run Production with APP_DEBUG=true
- Use Environment-Specific Error Pages â€” Detailed in Local, Generic in Production
- Register a Catch-All renderable() for Throwable in Production
- Filter Expected Exceptions from ERROR-Level Reporting
- Set Appropriate Log Levels per Exception Type Using the $levels Property
- Add Global Context via context() to Every Exception Report
- Keep Handler Logic Simple and Free of Complex Dependencies
- Render Inertia Error Components via the Handler, Not in Controllers
### Skills (from 06)
- Configure Environment-Specific Exception Handling
### Related Rules (from 06 skills)
- Never Run Production with APP_DEBUG=true
- Use Environment-Specific Error Pages â€” Detailed in Local, Generic in Production
- Register a Catch-All renderable() for Throwable in Production
- Filter Expected Exceptions from ERROR-Level Reporting
- Set Appropriate Log Levels per Exception Type Using the $levels Property
- Add Global Context via context() to Every Exception Report
- Keep Handler Logic Simple and Free of Complex Dependencies
### Related Skills (from 06 skills)
- Configure the Exception Handler (exception-fundamentals)
- Configure Production Logging and Error Tracking (exception-logging-reporting)

