# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Handler Configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Centralize All Exception Handling in the Handler, Never in Controllers
- [ ] Enforce: Keep the Exception Handler Simple â€” No Complex Dependencies
- [ ] Enforce: Always Configure dontReport for Expected Exceptions
- [ ] Enforce: Always Configure shouldRenderJsonWhen for Applications with API Routes
- [ ] Enforce: Separate Report and Render Pipelines â€” Never Couple Logging to Response Generation
- [ ] Enforce: Use withExceptions() for Laravel 11+, Handler Class for Laravel 10-
- [ ] Enforce: Add Global Context via context() for All Exception Reports
- [ ] Version-appropriate API is used (`withExceptions()` for Laravel 11+, `Handler` class for Laravel 10-)
- [ ] `dontReport` includes expected exceptions (validation, 404, auth, throttled)
- [ ] `shouldRenderJsonWhen` is configured with route prefix and Accept header checks
- [ ] Global context via `context()` includes user_id, url, method, ip, request_id
- [ ] `renderable()` callbacks exist for all custom exception types
- [ ] Handler logic is simple with no complex dependencies
- [ ] Report and render pipelines are independent (no logging in renderable, no rendering in reportable)
- [ ] The two patterns are not mixed (no Handler class in Laravel 11+ unless during upgrade)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Laravel 11+: use `withExceptions()` in `bootstrap/app.php`
- [ ] Architecture guideline: - Laravel 10-: use `App\Exceptions\Handler` with `register()` method
- [ ] Architecture guideline: - Configure `dontReport` for expected exceptions (validation, 404, auth)
- [ ] Architecture guideline: - Add global context via `context()` method on the Handler
- [ ] Architecture guideline: - Register `renderable()` callbacks for custom exception types
- [ ] Architecture guideline: - Register `reportable()` callbacks for custom reporting logic
- [ ] Architecture guideline: - Keep handler logic simple â€” avoid dependencies that might fail

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Centralize All Exception Handling in the Handler, Never in Controllers
- [ ] Apply rule: Keep the Exception Handler Simple â€” No Complex Dependencies
- [ ] Apply rule: Always Configure dontReport for Expected Exceptions
- [ ] Apply rule: Always Configure shouldRenderJsonWhen for Applications with API Routes
- [ ] Apply rule: Separate Report and Render Pipelines â€” Never Couple Logging to Response Generation
- [ ] Apply rule: Use withExceptions() for Laravel 11+, Handler Class for Laravel 10-
- [ ] Apply rule: Add Global Context via context() for All Exception Reports
- [ ] Skill applied: Configure the Exception Handler
- [ ] Skill applied: Set Up Exception Reporting and Logging Configuration

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
- [ ] Version-appropriate API is used (`withExceptions()` for Laravel 11+, `Handler` class for Laravel 10-)
- [ ] `dontReport` includes expected exceptions (validation, 404, auth, throttled)
- [ ] `shouldRenderJsonWhen` is configured with route prefix and Accept header checks
- [ ] Global context via `context()` includes user_id, url, method, ip, request_id
- [ ] `renderable()` callbacks exist for all custom exception types
- [ ] Handler logic is simple with no complex dependencies
- [ ] Report and render pipelines are independent (no logging in renderable, no rendering in reportable)

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
- Centralize All Exception Handling in the Handler, Never in Controllers
- Keep the Exception Handler Simple â€” No Complex Dependencies
- Always Configure dontReport for Expected Exceptions
- Always Configure shouldRenderJsonWhen for Applications with API Routes
- Separate Report and Render Pipelines â€” Never Couple Logging to Response Generation
- Use withExceptions() for Laravel 11+, Handler Class for Laravel 10-
- Add Global Context via context() for All Exception Reports
### Skills (from 06)
- Configure the Exception Handler
- Set Up Exception Reporting and Logging Configuration
### Related Rules (from 06 skills)
- Centralize All Exception Handling in the Handler, Never in Controllers
- Keep the Exception Handler Simple â€” No Complex Dependencies
- Always Configure dontReport for Expected Exceptions
- Always Configure shouldRenderJsonWhen for Applications with API Routes
- Separate Report and Render Pipelines â€” Never Couple Logging to Response Generation
- Use withExceptions() for Laravel 11+, Handler Class for Laravel 10-
- Add Global Context via context() for All Exception Reports
### Related Skills (from 06 skills)
- Configure Global API Error Handler (api-exception-handling)
- Configure Production Logging and Error Tracking (exception-logging-reporting)
- Register Custom Exception Rendering and Reporting (custom-exception-classes)

