# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** Exception Handler Configuration
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use the Version-Appropriate Handler API
- [ ] Enforce: Always Configure dontReport for Expected Exceptions
- [ ] Enforce: Keep the Handler Simple — No Complex Dependencies
- [ ] Enforce: Separate Report and Render Pipelines
- [ ] Enforce: Always Configure shouldRenderJsonWhen for APIs
- [ ] Enforce: Add Global Context via context()
- [ ] Version-appropriate API is used (withExceptions for Laravel 11+, Handler for Laravel 10-)
- [ ] `dontReport` includes expected exceptions (validation, 404, auth, throttled)
- [ ] `shouldRenderJsonWhen` is configured with route prefix and Accept header checks
- [ ] Global context includes user_id, url, method, ip, request_id
- [ ] `renderable()` callbacks exist for all custom exception types
- [ ] Handler logic is simple with no complex dependencies
- [ ] Report and render pipelines are independent

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers
- [ ] Architecture guideline: Laravel 11+ uses `withExceptions()` in `bootstrap/app.php`
- [ ] Architecture guideline: Laravel 10- uses `App\Exceptions\Handler`
- [ ] Architecture guideline: Configure `dontReport` for expected exceptions
- [ ] Architecture guideline: Add global context via `context()` method
- [ ] Architecture guideline: Register `renderable()` for custom exception types
- [ ] Architecture guideline: Register `reportable()` for custom reporting logic
- [ ] Architecture guideline: Keep handler logic simple

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values — configuration is externalized
- [ ] Apply rule: Use the Version-Appropriate Handler API
- [ ] Apply rule: Always Configure dontReport
- [ ] Apply rule: Keep the Handler Simple
- [ ] Apply rule: Separate Report and Render Pipelines
- [ ] Apply rule: Always Configure shouldRenderJsonWhen
- [ ] Apply rule: Add Global Context via context()
- [ ] Skill applied: Configure the Exception Handler
- [ ] Skill applied: Set Up Exception Reporting and Logging

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured
- [ ] SQL injection vectors are eliminated
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent
- [ ] Files are organized by domain/feature
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Rules (from 05)
- Use the Version-Appropriate Handler API
- Always Configure dontReport for Expected Exceptions
- Keep the Handler Simple — No Complex Dependencies
- Separate Report and Render Pipelines
- Always Configure shouldRenderJsonWhen for APIs
- Add Global Context via context()
### Skills (from 06)
- Configure the Exception Handler
- Set Up Exception Reporting and Logging Configuration
