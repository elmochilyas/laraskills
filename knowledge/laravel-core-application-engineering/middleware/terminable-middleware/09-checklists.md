# Metadata
**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Terminable Middleware
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] All source files (04-08) have been reviewed for this KU
- [ ] Singleton registration is configured in a service provider
- [ ] Per-request data is keyed by `spl_object_id($request)` â€” not a single property
- [ ] `terminate()` cleans up all per-request data (`unset`) â€” prevents memory leaks
- [ ] No synchronous I/O over 10ms in `terminate()`
- [ ] Heavy processing is dispatched to queue jobs
- [ ] Server environment compatibility is documented
- [ ] Critical operations use queue with retries, not terminable middleware

# Architecture Checklist (from 04/05/07 + standard items)
- [ ] Responsibilities are separated by layer (entry point / business logic / data access)
- [ ] Each component resides in the correct architectural layer
- [ ] No circular dependencies between layers or components
- [ ] Architecture guideline: - **Execution timing:** After `$response->send()`. The client has received the response. Modifica...
- [ ] Architecture guideline: - **Instance separation:** `handle()` and `terminate()` are different instances by default. Regis...
- [ ] Architecture guideline: - **Middleware gathering:** `Kernel::terminate()` checks both global AND route middleware for `te...
- [ ] Architecture guideline: - **Server compatibility:** PHP-FPM always fires `terminate()`. RoadRunner does not by default. S...
- [ ] Architecture guideline: - **Octane:** `terminate()` may not fire or may behave differently. Event listeners or queue jobs...
- [ ] Architecture guideline: - **Memory:** Request and response objects remain in memory during `terminate()`. Large file uplo...
- [ ] Decision: Terminable Middleware vs Queue-Based Post-Response Processing - ensure correct choice is made
- [ ] Decision: Singleton Registration vs Default New Instance for State Sharing - ensure correct choice is made
- [ ] Decision: Lightweight vs Heavy Processing in terminate() - ensure correct choice is made
- [ ] Decision: Per-Request State Management via spl_object_id vs Instance Properties - ensure correct choice is made

# Implementation Checklist (from 04/05/06 + standard items)
- [ ] Implementation follows project coding standards
- [ ] All type hints and return types are declared
- [ ] No hardcoded values - configuration is externalized
- [ ] Skill applied: Implement Terminable Middleware with Singleton Registration and Cleanup
- [ ] Skill applied: Verify terminate() Behavior in the Target Deployment Environment

# Performance Checklist (from 04/06)
- [ ] No N+1 query patterns present
- [ ] Database queries are indexed appropriately
- [ ] Caching is applied where appropriate
- [ ] No specific performance concerns identified in source files

# Security Checklist (from 04/06)
- [ ] Input is validated before use
- [ ] Mass assignment protection is configured ($fillable/$guarded)
- [ ] SQL injection vectors are eliminated (use Eloquent/query builder)
- [ ] Authorization is enforced at every entry point
- [ ] Sensitive data (PII, passwords, tokens) is not logged

# Reliability Checklist (from 04/05/06)
- [ ] Error handling covers all failure modes
- [ ] Database transactions wrap multi-step operations
- [ ] Stateless design enforced (no mutable per-request state)
- [ ] Logging is configured for debugging without leaking sensitive data

# Testing Checklist (from 04/06)
- [ ] Unit tests cover happy path
- [ ] Unit tests cover error/exception paths
- [ ] Tests are isolated (no shared mutable state between tests)
- [ ] Test coverage includes edge cases
- [ ] Architecture tests enforce patterns (Pest arch tests)
- [ ] Singleton registration is configured in a service provider
- [ ] Per-request data is keyed by `spl_object_id($request)` â€” not a single property
- [ ] `terminate()` cleans up all per-request data (`unset`) â€” prevents memory leaks
- [ ] No synchronous I/O over 10ms in `terminate()`
- [ ] Heavy processing is dispatched to queue jobs
- [ ] Server environment compatibility is documented
- [ ] Critical operations use queue with retries, not terminable middleware

# Maintainability Checklist
- [ ] Code adheres to SOLID principles
- [ ] Naming conventions are consistent across the codebase
- [ ] Files are organized by domain/feature, not by technical layer
- [ ] Classes have single responsibility
- [ ] Dependencies are injected, not resolved inline
- [ ] Configuration is centralized
- [ ] Dead code and unused imports are removed

# Anti-Pattern Prevention Checklist (one per anti-pattern from 08, one per Common Mistake from 04)
- [ ] Prevent: Not Registering as Singleton When State Is Needed -- apply preferred alternative
    - [ ] Terminable middleware with shared state is registered as singleton
    - [ ] Or: all data needed by `terminate()` is passed via `$request->attributes`
    - [ ] No `$this` state is written in `handle()` and read in `terminate()` without singleton
- [ ] Prevent: Heavy Synchronous I/O in `terminate()` -- apply preferred alternative
    - [ ] `terminate()` does not make synchronous API calls
    - [ ] `terminate()` does not perform database writes
    - [ ] `terminate()` does not process large files
- [ ] Prevent: Relying on `terminate()` for Critical Operations -- apply preferred alternative
    - [ ] No critical operations (payments, deletions, mandatory notifications) in `terminate()`
    - [ ] Queue jobs with retries handle all critical post-response work
    - [ ] `terminate()` only handles non-critical tasks (metrics, debug logs)
- [ ] Prevent: Singleton Terminable Middleware with Unbounded Data Accumulation -- apply preferred alternative
    - [ ] No unbounded array accumulation in singleton terminable middleware
    - [ ] Per-request data is cleared after processing in `terminate()`
    - [ ] Memory usage is stable over thousands of requests in Octane
- [ ] Prevent: Race Condition in Singleton Terminable Middleware -- apply preferred alternative
    - [ ] Singleton middleware does not use scalar properties for per-request data
    - [ ] Per-request data is keyed by `spl_object_id($request)`
    - [ ] Data is cleaned up after `terminate()` processes it

# Production Readiness Checklist
- [ ] All configuration values have production-safe defaults
- [ ] Error responses do not leak stack traces or internals
- [ ] Logging level is appropriate for production (INFO/WARN/ERROR)
- [ ] Feature flags or toggles are in place for risky changes
- [ ] Migration rollback strategy is defined
- [ ] Rate limiting is applied where appropriate
- [ ] Monitoring/alerting is configured for failure modes
- [ ] Dependencies are up to date with no known vulnerabilities

# Final Approval Checklist
- [ ] All previous checklist sections have been reviewed and satisfied
- [ ] Code review has been completed by at least one peer
- [ ] The implementation matches the approved design/architecture
- [ ] Tests pass in CI environment
- [ ] Documentation is updated (if applicable)
- [ ] No known regressions introduced
- [ ] Change log entry is added (if applicable)

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
### Skills (from 06)
- Implement Terminable Middleware with Singleton Registration and Cleanup
- Verify terminate() Behavior in the Target Deployment Environment
### Decision Trees (from 07)
- Terminable Middleware vs Queue-Based Post-Response Processing
- Singleton Registration vs Default New Instance for State Sharing
- Lightweight vs Heavy Processing in terminate()
- Per-Request State Management via spl_object_id vs Instance Properties
### Anti-Patterns (from 08)
- Not Registering as Singleton When State Is Needed
- Heavy Synchronous I/O in `terminate()`
- Relying on `terminate()` for Critical Operations
- Singleton Terminable Middleware with Unbounded Data Accumulation
- Race Condition in Singleton Terminable Middleware
### Related Rules (from 06 skills)
- Register Terminable Middleware as Singleton When State Sharing Is Needed (terminable-middleware:5)
- Keep terminate() Lightweight â€” Never Perform Synchronous I/O (terminable-middleware:5)
- Do Not Use Terminable Middleware for Critical Operations That Must Execute (terminable-middleware:5)
- Prevent Memory Leaks in Singleton Terminable Middleware (terminable-middleware:5)
- Use spl_object_id($request) as Key for Per-Request Data in Singleton Middleware (terminable-middleware:5)
### Related Skills (from 06 skills)
- Test Terminable Middleware by Calling terminate() Directly
- Verify terminate() Behavior in the Target Deployment Environment

