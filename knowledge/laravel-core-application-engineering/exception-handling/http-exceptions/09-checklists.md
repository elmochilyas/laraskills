# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Exception Handling
**Knowledge Unit:** HTTP Exception Rendering
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Enforce: Use abort() Instead of Returning Raw Error Responses from Controllers
- [ ] Enforce: Use abort_if() and abort_unless() for Conditional HTTP Errors
- [ ] Enforce: Customize Error Pages for at Minimum 403, 404, 429, 500, and 503
- [ ] Enforce: Never Include Stack Traces or Internal Details in Production Error Pages
- [ ] Enforce: Handle Inertia Error Rendering in the Exception Handler, Not in Controllers
- [ ] Enforce: Log 404s with the Requested URL for Broken Link Detection
- [ ] Enforce: Use Explicit Route Model Binding Instead of Manual findOrFail() Where Possible
- [ ] Enforce: Keep Error Page Views Simple and Free of Complex Logic
- [ ] Blade error views exist for at minimum 403, 404, 429, 500, 503
- [ ] Error pages use the application's layout for brand consistency
- [ ] Stack traces, file paths, and class names are never rendered
- [ ] Error pages include helpful navigation (home link, contact, search)
- [ ] Error pages contain no database queries or API calls
- [ ] Each error page has a corresponding view test
- [ ] 500 error page shows a generic message ("Something went wrong")
- [ ] Error pages are tested and render without exceptions

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - Customize at minimum `resources/views/errors/403.blade.php`, `404.blade.php`, `429.blade.php`, ...
- [ ] Architecture guideline: - Include helpful information on 404s (similar pages, search, home link)
- [ ] Architecture guideline: - Never expose stack traces on production error pages
- [ ] Architecture guideline: - Log 404s with the requested URL to detect broken links or attacks
- [ ] Architecture guideline: - Use `abort_if()` and `abort_unless()` for conditional HTTP errors
- [ ] Architecture guideline: - For Inertia apps, render error components via handler callbacks
- [ ] Decision: abort() vs Manual Response for HTTP Errors - ensure correct choice is made
- [ ] Decision: Custom Error Page vs renderable() Callback for HTTP Exceptions - ensure correct choice is made
- [ ] Decision: Forbidden (403) vs Not Found (404) for Access Control - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Apply rule: Use abort() Instead of Returning Raw Error Responses from Controllers
- [ ] Apply rule: Use abort_if() and abort_unless() for Conditional HTTP Errors
- [ ] Apply rule: Customize Error Pages for at Minimum 403, 404, 429, 500, and 503
- [ ] Apply rule: Never Include Stack Traces or Internal Details in Production Error Pages
- [ ] Apply rule: Handle Inertia Error Rendering in the Exception Handler, Not in Controllers
- [ ] Apply rule: Log 404s with the Requested URL for Broken Link Detection
- [ ] Apply rule: Use Explicit Route Model Binding Instead of Manual findOrFail() Where Possible
- [ ] Apply rule: Keep Error Page Views Simple and Free of Complex Logic
- [ ] Skill applied: Implement Custom HTTP Error Pages
- [ ] Skill applied: Implement Content-Negotiated HTTP Error Responses

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
- [ ] Blade error views exist for at minimum 403, 404, 429, 500, 503
- [ ] Error pages use the application's layout for brand consistency
- [ ] Stack traces, file paths, and class names are never rendered
- [ ] Error pages include helpful navigation (home link, contact, search)
- [ ] Error pages contain no database queries or API calls
- [ ] Each error page has a corresponding view test
- [ ] 500 error page shows a generic message ("Something went wrong")

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
- Use abort() Instead of Returning Raw Error Responses from Controllers
- Use abort_if() and abort_unless() for Conditional HTTP Errors
- Customize Error Pages for at Minimum 403, 404, 429, 500, and 503
- Never Include Stack Traces or Internal Details in Production Error Pages
- Handle Inertia Error Rendering in the Exception Handler, Not in Controllers
- Log 404s with the Requested URL for Broken Link Detection
- Use Explicit Route Model Binding Instead of Manual findOrFail() Where Possible
- Keep Error Page Views Simple and Free of Complex Logic
### Skills (from 06)
- Implement Custom HTTP Error Pages
- Implement Content-Negotiated HTTP Error Responses
### Decision Trees (from 07)
- abort() vs Manual Response for HTTP Errors
- Custom Error Page vs renderable() Callback for HTTP Exceptions
- Forbidden (403) vs Not Found (404) for Access Control
### Related Rules (from 06 skills)
- Use abort() Instead of Returning Raw Error Responses from Controllers
- Customize Error Pages for at Minimum 403, 404, 429, 500, and 503
- Never Include Stack Traces or Internal Details in Production Error Pages
- Keep Error Page Views Simple and Free of Complex Logic
- Log 404s with the Requested URL for Broken Link Detection
### Related Skills (from 06 skills)
- Write Exception Handler Tests (exception-testing)
- Implement Content-Negotiated HTTP Error Responses (this file, below)

