# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Not Found Error Responses
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Not Found Error Responses implementation follows error-handling-design patterns
- [ ] All edge cases handled for Not Found Error Responses
- [ ] Full test coverage for Not Found Error Responses
- [ ] Security review completed for Not Found Error Responses
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Not Found Error Responses
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Map `ModelNotFoundException` with model-based code selection using `class_basename()`.
- [ ] Map `NotFoundHttpException` separately for invalid routes returning `ROUTE.NOT_FOUND`.
- [ ] Return generic fallback `RESOURCE.NOT_FOUND` for unrecognised models.
- [ ] Distinguish model from route 404s in the handler.
- [ ] Log 404s with URL, model type, and identifier for debugging (but never in response).
- [ ] Monitor 4xx rates â€” a surge in 404s often indicates scanning or a broken client.

---

# Implementation Checklist

- [ ] 404 returned for missing resources, never other status
- [ ] Resource type included in error code
- [ ] No stack traces in 404 responses
- [ ] Hidden resources don't expose lookup value
- [ ] 404 responses logged with lookup context
- [ ] 404 tested per resource type
- [ ] Implement Not Found Error Responses following error-handling-design patterns
- [ ] Configure all required settings for Not Found Error Responses
- [ ] Register route/middleware/service for Not Found Error Responses
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Exception handler is trivially fast.
- [ ] Model class name extraction is a single `class_basename()` call.
- [ ] No database queries in the error path.

---

# Security Checklist

- [ ] Never include the searched ID/slug in the response body or message.
- [ ] Be careful with `resource_type` â€” public APIs may want to omit it (prevents enumeration).
- [ ] For private/internal APIs, `resource_type` in detail aids debugging.
- [ ] Ensure consistent 404 responses for both missing models and missing routes.
- [ ] Soft-delete leak: returning different responses for active vs soft-deleted resources enables enumeration.
- [ ] Timing differences can reveal existence even without identifier in response.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All 404 responses use the standard error envelope
- [ ] No searched identifier appears in any 404 response field
- [ ] ModelNotFoundException is mapped with model-based code selection
- [ ] NotFoundHttpException is mapped separately for route 404s
- [ ] Resource type is included in detail (or intentionally excluded for public APIs)
- [ ] Using `findOrFail()` consistently across all model lookups
- [ ] Integration tests verify 404 shape for each model type and for invalid routes
- [ ] Write feature tests for happy path of Not Found Error Responses
- [ ] Write feature tests for validation failure of Not Found Error Responses
- [ ] Write feature tests for authentication failure of Not Found Error Responses
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

- [ ] Avoid: Returning 200 with Null Data
- [ ] Avoid: Including ID in Response
- [ ] Avoid: Different 404 Shapes per Endpoint
- [ ] Avoid: Using find() Instead of findOrFail()
- [ ] Avoid: Inconsistent 403/404 Strategy

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
- Never Include the Searched Identifier in 404 Responses
- Always Use findOrFail() Instead of find() with Manual 404
- Use Model-Specific Error Codes for Domain-Specific 404s
- Map NotFoundHttpException Separately for Invalid Routes
- Include resource_type in 404 Detail (Unless Hiding for Security)
- Choose and Apply a Consistent 404 vs 403 Hiding Strategy Per Resource
- Return 404 with Archived Flag for Soft-Deleted Resources (When Authorized)
- Log 404s with URL and Resource Type Internally

### Anti-Patterns
- Returning 200 with Null Data
- Including ID in Response
- Different 404 Shapes per Endpoint
- Using find() Instead of findOrFail()
- Inconsistent 403/404 Strategy

## Related Knowledge
- Conflict Error Responses (distinct from not-found semantics)
- Standardized Error Envelope
- Exception-to-Code Mapping (mapping ModelNotFoundException)
- Laravel Route Model Binding
- Authentication Error Responses (401 vs 404 hiding strategy)



