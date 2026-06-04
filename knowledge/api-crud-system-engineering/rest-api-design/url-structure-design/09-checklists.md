# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** URL Structure Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] URL Structure Design implementation follows rest-api-design patterns
- [ ] All edge cases handled for URL Structure Design
- [ ] Full test coverage for URL Structure Design
- [ ] Security review completed for URL Structure Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for URL Structure Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Laravel route group prefixing supports versioning: `Route::prefix('v1')->group(...)`.
- [ ] Use route model binding with custom keys for non-ID identifiers: `Route::get('users/{user:slug}', ...)`.
- [ ] Normalize URLs to lowercase â€” enforce via middleware. `/Users/42` should redirect to `/users/42`.
- [ ] Choose a trailing slash policy and enforce it â€” `/users/` vs `/users`. Redirect the non-canonical form.
- [ ] Deprecated URLs should continue working with `Deprecation` header â€” don't break old URLs without migration period.
- [ ] Use `php artisan route:cache` for versioned route groups â€” registration time doubles with each version.

---

# Implementation Checklist

- [ ] Base URL is `/api/`
- [ ] Plural kebab-case for collections
- [ ] Nesting â‰¤ 3 levels
- [ ] Actions via POST with action name in path
- [ ] Query parameters for filter/sort/include
- [ ] No file extensions
- [ ] Consistent parameter naming
- [ ] `apiResource()` for CRUD routes
- [ ] Implement URL Structure Design following rest-api-design patterns
- [ ] Configure all required settings for URL Structure Design
- [ ] Register route/middleware/service for URL Structure Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] URLs over 2,048 characters may be truncated by proxies/CDNs. Keep paths short and queries efficient.
- [ ] Integer IDs are fastest for database lookups and smallest indexes. UUIDs are 4x larger with slower index performance.
- [ ] Route parameter binding adds one DB query per nesting level for implicit binding â€” shallow nesting reduces query count.
- [ ] Route caching (`php artisan route:cache`) mitigates registration overhead from versioned route groups.

---

# Security Checklist

- [ ] Auto-increment IDs in URLs expose record count, growth rate, and enable sequential enumeration â€” use UUIDs or hashids for public APIs.
- [ ] Slugs can change â€” maintain slug history or redirect old URLs to prevent dead links.
- [ ] UUID case sensitivity: normalize to lowercase in route bindings â€” uppercase vs lowercase UUIDs should resolve to the same resource.
- [ ] Never expose internal identifiers (database primary keys) directly in URLs for public APIs.
- [ ] Query parameters that enable data filtering must respect authorization â€” a user should not be able to filter by fields they shouldn't access.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All URLs use lowercase with no mixed casing.
- [ ] Nesting depth does not exceed 3 levels.
- [ ] Identifier type is consistent across all resources.
- [ ] No verbs appear in URL paths.
- [ ] Trailing slash policy is consistent (enforced via redirect).
- [ ] Query parameter conventions are uniform across all endpoints.
- [ ] Versioning strategy is consistent (path prefix or header â€” not both).
- [ ] Deprecated URLs include `Deprecation` header and continue working during migration.
- [ ] Route caching is enabled for versioned route groups.
- [ ] Write feature tests for happy path of URL Structure Design
- [ ] Write feature tests for validation failure of URL Structure Design
- [ ] Write feature tests for authentication failure of URL Structure Design
- [ ] Write unit tests for service/action/DTO classes
- [ ] Test edge cases: empty results, boundary values, null inputs

---

# Maintainability Checklist

- [ ] Follow PSR-12 coding standards
- [ ] Use type hints on all methods and properties
- [ ] Keep methods under 15 lines
- [ ] Use meaningful class and method names
- [ ] Add PHPDoc for public API methods

---

# Anti-Pattern Prevention Checklist

- [ ] Avoid: Deep Nesting
- [ ] Avoid: Inconsistent Identifier Strategy
- [ ] Avoid: Unnecessary Prefixes
- [ ] Avoid: Verbs in Paths
- [ ] Avoid: Mutable Identifiers

---

# Production Readiness Checklist

- [ ] Add structured logging for all operations
- [ ] Configure monitoring alerts for error rate spikes
- [ ] Implement health check endpoint
- [ ] Document rollback procedure
- [ ] Set up error tracking integration
- [ ] Configure proper CORS for production

---

# Final Approval Checklist

- [ ] Architecture checklist complete
- [ ] Security checklist complete
- [ ] Performance checklist complete
- [ ] Testing checklist complete
- [ ] Anti-pattern prevention checklist complete
- [ ] Production readiness checklist complete
- [ ] All items resolved before merge

---

# Related Knowledge

### Rules
- Design URLs For Permanence
- Use UUIDs For Public API Identifiers
- Limit Nesting To 2-3 Levels
- Use Path Prefix For Major API Versions
- Standardize Query Parameter Conventions
- Normalize URLs To Lowercase
- Enforce A Trailing Slash Policy
- Keep Deprecated URLs Working With Deprecation Header
- Never Use Mutable Identifiers In URLs
- Remove Unnecessary Path Segments

### Anti-Patterns
- Deep Nesting
- Inconsistent Identifier Strategy
- Unnecessary Prefixes
- Verbs in Paths
- Mutable Identifiers

## Related Knowledge
- Prerequisites
- Related
- Advanced



