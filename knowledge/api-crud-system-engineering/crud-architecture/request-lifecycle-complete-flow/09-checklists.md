# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Request Lifecycle Complete Flow
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Request Lifecycle Complete Flow implementation follows crud-architecture patterns
- [ ] All edge cases handled for Request Lifecycle Complete Flow
- [ ] Full test coverage for Request Lifecycle Complete Flow
- [ ] Security review completed for Request Lifecycle Complete Flow
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Request Lifecycle Complete Flow
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Authentication and input validation happen before the controller (middleware and FormRequest)
- [ ] Data transformation (DTO) is the boundary between HTTP and business logic
- [ ] Business rules live in actions/services, never in controllers or models
- [ ] Response formatting (resources/JSON) is an HTTP concern â€” it belongs in or near the controller
- [ ] Post-response cleanup (terminable middleware) runs after the response is sent

---

# Implementation Checklist

- [ ] Each layer has single, clear responsibility
- [ ] Data flows through layers in correct order
- [ ] No layer skips intermediate layer without explicit justification
- [ ] Authentication and validation before business logic
- [ ] DTOs form boundary between HTTP and business logic
- [ ] Business logic in actions/services, not controllers
- [ ] Response formatting in or near controller
- [ ] Implement Request Lifecycle Complete Flow following crud-architecture patterns
- [ ] Configure all required settings for Request Lifecycle Complete Flow
- [ ] Register route/middleware/service for Request Lifecycle Complete Flow
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] The complete flow adds ~1-5ms overhead from framework bootstrap, middleware, routing, and container resolution
- [ ] For typical CRUD operations, this is 5-20% of total request time â€” the rest is database queries
- [ ] Optimization should focus on database queries, not the flow overhead
- [ ] Under Laravel Octane, the bootstrap cost is paid once and shared across all requests

---

# Security Checklist

- [ ] Middleware is the first line of defense â€” authentication, throttle, and CORS checks happen before any business logic
- [ ] FormRequest validation prevents malformed data from reaching DTOs and actions
- [ ] DTOs should only receive validated data â€” raw request input must never pass through
- [ ] Terminable middleware can perform security logging after the response is sent

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Each layer in the flow has a single, clear responsibility
- [ ] Data flows through layers in the correct order
- [ ] No layer skips an intermediate layer without explicit justification
- [ ] Authentication and validation happen before business logic
- [ ] DTOs form the boundary between HTTP and business logic
- [ ] Business logic is in actions/services, not controllers
- [ ] Response formatting is in or near the controller
- [ ] The flow is documented and understood by the team
- [ ] Write feature tests for happy path of Request Lifecycle Complete Flow
- [ ] Write feature tests for validation failure of Request Lifecycle Complete Flow
- [ ] Write feature tests for authentication failure of Request Lifecycle Complete Flow
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

- [ ] Avoid: Architecture by Shortcut
- [ ] Avoid: Data Without DTO
- [ ] Avoid: Business Logic in Controllers
- [ ] Avoid: Flow Short-Circuit Debugging
- [ ] Avoid: Assuming the Flow Is Shorter

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
- Rule 1: Respect the 12-Step Flow Order
- Rule 2: Trace the Full Flow for Every New Endpoint
- Rule 3: Never Pass Raw Validated Arrays Through All Layers
- Rule 4: Add Monitoring at Layer Boundaries
- Rule 5: Business Logic Belongs in Actions/Services, Never Controllers

### Anti-Patterns
- Architecture by Shortcut
- Data Without DTO
- Business Logic in Controllers
- Flow Short-Circuit Debugging
- Assuming the Flow Is Shorter



