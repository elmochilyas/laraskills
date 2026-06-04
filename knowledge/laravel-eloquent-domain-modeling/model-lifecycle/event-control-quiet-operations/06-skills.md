# Skill: Suppress Events for Bulk Operations with withoutEvents()

## Purpose

Wrap bulk persistence operations in `Model::withoutEvents()` to suppress all model event dispatching, preventing unnecessary observer execution and breaking infinite event loops.

## When To Use

- Bulk data imports or migrations where event listeners add significant overhead
- Preventing infinite event loops (observer saves the observed model)
- Test data seeding where observer side effects are not desired
- Breaking circular event chains

## When NOT To Use

- Default save/delete operations that should fire events normally
- Hiding legitimate side effects that should always run
- Performance optimization without profiling confirmation

## Prerequisites

- Understanding of which events are being suppressed
- Awareness that all observers are bypassed inside the suppression block

## Inputs

- The persistence operations to suppress
- Optional: a specific quiet method for single operations

## Workflow

1. Identify the code block where events should be suppressed:
   - Bulk factory creation in test setup
   - Observer method that saves the same model type (potential infinite loop)
   - Data migration script
2. Wrap the block in `Model::withoutEvents()`:
   ```
   Model::withoutEvents(function () use ($data) {
       foreach ($data as $row) {
           Model::create($row)
       }
   })
   ```
3. For a single isolated operation, use the dedicated quiet method:
   ```
   $order->saveQuietly()
   ```
4. Add a comment explaining why events are suppressed:
   ```
   // Suppress events during bulk seed to avoid firing 1000 observer methods
   Model::withoutEvents(fn () => User::factory()->count(1000)->create())
   ```
5. Use quiet operations in test setup, not in test assertions:
   ```
   // Setup — suppress events
   $user = Model::withoutEvents(fn () => User::factory()->create())
   // Assertion — verify events fire correctly
   $response = $this->actingAs($user)->post('/orders', [...])
   ```

## Validation Checklist

- [ ] Every `withoutEvents()` or quiet method usage has a documented reason
- [ ] `withoutEvents()` preferred over individual quiet methods for scoped suppression
- [ ] Quiet operations not used in test assertion phase
- [ ] Infinite event loops are broken with targeted quiet suppression
- [ ] No persistent "quiet mode" flag across HTTP requests
- [ ] Suppression is not used as a performance optimization without profiling

## Common Failures

- **Partial suppression**: Using `saveQuietly()` for one save but missing other saves inside the same block. Use `withoutEvents()` for comprehensive suppression.
- **Silencing legitimate side effects**: Suppressing events to hide an observer that does something undesirable. Fix the observer design instead.
- **Missing documentation**: Suppressing events without explanation. Future developers may remove suppression unaware of its purpose.

## Decision Points

- **withoutEvents vs quiet methods**: Use `withoutEvents()` for scoped blocks with multiple operations. Use individual quiet methods for single isolated operations.
- **Suppression in setup vs assertions**: Always allow events in assertion phase. Use suppression only in test setup/data seeding.

## Performance Considerations

- Suppressing events eliminates observer method calls — significant for thousands of operations
- Profile before optimizing — observer methods are typically <1ms each
- For truly massive operations, consider raw `DB::table()->insert()` instead

## Security Considerations

- Suppressing events may skip essential logic (audit logging, cache invalidation) — always document why suppression is safe
- Never suppress events without understanding what side effects are being skipped

## Related Rules

- Rule 1: Prefer `withoutEvents()` Over Individual Quiet Methods for Scoped Suppression
- Rule 2: Always Document Why Events Are Suppressed
- Rule 3: Use Quiet Operations to Break Infinite Event Loops, Not to Silence Legitimate Side Effects
- Rule 4: Use Quiet Operations in Test Setup, Not in Test Assertions
- Rule 7: Never Use Quiet Operations to Suppress Events Across HTTP Requests

## Related Skills

- Commit Strategies for Transactional Safety
- Factory Callbacks for Post-Creation Logic
- Observer Anti-Patterns for Design

## Success Criteria

- Bulk operations execute without triggering model events
- Infinite event loops are broken with targeted suppression
- Suppression is documented and safe (no critical side effects skipped)
- Test assertions verify event behavior independently of setup suppression
