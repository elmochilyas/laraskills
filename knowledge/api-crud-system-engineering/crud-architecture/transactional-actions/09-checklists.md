# Metadata
**Domain:** API & CRUD System Engineering
**Subdomain:** crud-architecture
**Knowledge Unit:** Transactional Actions
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] Transactional Actions implementation follows crud-architecture patterns
- [ ] All edge cases handled for Transactional Actions
- [ ] Full test coverage for Transactional Actions
- [ ] Security review completed for Transactional Actions
- [ ] Performance benchmark baseline established
- [ ] Error handling covers all failure modes
- [ ] Documentation updated for Transactional Actions
- [ ] All anti-patterns verified absent

---

# Architecture Checklist

- [ ] Transaction placement: Inside the action method (most common), inside the service method (when coordinating multiple actions), NEVER in the controller
- [ ] Keep transactions short â€” enclose only the write operations, not I/O
- [ ] Inner `DB::transaction()` calls are safe â€” they reuse the outer transaction and do not create savepoints by default
- [ ] Use savepoints explicitly when you need partial rollback within a transaction
- [ ] The `attempts` parameter retries on deadlock detection

---

# Implementation Checklist

- [ ] Multi-step writes wrapped in `DB::transaction()`
- [ ] Transaction returns result from callback
- [ ] Exception causes auto-rollback
- [ ] Deadlock retry configured
- [ ] External API calls outside transaction
- [ ] Domain events fire after commit
- [ ] Rollback tested
- [ ] Transaction duration monitored
- [ ] Implement Transactional Actions following crud-architecture patterns
- [ ] Configure all required settings for Transactional Actions
- [ ] Register route/middleware/service for Transactional Actions
- [ ] Apply thin controller principle - delegate logic to services/actions
- [ ] Use dependency injection for all external dependencies
- [ ] Ensure consistent error handling across all endpoints

---

# Performance Checklist

- [ ] Transaction overhead is database-specific â€” PostgreSQL/MySQL have negligible overhead for short transactions (1-5 queries)
- [ ] Long-running transactions (>1 second) hold locks and reduce concurrency
- [ ] Keep action transactions short â€” move I/O operations (API calls, file processing) outside the transaction
- [ ] Use `lockForUpdate()` for pessimistic locking when race conditions are possible

---

# Security Checklist

- [ ] Transactions prevent partial writes that could leave sensitive data in an inconsistent security state
- [ ] After-commit hooks ensure queued jobs (with sensitive operations) only execute if the transaction commits
- [ ] Deadlock retry logic must not retry indefinitely with side effects â€” use the `attempts` parameter
- [ ] Transaction rollback protects against data corruption from partial failures

---

# Reliability Checklist

- [ ] Handle all error states gracefully
- [ ] Use transactions for multi-step write operations
- [ ] Implement retry logic for idempotent operations
- [ ] Add circuit breakers for external service calls
- [ ] Validate response consistency across all paths

---

# Testing Checklist

- [ ] Write actions are wrapped in `DB::transaction()`
- [ ] Side effects (API calls, email, file I/O) execute after the transaction commits
- [ ] Read operations do not use transactions (unless consistent reads are required)
- [ ] Deadlock retry is configured via `attempts` parameter
- [ ] Locks are acquired in consistent order across all code paths
- [ ] Transaction exceptions are not swallowed â€” they propagate or are re-thrown
- [ ] Controllers do not manage database transactions
- [ ] Transaction boundaries match action boundaries
- [ ] Write feature tests for happy path of Transactional Actions
- [ ] Write feature tests for validation failure of Transactional Actions
- [ ] Write feature tests for authentication failure of Transactional Actions
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

- [ ] Avoid: Long-Running Transaction Starvation
- [ ] Avoid: Phantom Reads in Concurrent Transactions
- [ ] Avoid: Transaction as Service Layer
- [ ] Avoid: Swallowing Transaction Exceptions
- [ ] Avoid: Transactions with Side Effects Inside

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
- Rule 1: Wrap Every Write Action in DB::transaction()
- Rule 2: Execute Side Effects AFTER the Transaction Commits
- Rule 3: Use the Attempts Parameter for Deadlock Retry
- Rule 4: Never Manage Transactions in Controllers
- Rule 5: Acquire Locks in Consistent Order Across All Code Paths
- Rule 6: Transaction Boundaries Must Match Action Boundaries

### Anti-Patterns
- Long-Running Transaction Starvation
- Phantom Reads in Concurrent Transactions
- Transaction as Service Layer
- Swallowing Transaction Exceptions
- Transactions with Side Effects Inside



