# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Service Orchestration
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Service Orchestration implementation follows crud-architecture patterns
- [ ] All edge cases handled for Service Orchestration
- [ ] Full test coverage for Service Orchestration
- [ ] Security review completed for Service Orchestration
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Service Orchestration
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] An orchestrator coordinates across domains; a service orchestrates within its domain
- [ ] Reserve orchestrators for workflows involving 3+ services â€” otherwise use action composition or direct service calls
- [ ] Orchestrators must not contain domain logic â€” if you're writing business rules in the orchestrator, extract them to a sub-service
- [ ] Compensation patterns are needed for external system calls because database rollback cannot undo an API call
- [ ] Monitor orchestrator response time â€” they are the failure point for the entire workflow

---

# Implementation Checklist

- [ ] Orchestrator is pure coordination â€” no domain logic inline
- [ ] Orchestrator handles 3+ services (otherwise use simpler pattern)
- [ ] Error handling with rollback or compensating actions
- [ ] External system calls have compensation paths
- [ ] Logging at orchestrator level
- [ ] Orchestrator testable with mocked sub-services
- [ ] Orchestrator at application layer, not domain layer
- [ ] Implement Service Orchestration following crud-architecture patterns
- [ ] Configure all required settings for Service Orchestration
- [ ] Register route/middleware/service for Service Orchestration
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Orchestration adds no direct performance overhead â€” it's just method calls
- [ ] The performance profile is the sum of all sub-service operations
- [ ] For slow sub-operations, consider dispatching them to the queue from within the orchestrator
- [ ] Long-running orchestrations should be modeled as state machines or saga patterns

---

# Security Checklist

- [ ] Authorization checks must happen in sub-services, not in the orchestrator â€” the orchestrator should not bypass security
- [ ] Logging at the orchestrator level must not leak sensitive DTO data
- [ ] Compensation actions for payment reversals must include audit trails
- [ ] Orchestrators handling financial workflows must have explicit rollback and escalation paths

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Orchestrator is pure coordination â€” no domain logic inline
- [ ] Orchestrator handles 3+ services (otherwise use simpler pattern)
- [ ] Error handling exists with rollback or compensating actions
- [ ] External system calls have compensation paths
- [ ] Logging is present at the orchestrator level
- [ ] Orchestrator is testable with mocked sub-services
- [ ] Orchestrator is at the application layer, not domain layer
- [ ] Exception registry exists for documented skip exceptions
- [ ] Write feature tests for happy path of Service Orchestration
- [ ] Write feature tests for validation failure of Service Orchestration
- [ ] Write feature tests for authentication failure of Service Orchestration
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

- [ ] Avoid: Orchestrator God Class
- [ ] Avoid: Missing Compensation
- [ ] Avoid: Domain Logic in Orchestrator
- [ ] Avoid: Over-Orchestration
- [ ] Avoid: Orchestrator Without Error Handling

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
- Rule 1: Orchestrators Must Be Pure Coordination â€” No Domain Logic
- Rule 2: Only Create Orchestrators for 3+ Services
- Rule 3: Always Implement Error Handling and Compensation Paths
- Rule 4: Test Orchestrators with Mocked Sub-Services
- Rule 5: Add Logging at the Orchestrator Level

### Anti-Patterns
- Orchestrator God Class
- Missing Compensation
- Domain Logic in Orchestrator
- Over-Orchestration
- Orchestrator Without Error Handling



