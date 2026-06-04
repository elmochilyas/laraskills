# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Queued Actions
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Queued Actions implementation follows crud-architecture patterns
- [ ] All edge cases handled for Queued Actions
- [ ] Full test coverage for Queued Actions
- [ ] Security review completed for Queued Actions
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Queued Actions
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Queue actions that: take >500ms, are not time-sensitive, can be retried independently
- [ ] Execute synchronously when: result is needed for response, operation is fast (<100ms), strong consistency is required
- [ ] The action class pattern maps naturally to Laravel's queue system â€” an action implementing `ShouldQueue` remains a standard action class
- [ ] For sub-actions dispatched to a queue from a sync action, dispatch after the transaction commits to avoid dispatching jobs for rolled-back transactions

---

# Implementation Checklist

- [ ] Action implements ShouldQueue
- [ ] Dispatched via Bus::dispatch()
- [ ] Queue connection and name configured
- [ ] failed() method for failure cleanup
- [ ] afterCommit() for transactional dispatch
- [ ] Retry limits set
- [ ] 202 Accepted returned from controller
- [ ] Queue monitoring in place
- [ ] Implement Queued Actions following crud-architecture patterns
- [ ] Configure all required settings for Queued Actions
- [ ] Register route/middleware/service for Queued Actions
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Queue dispatch adds ~1-5ms for serialization and push (Redis) or ~10-50ms (database queue)
- [ ] The HTTP response is sent immediately after dispatch â€” actual execution time is removed from the request lifecycle
- [ ] Failed job handling and retry infrastructure adds minimal overhead

---

# Security Checklist

- [ ] Queued actions operate with the permissions of the queue worker, not the original user â€” pass the authenticated user ID explicitly in the DTO for authorization checks
- [ ] Stale data: the action may query data that was modified between dispatch and execution â€” re-query data in the worker for critical decisions
- [ ] Sensitive data in serialized DTOs is stored in the queue â€” ensure queue connections are properly secured
- [ ] Transaction safety: dispatch after commit to prevent dispatching jobs for rolled-back operations

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Queued action does not serialize services or framework instances
- [ ] `ShouldQueue` and `Queueable` are applied correctly
- [ ] Retry limits (`$tries`, `$backoff`) are configured
- [ ] `failed()` method is implemented for critical jobs
- [ ] Test uses `Queue::fake()` to assert dispatch
- [ ] Queue dispatch happens after transaction commit
- [ ] Queue connection is properly secured for sensitive data
- [ ] Write feature tests for happy path of Queued Actions
- [ ] Write feature tests for validation failure of Queued Actions
- [ ] Write feature tests for authentication failure of Queued Actions
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

- [ ] Avoid: Queue as Performance Crutch
- [ ] Avoid: Eloquent Model in Queued Action
- [ ] Avoid: Ignoring Retry Limits
- [ ] Avoid: Dispatching Before Transaction Commit
- [ ] Avoid: Not Handling Failure

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
- Rule 1: Only Serialize Data â€” Never Services or Framework Instances
- Rule 2: Always Configure Retry Limits and Failure Handling
- Rule 3: Dispatch After Transaction Commit
- Rule 4: Only Queue Operations That Take >500ms
- Rule 5: Test with Queue::Fake() to Assert Dispatch

### Anti-Patterns
- Queue as Performance Crutch
- Eloquent Model in Queued Action
- Ignoring Retry Limits
- Dispatching Before Transaction Commit
- Not Handling Failure



