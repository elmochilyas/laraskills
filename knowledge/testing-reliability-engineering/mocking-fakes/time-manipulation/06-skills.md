# Skill: Freeze and Manipulate Time in Tests

## Purpose
Control the system clock in tests using `$this->freezeTime()` and `Carbon::setTestNow()` to make time-dependent assertions deterministic and reproducible.

## When To Use
- Any test that relies on timestamps, dates, or durations
- Testing time-sensitive logic (expirations, deadlines, scheduling, age calculations)
- Testing time zone conversion logic
- Testing date-based scoping (records "from last 30 days")
- Testing rate limiting or cooldown periods

## When NOT To Use
- When testing real-time behavior (countdown timers, WebSocket events)
- When the exact time doesn't affect the assertion (existence-only checks)
- When time manipulation would mask time-dependent behavior that should be tested
- In browser/Dusk tests — time manipulation may not affect JavaScript's `Date`

## Prerequisites
- `$this->freezeTime()`, `$this->travelTo()`, `$this->travelBack()` methods (Pest/Laravel)
- `Carbon::setTestNow()` and `Carbon::getTestNow()` methods
- Understanding of time-sensitive code paths in the application

## Inputs
- The specific datetime to freeze at
- The duration to travel forward or backward
- The timezone to use for time-dependent assertions

## Workflow
1. Freeze time at the beginning of the test: `$this->freezeTime()` (freezes at `now()`) or `$this->travelTo(Carbon::parse('2026-06-01'))` (specific date)
2. Create test data relative to the frozen time: `$user = User::factory()->create(['trial_ends_at' => now()->addDays(30)])`
3. Travel forward to test time-dependent transitions: `$this->travel(31)->days()`
4. Assert the expected state based on the manipulated time
5. For multi-step time sequences, travel between assertions: `$this->travelTo($date1)` → assert → `$this->travelTo($date2)` → assert
6. Restore time with `$this->travelBack()` if not using Pest's automatic cleanup
7. Also `Carbon::setTestNow()` for direct Carbon control, but prefer Pest's helper methods

## Validation Checklist
- [ ] Time is frozen at a known reference point before any time-dependent code runs
- [ ] Test data is created relative to the frozen time (using `now()->addDays()` not absolute dates)
- [ ] Time travel assertions verify the expected state after time passes
- [ ] Time is restored after the test (automatic with Pest, manual with `travelBack()` for PHPUnit)
- [ ] Edge cases are tested (boundary of expiry, DST transition, leap year)

## Common Failures
- Not freezing time — tests pass on most days but fail at month boundaries or DST transitions
- Using absolute dates instead of relative dates — test fails when the reference date changes
- Testing with `now()` in assertions without freezing — assertion compares to actual clock
- Forgetting to restore time — subsequent tests get the frozen time
- Freezing time in `setUp` — all tests share the same frozen time, masking cross-test interactions

## Decision Points
- `freezeTime()` vs `travelTo()` — freeze for "now is now", travelTo for specific scenario dates
- Relative travel (`travel(30)->days()`) vs absolute (`travelTo($date)`) — relative for duration tests, absolute for calendar-specific scenarios
- `Carbon::setTestNow()` vs Pest helper — use Pest helpers for consistency, Carbon directly for fine-grained control

## Performance Considerations
- Time freezing is zero-overhead (static property set)
- Time travel is just a static time set — no actual waiting
- No performance impact on database operations or assertions

## Security Considerations
- Time-based security logic (rate limiting, token expiration, password reset windows) must be tested with frozen time
- Test that time-based security gates work correctly at exact boundaries
- Verify time zone handling for security-critical timeouts

## Related Rules
- [Rule: Freeze Time for Every Time-Sensitive Test](./05-rules.md)
- [Rule: Use Relative Dates in Test Data](./05-rules.md)
- [Rule: Test Time Boundaries](./05-rules.md)

## Related Skills
- Flaky Test Prevention Strategies
- Event Testing
- Queue Job Testing

## Success Criteria
- [ ] All time-sensitive tests freeze time before assertions
- [ ] Date boundaries (30 days, 1 year, exactly expired) are tested
- [ ] Time-based security logic (rate limits, token expiry) is tested at exact boundaries
- [ ] Time is always restored after tests that manipulate it
