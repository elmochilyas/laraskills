# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** Queue/Job Testing
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Test both dispatch and execution for every job
- [ ] Apply rule: Test the `failed()` method for all critical jobs
- [ ] Apply rule: Test job data in dispatch assertions
- [ ] Apply rule: Test job serialization
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] `Bus::fake()` is called before the action
- [ ] Job class and payload are verified in assertions
- [ ] Dispatch count is asserted when multiple jobs may be pushed
- [ ] Job chains are verified if the action dispatches chains
- [ ] Jobs that should not be pushed in error scenarios are asserted
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing dispatch, not execution
- [ ] Avoid: Not testing the `failed()` method

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`Queue::fake()` vs `Bus::fake()`**: Use `Queue::fake()` for async jobs. Use `Bus::fake()` for sync commands. Convention: commands = synchronous, jobs = asynchronous.
- **Dispatch test vs execution test**: Dispatch tests verify the right jobs are queued with correct data. Execution tests verify job correctness. Both are needed.
- **Job middleware**: Test middleware effects separately (e.g., test rate limiter behavior without the job).
- **Unique jobs**: `shouldBeUnique()` jobs should not be dispatchable twice. Test with `assertPushed()` and `assertNotPushed()`.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Test both dispatch and execution for every job
- [ ] Follow rule: Test the `failed()` method for all critical jobs
- [ ] Follow rule: Test job data in dispatch assertions
- [ ] Follow rule: Test job serialization
- [ ] Follow rule: Use `assertPushedOn()` to verify queue routing
- [ ] Follow rule: Fake external services in job execution tests
- [ ] - [ ] `Bus::fake()` is called before the action
- [ ] - [ ] Job class and payload are verified in assertions
- [ ] - [ ] Dispatch count is asserted when multiple jobs may be pushed
- [ ] - [ ] Job chains are verified if the action dispatches chains

# Performance Checklist
- Fake registration: <0.5ms.
- Job push via fake: <0.1ms per job.
- Dispatch assertion: <0.1ms per assertion.
- Job execution test: 1-50ms depending on complexity.
- Batch assertions: <0.5ms.

# Security Checklist
- Jobs handling sensitive data should not log that data. Test job execution with data isolation.
- Test that failed jobs don't leak sensitive information in error reports.

# Reliability Checklist
- [ ] Ensure: Queue/job testing verifies that jobs are dispatched with correct data, can be pr...
- [ ] Verify: Test both dispatch and execution for every job
- [ ] Verify: Test the `failed()` method for all critical jobs
- [ ] Verify: Test job data in dispatch assertions
- [ ] Verify: Test job serialization

# Testing Checklist
- [ ] `Bus::fake()` is called before the action
- [ ] Job class and payload are verified in assertions
- [ ] Dispatch count is asserted when multiple jobs may be pushed
- [ ] Job chains are verified if the action dispatches chains
- [ ] Jobs that should not be pushed in error scenarios are asserted
- [ ] Job batches are tested if used in the workflow
- [ ] Avoid: Mistake
- [ ] Avoid: Only testing dispatch, not execution
- [ ] Avoid: Not testing the `failed()` method

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Test both dispatch and execution for every job
- [ ] Apply: Test the `failed()` method for all critical jobs
- [ ] Apply: Test job data in dispatch assertions
- [ ] Apply: Test job serialization

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Only testing dispatch, not execution
- [ ] Avoid mistake: Not testing the `failed()` method
- [ ] Avoid mistake: Using `Queue::fake()` for sync-only jobs
- [ ] Avoid mistake: Testing job with real third-party services

# Production Readiness Checklist (monitoring, logging, error handling, config, rollback)
- [ ] Monitoring and alerting configured
- [ ] Structured logging in place
- [ ] Error handling covers all failure modes
- [ ] Configuration externalized
- [ ] Rollback strategy documented
- [ ] Graceful degradation for downstream failures

# Final Approval Checklist (arch, security, perf, testing, anti-pattern, production)
- [ ] Architecture review completed
- [ ] Security review completed
- [ ] Performance impact assessed
- [ ] Security impact assessed
- [ ] Testing coverage adequate
- [ ] Anti-patterns reviewed and prevented
- [ ] Production readiness confirmed

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
## Rules
- Test both dispatch and execution for every job
- Test the `failed()` method for all critical jobs
- Test job data in dispatch assertions
- Test job serialization
- Use `assertPushedOn()` to verify queue routing
- Fake external services in job execution tests
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Test Queue Job Dispatching


