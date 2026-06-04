# Skill: Use `dispatchIf`/`dispatchUnless` for Conditional Dispatch

## Purpose
Gate job dispatch on a boolean condition evaluated at dispatch time using `dispatchIf($condition, $job)` and `dispatchUnless($condition, $job)`.

## When To Use
Feature flag gating; role-based dispatch (opted-in users only); environment-based dispatch (skip in non-production); any conditional dispatch where the condition is known at dispatch time.

## When NOT To Use
Conditions involving database state that may change before worker runs (evaluate inside job instead); complex multi-condition logic (use helper method or middleware); when chaining on dispatch result (guard against null return).

## Prerequisites
- Job class to conditionally dispatch
- Boolean condition or closure known at dispatch time

## Inputs
- Condition (boolean or callable)
- Job instance

## Workflow
1. Determine condition at dispatch time: `Bus::dispatchIf($user->isSubscribed(), $job)`
2. Use explicit comparisons (`=== true`) over truthy checks (avoid falsy edge cases)
3. Guard against null return when chaining: `optional(Bus::dispatchIf(false, $job))?->onQueue('high')`
4. Log dispatch skips when unexpected — condition returning null is silent
5. Prefer `dispatchIf` over `dispatchUnless` (avoid inversion)
6. Avoid side effects in condition expressions — evaluate eagerly regardless of result
7. Use `dispatchUnless` only for naturally negative conditions (e.g., `dispatchUnless($user->isBanned(), $job)`)

## Validation Checklist
- [ ] Condition evaluated at dispatch time (not inside job)
- [ ] Explicit comparison used (`=== true`) — no falsy edge cases
- [ ] Null return guarded when chaining
- [ ] Dispatch skips logged for unexpected conditions
- [ ] No side effects in condition expression
- [ ] `dispatchIf` preferred over `dispatchUnless`
- [ ] `dispatchUnless` used only for naturally negative conditions
- [ ] Condition doesn't duplicate worker-side logic

## Common Failures
- Chaining on null return — null method call error
- Assuming worker re-evaluation — condition is dispatch-time only
- Forgetting falsy edge cases (0, "", null, []) — job mistakenly skipped
- Silent skip without audit — condition always false, no alert
- Side-effect-heavy conditions — side effects run even when dispatch is skipped

## Decision Points
- Simple boolean feature flag: `dispatchIf(feature_active, $job)`
- Inverse check (banned users): `dispatchUnless($user->isBanned(), $job)`
- Complex condition: extract to helper method with explicit return boolean

## Related Rules
- Rule 1: prefer-dispatchIf-over-manual-guards
- Rule 2: avoid-side-effects-in-condition
- Rule 3: evaluate-condition-in-caller-process
- Rule 4: use-dispatchUnless-for-negative-logic

## Related Skills
- Use `dispatchAfterResponse` for Post-Response Tasks
- Use Defer Pattern for Batched Post-Response Work
- Use `afterCommit` for Transactional Dispatch Safety

## Success Criteria
Conditions are evaluated at dispatch time with explicit comparisons, null returns are guarded when chaining, skips are logged, and side effects are avoided in condition expressions.
