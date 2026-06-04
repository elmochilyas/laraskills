# Skill: Use PendingDispatch Correctly to Prevent Silent Job Loss

## Purpose
Understand and correctly use the `PendingDispatch` deferred dispatch mechanism to prevent jobs from being silently lost or dispatched at unexpected times.

## When To Use
Whenever dispatching jobs via the fluent `dispatch()` API. Essential for understanding why jobs may not dispatch as expected.

## When NOT To Use
When using `dispatchIf()` / `dispatchUnless()` (bypass PendingDispatch); when using `Bus::dispatchToQueue()` for immediate dispatch.

## Prerequisites
- Understanding of PHP destructor behavior
- Job class with `Dispatchable` trait

## Inputs
- Job class
- Dispatch conditions and chain methods

## Workflow
1. Call `dispatch()` without assigning to a variable for immediate destructor dispatch
2. For conditional dispatch: use `dispatchIf()` / `dispatchUnless()` instead of wrapping in if-block
3. Validate all chain method inputs before calling `dispatch()` — exceptions in chain prevent destructor from firing
4. For explicit timing control: use `Bus::dispatchToQueue(new Job())`
5. For after-commit safety: set `after_commit` at connection level or use `->afterCommit()`

## Validation Checklist
- [ ] `dispatch()` not assigned to variable unless delayed dispatch is intentional
- [ ] `dispatchIf()` / `dispatchUnless()` used for conditional dispatch
- [ ] No exceptions expected in fluent chain methods
- [ ] Destructor timing understood for the scope
- [ ] `Bus::dispatchToQueue()` used when immediate dispatch is required

## Common Failures
- Assigning `dispatch()` to variable — job dispatches at end of scope, not at call site
- Exception in chain method — destructor never fires, job silently lost
- Relying on destructor ordering — PHP GC non-deterministic

## Decision Points
- Standard dispatch: `Job::dispatch($data)` — no assignment
- Conditional: `Job::dispatchIf($condition, $data)`
- Immediate: `Bus::dispatchToQueue(new Job($data))`

## Performance Considerations
- PendingDispatch is a temporary object — microseconds overhead
- Destructor checks for active transaction — cheap
- Multiple PendingDispatch in loop: all destructors fire at end of iteration

## Security Considerations
- Silent job loss from exception in dispatch chain creates invisible failures
- Validate inputs before dispatching to prevent chain exceptions

## Related Rules
- Rule 1: dont-assign-dispatch-to-variable
- Rule 2: prefer-dispatch-if-unless
- Rule 3: handle-exceptions-in-dispatch-chain
- Rule 4: use-bus-dispatchToQueue-pattern

## Related Skills
- Test Job Dispatch Behavior with Queue::fake()
- Configure after_commit for Transactional Safety

## Success Criteria
Jobs dispatch predictably — no silent loss from destructor failures, correct timing, and conditional dispatch handled cleanly without wrapper if-blocks.
