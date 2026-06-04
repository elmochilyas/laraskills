# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Pagination Information Customization
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Pagination Information Customization implementation follows response-structures patterns
- [ ] All edge cases handled for Pagination Information Customization
- [ ] Full test coverage for Pagination Information Customization
- [ ] Security review completed for Pagination Information Customization
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Pagination Information Customization
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Place the base `paginationInformation()` override in `App\Http\Resources\BaseCollection` extended by all resource collections.
- [ ] Transform the paginator array immutably â€” never modify the paginator object inside `paginationInformation()`.
- [ ] For version-conditional metadata, check `$request->header('Accept')` inside `paginationInformation()` rather than duplicating entire resource collections.
- [ ] Document the customized metadata shape in OpenAPI using the custom field names, not the default paginator names.
- [ ] Write explicit tests for `paginationInformation()` output for each paginator type â€” subtle bugs break all paginated endpoints.
- [ ] Evaluate: Customization Scope: Global vs Per-Endpoint
- [ ] Evaluate: Paginator Type Handling
- [ ] Evaluate: Field Renaming Strategy

---

# Implementation Checklist

- [ ] `data` key is preserved in its expected structure
- [ ] Custom meta fields are documented and predictable
- [ ] Renamed keys are communicated to API consumers
- [ ] Different endpoints can have different metadata if needed (per-resource customization)
- [ ] `paginationInformation()` returns both `meta` and `links` arrays
- [ ] Custom fields include context (filter summary, sort state) where useful
- [ ] Null/missing values are handled consistently in custom fields
- [ ] Default pagination metadata is preserved for backward compatibility when possible
- [ ] Implement Pagination Information Customization following response-structures patterns
- [ ] Configure all required settings for Pagination Information Customization
- [ ] Register route/middleware/service for Pagination Information Customization
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] `paginationInformation()` operates on the already-serialized paginator array â€” overhead is negligible (sub-millisecond).
- [ ] Stripping `from`, `to`, and `path` saves ~50-80 bytes per response, which compounds at scale.
- [ ] Complex conditional chains inside `paginationInformation()` remain in the sub-millisecond range.
- [ ] If `paginationInformation()` uses request data to conditionally include fields, cached responses must vary by those request parameters, fragmenting the cache.

---

# Security Checklist

- [ ] Never expose raw cursor values or internal paginator state through custom metadata.
- [ ] Conditional metadata inclusion based on user roles must be consistent with authorization policies.
- [ ] Stripping metadata fields reduces information leakage about dataset size and structure.
- [ ] Custom links should use HTTPS URLs and validated route names to prevent host injection.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] A single base collection class centralizes all `paginationInformation()` overrides â€” no per-collection customization without justification.
- [ ] `paginationInformation()` output matches the documented API contract (OpenAPI schema).
- [ ] Both `LengthAwarePaginator` and `CursorPaginator` paths are tested.
- [ ] Returning camelCase pagination metadata when the API uses camelCase for resource fields.
- [ ] Field renames use dual-emit strategy for one version before removing old field names.
- [ ] Integration tests assert the customized metadata shape, not the default paginator output.
- [ ] Write feature tests for happy path of Pagination Information Customization
- [ ] Write feature tests for validation failure of Pagination Information Customization
- [ ] Write feature tests for authentication failure of Pagination Information Customization
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

- [ ] Avoid: Inconsistent Customization Across Endpoints
- [ ] Avoid: Removing Critical Pagination Fields
- [ ] Avoid: Over-customizing Pagination Output
- [ ] Avoid: No Pagination Customization Convention
- [ ] Avoid: Breaking Change to Pagination Shape

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
- Rule 1: Centralize `paginationInformation()` in a Base Collection Class
- Rule 2: Always Check Paginator Type Before Accessing Type-Specific Fields
- Rule 3: Always Return an Array from `paginationInformation()`
- Rule 4: Never Mutate the Paginator Object Inside `paginationInformation()`
- Rule 5: Match Pagination Field Naming to the API's Existing Convention
- Rule 6: Dual-Emit Renamed Pagination Fields for One Version

### Decisions
- Customization Scope: Global vs Per-Endpoint
- Paginator Type Handling
- Field Renaming Strategy

### Anti-Patterns
- Inconsistent Customization Across Endpoints
- Removing Critical Pagination Fields
- Over-customizing Pagination Output
- No Pagination Customization Convention
- Breaking Change to Pagination Shape

## Related Knowledge
- Prerequisites
- Related
- Advanced



