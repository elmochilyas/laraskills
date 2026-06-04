# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** error-handling-design
**Knowledge Unit:** Authorization Error Responses
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Authorization Error Responses implementation follows error-handling-design patterns
- [ ] All edge cases handled for Authorization Error Responses
- [ ] Full test coverage for Authorization Error Responses
- [ ] Security review completed for Authorization Error Responses
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Authorization Error Responses
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Map `AuthorizationException` with the denied policy/ability name.
- [ ] Include `detail.required_permission` without listing user's current permissions.
- [ ] Use generic message with specific machine-readable detail codes.
- [ ] Log authorization failures with user ID, policy, and resource ID for audit trail.
- [ ] Alert on repeated authorization failures by the same user (insider threat indicator).
- [ ] Map third-party authorization packages (Spatie Laravel Permission) explicitly.

---

# Implementation Checklist

- [ ] 403 returned for authorization failures, never 401
- [ ] Domain-specific error codes used per permission type
- [ ] Required permission included in error detail
- [ ] No stack traces in 403 responses
- [ ] Authorization failure logged with user and action context
- [ ] Tests verify 403 for unauthorized users per endpoint
- [ ] Implement Authorization Error Responses following error-handling-design patterns
- [ ] Configure all required settings for Authorization Error Responses
- [ ] Register route/middleware/service for Authorization Error Responses
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Gate check already ran and threw â€” no additional overhead.
- [ ] Response construction is a single object allocation.

---

# Security Checklist

- [ ] Never include the user's current roles or permissions in the response.
- [ ] Be careful with `required_permission` detail â€” it tells attackers which permission to target.
- [ ] For hidden resources, consider 404 instead of 403 to avoid confirming existence.
- [ ] Log authorization failures with full audit context but exclude permission sets.
- [ ] GDPR: auth failure logs contain personal data; apply retention policies.

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] All 403 responses use the standard error envelope
- [ ] Denial reason (role vs ownership) uses distinct error codes
- [ ] No user roles or permissions are exposed in the response
- [ ] AuthorizationException is explicitly mapped in the handler
- [ ] Spatie's UnauthorizedException (if used) has its own mapping
- [ ] Consistent 403 vs 404 strategy across all endpoints
- [ ] Integration tests verify 403 shape for policy failures, role gaps, and ownership conflicts
- [ ] Write feature tests for happy path of Authorization Error Responses
- [ ] Write feature tests for validation failure of Authorization Error Responses
- [ ] Write feature tests for authentication failure of Authorization Error Responses
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

- [ ] Avoid: Inconsistent 403/404 Strategy
- [ ] Avoid: Exposing Permission Hierarchy
- [ ] Avoid: Message-Based Permission Hints
- [ ] Avoid: Returning 401 for Denied Users
- [ ] Avoid: Catch-All 403 with No Detail

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
- Return 403 for Authenticated Users Who Lack Permission
- Distinguish Ownership Denial from Role Denial with Separate Codes
- Include Denied Policy Name in Machine-Readable Detail
- Never Include the User's Current Roles or Permissions in the Response
- Choose and Apply a Consistent 403 vs 404 Strategy Per Resource Type
- Map AuthorizationException Explicitly in the Handler
- Map Spatie's UnauthorizedException Separately
- Log Authorization Failures for Audit Trail
- Use 403 over 401 for Authenticated Requests with Invalid CSRF Tokens

### Anti-Patterns
- Inconsistent 403/404 Strategy
- Exposing Permission Hierarchy
- Message-Based Permission Hints
- Returning 401 for Denied Users
- Catch-All 403 with No Detail

## Related Knowledge
- Authentication Error Responses (401 vs 403 distinction)
- Standardized Error Envelope
- Laravel Gates and Policies
- Role-Based Access Control (RBAC) design
- Exception-to-Code Mapping



