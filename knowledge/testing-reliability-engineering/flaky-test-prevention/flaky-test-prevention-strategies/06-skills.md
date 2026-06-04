# Skill: Prevent Flaky Tests in Laravel

## Purpose
Identify and prevent the most common sources of flaky tests in Laravel applications — time dependence, random data, state leakage, network dependence, and timing-dependent assertions — to maintain a reliable, trustworthy test suite.

## When To Use
- When writing any new test (prevent flakiness from the start)
- When investigating intermittent test failures
- When the test suite has tests that pass locally but fail in CI
- When setting up a new project's test suite
- When the team spends significant time re-running failed tests

## When NOT To Use
- For non-deterministic behavior that must be tested (race conditions in dedicated tests)
- When freezing time would mask time-dependent behavior (test both with and without)
- When faking HTTP would prevent testing real API contracts (separate integration tests)
- When the fix for flakiness is more complex than the flaky test itself (consider quarantining)

## Prerequisites
- Understanding of time freezing: `$this->freezeTime()`, `Carbon::setTestNow()`
- Knowledge of `Http::fake()` for HTTP call faking
- Understanding of `RefreshDatabase` for test isolation
- Dusk `waitFor()` vs `pause()` knowledge
- PHPUnit/Pest `--retry` flag

## Inputs
- Test that exhibits flaky behavior (intermittent failures)
- Flaky failure patterns (time-dependent, order-dependent, network-dependent)
- Test type (unit, feature, Dusk/browser)
- CI environment logs and failure screenshots

## Workflow
1. Identify the flaky failure pattern: time-dependent, order-dependent, network-dependent, or timing-dependent
2. For time-dependent flakiness: freeze time at the start of the test
3. For state leakage: add `RefreshDatabase` or `DatabaseTransactions` trait
4. For external API calls: use `Http::fake()` with controlled responses
5. For Dusk timing: replace `pause()` with `waitFor()`, `waitForText()`, or element-specific waits
6. For random data: use explicit fixed values for fields in assertions
7. After fixing, run the test 10x locally to verify determinism
8. If the test remains flaky after fixing, quarantine it with a tracking issue
9. Track all flaky test occurrences in a dedicated dashboard
10. Enforce a policy: fix or quarantine flaky tests within 2 weeks

## Validation Checklist
- [ ] Every time-sensitive test uses `$this->freezeTime()` or equivalent
- [ ] All external HTTP calls use `Http::fake()` in feature tests
- [ ] No Dusk tests use `pause()` — all use `waitFor()` or `waitForText()`
- [ ] All feature tests use `RefreshDatabase` or `DatabaseTransactions`
- [ ] Asserted fields use explicit values, not Faker defaults
- [ ] Zero-assertion tests are eliminated
- [ ] Flaky test tracking process is in place
- [ ] Flaky test policy is defined and enforced (fix or quarantine within 2 weeks)

## Common Failures
- Ignoring flaky tests — "just re-run and it'll pass" erodes CI trust
- Using `pause()` in Dusk tests — too short on slow CI, too long on fast
- Not freezing time for time-sensitive code — fails at midnight or DST boundaries
- Using random data in assertions — Faker edge-case characters cause encoding failures
- No test isolation — missing `RefreshDatabase` causes order-dependent failures
- Real network calls in tests — tests fail when external API is unavailable

## Decision Points
- Retry vs quarantine — retry for rare flakiness, quarantine for persistent issues
- `RefreshDatabase` vs `DatabaseTransactions` — RefreshDatabase for thorough isolation, DatabaseTransactions for speed
- Fix now vs track for later — fix immediately if root cause is clear, track if investigation is needed

## Performance Considerations
- Time freezing: zero overhead (static setter)
- `Http::fake()`: faster than real HTTP calls (ms vs hundreds of ms)
- `RefreshDatabase`: migration overhead per suite (~1-5s), not per test
- `--retry` flag: doubles CI time for flaky tests — monitor retry rate
- `waitFor()`: polls every 100ms — more efficient than `pause(1000)`

## Security Considerations
- Flaky tests in security-critical areas (auth, permissions) are dangerous — a flaky pass may hide a real failure
- Time-based security logic (password reset expirations, session timeouts) must be tested with frozen time
- Security tests that are flaky should be fixed with highest priority

## Related Rules
- [Rule: Freeze Time for Every Time-Sensitive Test](./05-rules.md)
- [Rule: Use Explicit Values for Asserted Fields](./05-rules.md)
- [Rule: Use `Http::fake()` for External API Calls](./05-rules.md)

## Related Skills
- Time Manipulation
- HTTP Client Faking
- Dusk Waiting Strategies

## Success Criteria
- [ ] All time-sensitive tests freeze time
- [ ] No external HTTP calls go unfaked in tests
- [ ] No `pause()` calls in Dusk tests
- [ ] All feature tests use `RefreshDatabase`
- [ ] Flaky test rate is <1% of CI runs
- [ ] Flaky tests are fixed or quarantined within 2 weeks
