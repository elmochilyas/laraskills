# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Response Transformation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] X-Frame-Options set to `SAMEORIGIN` or `DENY` â€” prevents clickjacking
- [ ] X-Content-Type-Options set to `nosniff` â€” prevents MIME sniffing
- [ ] Referrer-Policy set â€” controls referrer header leakage
- [ ] HSTS only set in production â€” not in development environments
- [ ] CSP starts in report-only mode before enforcement
- [ ] Error responses (404, 500) from exception handler also include security headers
- [ ] Response type checked before content modification (if modifying body)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Middleware execution order:** Response transformation middleware runs in reverse pipeline ord...
- [ ] Architecture guideline: - **Security headers in middleware vs web server:** nginx adds headers for static assets. Laravel...
- [ ] Architecture guideline: - **Cache headers location:** Route-level via `->middleware('cache.headers:public;max_age=3600')`...
- [ ] Architecture guideline: - **JSON envelope:** Apply only to the `api` group, not globally. Web routes returning HTML do no...
- [ ] Architecture guideline: - **HandleCors:** Both request transformation (intercepts OPTIONS) and response transformation (a...
- [ ] Architecture guideline: - **ETag generation:** Reads full response content into memory for MD5 hashing. For large respons...
- [ ] Decision: Security Headers in Middleware vs Web Server - ensure correct choice is made
- [ ] Decision: Global vs Route-Group Response Transformation - ensure correct choice is made
- [ ] Decision: ETag Cache Headers vs Manual Cache Control - ensure correct choice is made
- [ ] Decision: JSON Envelope Middleware vs Per-Controller Response Formatting - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement a Response Transformation Middleware for Security Headers
- [ ] Skill applied: Implement a JSON Envelope Middleware for API Routes

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
- [ ] X-Frame-Options set to `SAMEORIGIN` or `DENY` â€” prevents clickjacking
- [ ] X-Content-Type-Options set to `nosniff` â€” prevents MIME sniffing
- [ ] Referrer-Policy set â€” controls referrer header leakage
- [ ] HSTS only set in production â€” not in development environments
- [ ] CSP starts in report-only mode before enforcement
- [ ] Error responses (404, 500) from exception handler also include security headers
- [ ] Response type checked before content modification (if modifying body)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Cache Poisoning via Shared Cache -- apply preferred alternative
    - [ ] No `Cache-Control: public` on authenticated routes
    - [ ] Authenticated responses use `private` cache directive
    - [ ] CDN/Varnish does not cache authenticated responses
- [ ] Prevent: Global JSON Envelope Middleware -- apply preferred alternative
    - [ ] JSON envelope middleware is in the `api` group, not globally
    - [ ] Web routes return HTML, not JSON
    - [ ] File downloads have correct Content-Type
- [ ] Prevent: HSTS Enabled in Development Environment -- apply preferred alternative
    - [ ] HSTS header is only set in production environment
    - [ ] Development environment does not include HSTS
    - [ ] Browser's HSTS cache does not block local development
- [ ] Prevent: Missing Security Headers on Error Responses -- apply preferred alternative
    - [ ] Error responses (404, 500, 403) include security headers
    - [ ] Exception handler adds security headers to error responses
    - [ ] Security audit includes error response header testing
- [ ] Prevent: Content Modification of Streamed Responses -- apply preferred alternative
    - [ ] Content modification is guarded by `instanceof` response type checks
    - [ ] `BinaryFileResponse` and `StreamedResponse` are not modified
    - [ ] File downloads work correctly with response middleware enabled

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
- Implement a Response Transformation Middleware for Security Headers
- Implement a JSON Envelope Middleware for API Routes
### Decision Trees (from 07)
- Security Headers in Middleware vs Web Server
- Global vs Route-Group Response Transformation
- ETag Cache Headers vs Manual Cache Control
- JSON Envelope Middleware vs Per-Controller Response Formatting
### Anti-Patterns (from 08)
- Cache Poisoning via Shared Cache
- Global JSON Envelope Middleware
- HSTS Enabled in Development Environment
- Missing Security Headers on Error Responses
- Content Modification of Streamed Responses
### Related Rules (from 06 skills)
- Add Security Headers in Middleware, Not in Controllers (response-transformation:5)
- Check Response Type Before Modifying Content (response-transformation:5)
- Test CSP in Report-Only Mode Before Enforcing (response-transformation:5)
- Do Not Set HSTS in Development Environments (response-transformation:5)
- Add Security Headers to Exception Handler Error Responses (response-transformation:5)
### Related Skills (from 06 skills)
- Configure TrustedProxies and CORS Correctly
- Implement a JSON Envelope Middleware for API Routes

