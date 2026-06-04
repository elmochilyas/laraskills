# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** rest-api-design
**Knowledge Unit:** Resource Naming Conventions
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Resource Naming Conventions implementation follows rest-api-design patterns
- [ ] All edge cases handled for Resource Naming Conventions
- [ ] Full test coverage for Resource Naming Conventions
- [ ] Security review completed for Resource Naming Conventions
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Resource Naming Conventions
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Use `Route::apiResource()` for CRUD endpoints â€” it follows standard naming conventions automatically.
- [ ] Customize route parameter names for irregular plurals: `Str::singular('series')` returns `'serie'` â€” use `parameters()` to fix.
- [ ] For kebab-case resource names like `order-items`, Laravel generates parameter `order_item`. Ensure controllers use the correct parameter name.
- [ ] Use route model binding with custom keys: `Route::get('users/{user:slug}', ...)` to bind by slug instead of ID.
- [ ] When renaming a resource, use a dual-path migration period: support both old and new URIs for one version.

---

# Implementation Checklist

- [ ] All collection endpoints use plural nouns
- [ ] All URI segments use kebab-case consistently
- [ ] No verbs in URI paths
- [ ] Nesting does not exceed 3 levels
- [ ] Filtering/sorting via query parameters, not path segments
- [ ] Singleton resources use singular names
- [ ] Identifier type is consistent across all resources
- [ ] Irregular plurals handled with explicit `parameters()`
- [ ] Route model binding used for custom keys
- [ ] No `create` or `edit` routes in API
- [ ] Implement Resource Naming Conventions following rest-api-design patterns
- [ ] Configure all required settings for Resource Naming Conventions
- [ ] Register route/middleware/service for Resource Naming Conventions
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] URI length beyond 2,048 characters may be truncated by proxies/CDNs â€” keep paths short.
- [ ] Route parameter binding adds one database query per nesting level for implicit binding. Shallow nesting reduces query count.
- [ ] Case-insensitive URI matching requires normalization â€” enforce lowercase to prevent cache splits (`/Users/42` vs `/users/42` producing different cache entries).
- [ ] `php artisan route:cache` optimizes route registration regardless of naming convention.

---

# Security Checklist

- [ ] Never expose database column names or internal table names as resource names.
- [ ] Auto-increment IDs in URLs expose record count and growth rate â€” use UUIDs or hashids for public APIs.
- [ ] Slug-based resources can change â€” ensure slug changes redirect old URLs or maintain slug history.
- [ ] Case-insensitive comparison of identifiers can cause collisions â€” normalize to lowercase.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All collection endpoints use plural nouns (`/users`, `/orders`).
- [ ] All URI segments use kebab-case consistently.
- [ ] No verbs appear in URI paths (HTTP methods are sufficient).
- [ ] Nesting depth does not exceed 3 levels.
- [ ] Singleton resources use singular names (`/profile`, `/settings`).
- [ ] Identifier type is consistent across all resources.
- [ ] `create` and `edit` routes are not present in API routes (using `apiResource`).
- [ ] Write feature tests for happy path of Resource Naming Conventions
- [ ] Write feature tests for validation failure of Resource Naming Conventions
- [ ] Write feature tests for authentication failure of Resource Naming Conventions
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

- [ ] Avoid: Verbs in URIs
- [ ] Avoid: Deep Nesting
- [ ] Avoid: Mixed Casing
- [ ] Avoid: Database Names as API
- [ ] Avoid: Auto-Increment in Public URLs

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
- Use Plural Nouns For Collection Endpoints
- Use kebab-case For All URI Path Segments
- Limit Nesting To 2-3 Levels Maximum
- Never Use Verbs In URI Paths
- Standardize On One Identifier Type Across The API
- Use Route Model Binding With Custom Keys For Non-ID Resources
- Use Query Parameters For Filtering, Sorting, And Includes
- Handle Irregular Pluralization Explicitly
- Avoid Inconsistent Pluralization Across Resources

### Anti-Patterns
- Verbs in URIs
- Deep Nesting
- Mixed Casing
- Database Names as API
- Auto-Increment in Public URLs

## Related Knowledge
- Prerequisites
- Related
- Advanced



