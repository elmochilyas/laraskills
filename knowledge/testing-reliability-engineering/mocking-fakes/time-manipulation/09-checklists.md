# Metadata
**Domain:** Testing & Reliability Engineering
**Subdomain:** Mocking & Fakes
**Knowledge Unit:** Time Manipulation
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] Apply rule: Always reset time after manipulation in `afterEach()` or `tearDown()`
- [ ] Apply rule: Freeze time even for tests that don't explicitly test time
- [ ] Apply rule: Use explicit timestamps in database factories
- [ ] Apply rule: Use `travel()` for relative time, `travelTo()` for absolute time
- [ ] Prevent anti-pattern: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent anti-pattern: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Time is frozen at a known reference point before any time-dependent code runs
- [ ] Test data is created relative to the frozen time (using `now()->addDays()` not absolute dates)
- [ ] Time travel assertions verify the expected state after time passes
- [ ] Time is restored after the test (automatic with Pest, manual with `travelBack()` for PHPUnit)
- [ ] Edge cases are tested (boundary of expiry, DST transition, leap year)
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting to reset time after test
- [ ] Avoid: Assuming DB timestamps are affected

# Architecture Checklist (responsibilities, layer, boundaries, deps)
- **`Carbon::setTestNow()` vs `travel()`**: `setTestNow()` for explicit control. `travel()` for relative offsets. Both work; choose based on readability.
- **`freezeTime()` vs `freezeSecond()`**: `freezeTime()` for most tests. `freezeSecond()` when microsecond ordering matters.
- **Time in setUp vs per-test**: Freeze in `setUp()` if time is irrelevant. Freeze per-test if specific dates matter.
- **Pest vs PHPUnit**: Pest provides `travel()`, `freezeTime()` as global functions. PHPUnit users use `Carbon::setTestNow()` directly.

# Implementation Checklist (classes, naming, DI, error handling)
- [ ] Follow rule: Always reset time after manipulation in `afterEach()` or `tearDown()`
- [ ] Follow rule: Freeze time even for tests that don't explicitly test time
- [ ] Follow rule: Use explicit timestamps in database factories
- [ ] Follow rule: Use `travel()` for relative time, `travelTo()` for absolute time
- [ ] Follow rule: Use `freezeSecond()` when microsecond ordering matters
- [ ] Follow rule: Use `Carbon::now()` in application code, not `time()` or `date()`
- [ ] - [ ] Time is frozen at a known reference point before any time-dependent code runs
- [ ] - [ ] Test data is created relative to the frozen time (using `now()->addDays()` not absolute dates)
- [ ] - [ ] Time travel assertions verify the expected state after time passes
- [ ] - [ ] Time is restored after the test (automatic with Pest, manual with `travelBack()` for PHPUnit)

# Performance Checklist
- Time manipulation overhead: <0.01ms per call (static property assignment).
- `freezeTime()`: Captures current time once. Negligible.
- `travel()`: Carbon arithmetic operations. Negligible.
- `travelBack()`: Null assignment. Negligible.

# Security Checklist
- Time-based security logic (password reset expirations, session timeouts, token expirations) must be tested with frozen time to ensure deterministic behavior.
- Test with both current time and near-boundary times (just before/after expiration).

# Reliability Checklist
- [ ] Ensure: Time manipulation controls the perceived current time in tests, enabling determi...
- [ ] Verify: Always reset time after manipulation in `afterEach()` or `tearDown()`
- [ ] Verify: Freeze time even for tests that don't explicitly test time
- [ ] Verify: Use explicit timestamps in database factories
- [ ] Verify: Use `travel()` for relative time, `travelTo()` for absolute time

# Testing Checklist
- [ ] Time is frozen at a known reference point before any time-dependent code runs
- [ ] Test data is created relative to the frozen time (using `now()->addDays()` not absolute dates)
- [ ] Time travel assertions verify the expected state after time passes
- [ ] Time is restored after the test (automatic with Pest, manual with `travelBack()` for PHPUnit)
- [ ] Edge cases are tested (boundary of expiry, DST transition, leap year)
- [ ] Avoid: Mistake
- [ ] Avoid: Forgetting to reset time after test
- [ ] Avoid: Assuming DB timestamps are affected

# Maintainability Checklist
- [ ] Naming consistent with project conventions
- [ ] Single Responsibility Principle followed
- [ ] Dependencies explicit and minimal
- [ ] Code follows framework conventions
- [ ] Apply: Always reset time after manipulation in `afterEach()` or `tearDown()`
- [ ] Apply: Freeze time even for tests that don't explicitly test time
- [ ] Apply: Use explicit timestamps in database factories
- [ ] Apply: Use `travel()` for relative time, `travelTo()` for absolute time

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Prevent: Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- [ ] Prevent: Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
- [ ] Avoid mistake: Mistake
- [ ] Avoid mistake: Forgetting to reset time after test
- [ ] Avoid mistake: Assuming DB timestamps are affected
- [ ] Avoid mistake: Testing caching with time manipulation
- [ ] Avoid mistake: Using `freezeTime()` when `freezeSecond()` is needed

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
- Always reset time after manipulation in `afterEach()` or `tearDown()`
- Freeze time even for tests that don't explicitly test time
- Use explicit timestamps in database factories
- Use `travel()` for relative time, `travelTo()` for absolute time
- Use `freezeSecond()` when microsecond ordering matters
- Use `Carbon::now()` in application code, not `time()` or `date()`
## Anti-Patterns
- Configuration drift**: Teams configure runtime/engine settings differently across environments, leading to inconsistent performance.
- Monitoring blindness**: Without monitoring key engine metrics, configuration drift goes undetected until issues surface in production.
## Skills
- Freeze and Manipulate Time in Tests


