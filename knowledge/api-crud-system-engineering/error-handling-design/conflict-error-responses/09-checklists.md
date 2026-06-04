# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Conflict Error Responses
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Conflict Error Responses implementation follows error-handling-design patterns
- [ ] All edge cases handled for Conflict Error Responses
- [ ] Full test coverage for Conflict Error Responses
- [ ] Security review completed for Conflict Error Responses
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Conflict Error Responses
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Define base `ConflictException` extending `ApiException` with 409 status and conflict detail shape.
- [ ] Create subclasses: `DuplicateResourceException`, `StaleVersionException`, `InvalidStateTransitionException`.
- [ ] Never include the conflicting value in the response â€” only the field name.
- [ ] For optimistic locking, compare `updated_at` or version column before update.
- [ ] Validate state transitions in a service layer; throw on invalid transitions.
- [ ] Map `UniqueConstraintViolationException` explicitly in the handler.

---

# Implementation Checklist

- [ ] 409 returned for conflict errors, not 422 or 500
- [ ] Domain-specific error codes per conflict type
- [ ] Conflicting field or resource identified in detail
- [ ] Optimistic locking includes version values
- [ ] No stack traces in 409 responses
- [ ] Conflict scenarios tested per resource
- [ ] Implement Conflict Error Responses following error-handling-design patterns
- [ ] Configure all required settings for Conflict Error Responses
- [ ] Register route/middleware/service for Conflict Error Responses
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Conflict detection is part of business logic, not error handling overhead.
- [ ] Optimistic lock check is a single WHERE clause â€” negligible cost.
- [ ] The conflict response generation is identical to any other error response.

---

# Security Checklist

- [ ] Never echo the duplicate value in the response (email, username, phone).
- [ ] For optimistic locking, exposing the current version is safe â€” version is an opaque counter.
- [ ] State conflict responses revealing valid transitions help clients but also inform attackers about workflow states.
- [ ] Log the conflicting value and field for debugging but exclude from response.
- [ ] Ensure 409 does not leak information about other users' resources.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All 409 responses use the standard error envelope with conflict detail
- [ ] No duplicate values (email, username) appear in any 409 response
- [ ] Distinct error codes used for duplicate, stale, and state conflict types
- [ ] Optimistic locking responses include expected version info
- [ ] DB `UniqueConstraintViolationException` is mapped to 409
- [ ] Conflict resolution info (expected value, valid transitions) is included
- [ ] Integration tests verify 409 shape for all conflict scenarios
- [ ] Write feature tests for happy path of Conflict Error Responses
- [ ] Write feature tests for validation failure of Conflict Error Responses
- [ ] Write feature tests for authentication failure of Conflict Error Responses
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

- [ ] Avoid: Using 422 for All Conflicts
- [ ] Avoid: Including the Conflicting Value
- [ ] Avoid: Not Distinguishing Conflict Types
- [ ] Avoid: No Conflict Detail
- [ ] Avoid: Using 409 for Rate Limiting

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
- Use HTTP 409 for Semantic Conflicts, 422 for Validation Errors
- Never Include the Duplicate Value in Conflict Responses
- Distinguish Conflict Types with Separate Error Codes
- Include Expected Version or Valid Transitions in Optimistic Locking Conflicts
- Map Database Unique Constraint Violations to 409
- Use Distinct Exception Subclasses for Each Conflict Type
- Provide Resolution Info for State Conflicts
- Never Use 409 for Rate Limiting
- Always Log the Conflicting Value Internally (Never in Response)

### Anti-Patterns
- Using 422 for All Conflicts
- Including the Conflicting Value
- Not Distinguishing Conflict Types
- No Conflict Detail
- Using 409 for Rate Limiting

## Related Knowledge
- Standardized Error Envelope
- Exception-to-Code Mapping (mapping QueryException for duplicates)
- Not Found Error Responses (complementary 4xx)
- Validation Error Shape Design (422 vs 409 distinction)
- Idempotency Key Design (idempotency conflicts use 409)



