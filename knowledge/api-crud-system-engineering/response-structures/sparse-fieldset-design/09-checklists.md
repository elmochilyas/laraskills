# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** response-structures
**Knowledge Unit:** Sparse Fieldset Design
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Sparse Fieldset Design implementation follows response-structures patterns
- [ ] All edge cases handled for Sparse Fieldset Design
- [ ] Full test coverage for Sparse Fieldset Design
- [ ] Security review completed for Sparse Fieldset Design
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Sparse Fieldset Design
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Decide strict mode (return 400 for unknown fields) vs lenient mode (silently ignore). Strict is better for public APIs.
- [ ] Implement sparse fieldset logic as a reusable trait rather than duplicating across resources.
- [ ] Cache parsed fieldsets per-request to avoid re-parsing across nested resources.
- [ ] Pagination metadata should not be affected by sparse fieldsets â€” `meta` and `links` remain complete.
- [ ] Fieldset on compound documents: applying a fieldset to a primary type also affects the same type in `included`.
- [ ] Evaluate: Fieldset Mode: Strict vs Lenient
- [ ] Evaluate: Database Optimization Integration

---

# Implementation Checklist

- [ ] Field whitelist exists per resource type â€” no arbitrary field selection
- [ ] Invalid field names are rejected (400) or silently ignored (lax mode)
- [ ] API Resource respects the field filter â€” unused fields are excluded
- [ ] Nested/included resources also apply their own field filtering
- [ ] Required fields (id, type) are always included, even if not requested
- [ ] Default response (no fields parameter) includes all fields
- [ ] Field selection is tested per resource type
- [ ] Whitelist is documented in the API reference
- [ ] Implement Sparse Fieldset Design following response-structures patterns
- [ ] Configure all required settings for Sparse Fieldset Design
- [ ] Register route/middleware/service for Sparse Fieldset Design
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Sparse fieldsets reduce response size but not query cost by default â€” combine with `Model::select()` for true optimization.
- [ ] Fieldset parsing and validation adds ~0.1ms per request.
- [ ] Cache keys must include the fieldset parameter to avoid serving wrong data.
- [ ] With sparse fieldsets, the resource skips serialization for omitted fields, reducing CPU time in `toArray()`.

---

# Security Checklist

- [ ] Fieldset whitelist prevents exposure of internal model attributes â€” never allow clients to request arbitrary fields.
- [ ] Sensitive fields (internal notes, financial data) should not be in the whitelist at all â€” not just excluded from defaults.
- [ ] Field aliases that expose internal column names should be avoided.
- [ ] If using lenient mode, invalid fields are silently ignored â€” this can mask client bugs.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each resource type has a defined whitelist of available fields.
- [ ] Requesting invalid field names returns 400 (strict) or silently ignores (lenient).
- [ ] Fieldset parameter applies to included/related resource types, not just the primary.
- [ ] `meta` and `links` keys are not affected by sparse fieldsets.
- [ ] Integration tests verify that sparse fieldsets reduce response payload size appropriately.
- [ ] Write feature tests for happy path of Sparse Fieldset Design
- [ ] Write feature tests for validation failure of Sparse Fieldset Design
- [ ] Write feature tests for authentication failure of Sparse Fieldset Design
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

- [ ] Avoid: No Sparse Fieldset Support
- [ ] Avoid: Inconsistent Field Parameter Name
- [ ] Avoid: Field Selection Applied After Data Loading
- [ ] Avoid: No Validation of Requested Fields
- [ ] Avoid: Sparse Fieldsets Without Documentation

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
- Rule 1: Always Validate Requested Fields Against a Whitelist
- Rule 2: Apply Fieldsets to Included Resources Recursively
- Rule 3: Combine with `Model::select()` for Database Optimization
- Rule 4: Use a Reusable Trait for Sparse Fieldset Logic
- Rule 5: Cache Parsed Fieldsets Per Request
- Rule 6: Never Affect `meta` and `links` with Sparse Fieldsets

### Decisions
- Fieldset Mode: Strict vs Lenient
- Database Optimization Integration

### Anti-Patterns
- No Sparse Fieldset Support
- Inconsistent Field Parameter Name
- Field Selection Applied After Data Loading
- No Validation of Requested Fields
- Sparse Fieldsets Without Documentation

## Related Knowledge
- Prerequisites
- Related
- Advanced



