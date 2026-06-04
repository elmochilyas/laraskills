# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Request Transformation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Data stored via `$request->attributes->set()` â€” NOT `$request->merge()`
- [ ] Keys are namespaced to prevent collisions (e.g., `'tenant.id'`, `'request.trace_id'`)
- [ ] Expensive lookups are cached with appropriate TTL
- [ ] Downstream controllers read via `$request->attributes->get('key')` â€” not `$request->input()`
- [ ] Middleware handles the case where resolution fails (tenant not found, invalid header)

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **TrustedProxies:** Global middleware. Configures Symfony Request trusted proxy settings. Affec...
- [ ] Architecture guideline: - **HandleCors:** Global middleware. Intercepts OPTIONS preflight, adds CORS headers to responses.
- [ ] Architecture guideline: - **Input sanitization (TrimStrings, ConvertEmptyStringsToNull):** Global middleware. Uses `$requ...
- [ ] Architecture guideline: - **Request enrichment:** Uses `$request->attributes->set('key', $value)`. Values accessible via ...
- [ ] Architecture guideline: - **Global transformations:** TrustedProxies, HandleCors, TrimStrings, ConvertEmptyStringsToNull,...
- [ ] Architecture guideline: - **Group transformations:** Tenant resolution, Locale detection, Force JSON.
- [ ] Architecture guideline: - **Octane safety:** `$request->attributes` is per-request â€” does not persist across requests. ...
- [ ] Decision: Attributes vs Input for Middleware-Set Data - ensure correct choice is made
- [ ] Decision: Global vs Group Request Transformation - ensure correct choice is made
- [ ] Decision: TrustedProxies Configuration (Specific IPs vs Wildcard) - ensure correct choice is made
- [ ] Decision: Request Transformation vs Form Request for Input Sanitization - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement a Request Transformation Middleware for Request Enrichment
- [ ] Skill applied: Configure TrustedProxies and CORS Correctly

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
- [ ] Data stored via `$request->attributes->set()` â€” NOT `$request->merge()`
- [ ] Keys are namespaced to prevent collisions (e.g., `'tenant.id'`, `'request.trace_id'`)
- [ ] Expensive lookups are cached with appropriate TTL
- [ ] Downstream controllers read via `$request->attributes->get('key')` â€” not `$request->input()`
- [ ] Middleware handles the case where resolution fails (tenant not found, invalid header)

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Using `$request->merge()` for Non-Sanitization Data -- apply preferred alternative
    - [ ] No `$request->merge()` for middleware-resolved data
    - [ ] Middleware uses `$request->attributes->set()` for server-added data
    - [ ] `$request->all()` returns only client-supplied input
- [ ] Prevent: Global Middleware for Tenant Resolution -- apply preferred alternative
    - [ ] Tenant resolution middleware is on route groups, not global
    - [ ] Health checks do not trigger tenant lookup
    - [ ] 404 pages do not trigger tenant lookup
- [ ] Prevent: TrustedProxies Not Configured Behind a Load Balancer -- apply preferred alternative
    - [ ] TrustedProxies is configured for the production proxy environment
    - [ ] `$request->ip()` returns the real client IP in production
    - [ ] `$request->getScheme()` returns `https` for HTTPS-terminated traffic
- [ ] Prevent: Attribute Namespace Collisions -- apply preferred alternative
    - [ ] No generic attribute keys (`'id'`, `'key'`, `'type'`) in middleware
    - [ ] Attribute keys are namespaced (prefixed by component or domain)
    - [ ] Two middleware never use the same key for different data
- [ ] Prevent: Not Handling CORS for OPTIONS Preflight Requests -- apply preferred alternative
    - [ ] `HandleCors` middleware is registered globally
    - [ ] OPTIONS preflight requests return 200/204 with CORS headers
    - [ ] Cross-origin API calls work in browser-based clients

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
- Implement a Request Transformation Middleware for Request Enrichment
- Configure TrustedProxies and CORS Correctly
### Decision Trees (from 07)
- Attributes vs Input for Middleware-Set Data
- Global vs Group Request Transformation
- TrustedProxies Configuration (Specific IPs vs Wildcard)
- Request Transformation vs Form Request for Input Sanitization
### Anti-Patterns (from 08)
- Using `$request->merge()` for Non-Sanitization Data
- Global Middleware for Tenant Resolution
- TrustedProxies Not Configured Behind a Load Balancer
- Attribute Namespace Collisions
- Not Handling CORS for OPTIONS Preflight Requests
### Related Rules (from 06 skills)
- Use $request->attributes for Resolved Data, $request->merge Only for Sanitization (request-transformation:5)
- Cache Expensive Request Transformations (request-transformation:5)
- Use Namespaced Keys in Request Attributes to Prevent Collisions (request-transformation:5)
- Use $request->attributes->set() for Middleware-to-Controller Communication (custom-middleware:5)
### Related Skills (from 06 skills)
- Configure TrustedProxies and CORS Correctly
- Implement a Response Transformation Middleware for Security Headers

