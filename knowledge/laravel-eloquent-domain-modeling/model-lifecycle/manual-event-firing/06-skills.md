# Skill: Test Observer Logic with fireModelEvent() Without Persistence

## Purpose

Use `$model->fireModelEvent('created', false)` to trigger observer methods without creating a database record, enabling fast, isolated unit tests for observer behavior.

## When To Use

- Testing observer logic independently of database persistence
- Triggering specific model events without save/delete side effects
- Replaying events for data recovery or audit verification

## When NOT To Use

- Normal persistence flows (events fire automatically — don't replace with manual firing)
- Testing requires the model to be persisted (e.g., `retrieved` event)
- The event should be a domain event dispatched through the Event facade

## Prerequisites

- Observer class is registered on the model
- Test framework is set up (PHPUnit, Pest)

## Inputs

- Model factory (for in-memory instance via `make()`)
- Event name to fire (e.g., `'created'`, `'updated'`)

## Workflow

1. Create the model instance in-memory using `make()`:
   ```
   $order = Order::factory()->make()
   ```
2. Fire the model event with `$halt = false`:
   ```
   $order->fireModelEvent('created', false)
   ```
3. Assert the expected observer behavior:
   ```
   Cache::shouldHaveReceived('forget')->once()
   ```
4. For custom events, register the event name in `$observables`:
   ```
   protected $observables = ['processing']
   
   public function process(): void
   {
       $this->fireModelEvent('processing', false)
   }
   ```
5. Keep `$observables` declarations close to where the custom event is fired

## Validation Checklist

- [ ] `fireModelEvent()` used with `$halt = false` for non-halting test scenarios
- [ ] Model created with `make()` (not `create()`) to avoid database writes
- [ ] Normal persistence flows are not replaced with manual event firing
- [ ] Custom events are registered in `$observables` and fired via `fireModelEvent()`
- [ ] `$observables` declarations are close to the event-firing code

## Common Failures

- **Replacing save() with manual events**: Using `fireModelEvent('created')` instead of `save()`. Manual events only trigger listeners — they don't persist data. Use `save()` for persistence.
- **Halt=true by mistake**: `fireModelEvent()` defaults to `halt = true`. Any listener returning `false` blocks event propagation. Pass `false` explicitly for custom events.
- **Missing $observables**: Firing a custom event name that isn't in `$observables`. The event fires but no registered observer methods execute.

## Decision Points

- **fireModelEvent vs Event::dispatch**: Use `fireModelEvent()` for model lifecycle events. Use `Event::dispatch()` for domain events that are not part of the model lifecycle.
- **Halt true vs false**: Use `halt = false` for side-effect-only custom events. Use `halt = true` for events designed to allow halting (e.g., a `validating` event).

## Performance Considerations

- `fireModelEvent()` with `make()` avoids database writes — faster than `create()` in tests
- No overhead for production use (manual event firing is rare in production)

## Security Considerations

- Manual event firing can trigger observers that perform side effects — ensure test isolation

## Related Rules

- Rule 1: Use `fireModelEvent()` for Testing Observer Logic Without Persistence
- Rule 2: Use `$observables` to Register Custom Model Events
- Rule 3: Never Replace Normal Persistence With Manual Event Firing
- Rule 5: Always Pass `false` as the Second Argument to `fireModelEvent()` When Firing Without Halting
- Rule 6: Keep `$observables` Declarations Close to Where Custom Events Are Fired

## Related Skills

- Event Control / Quiet Operations for Suppression
- Event Propagation for Halting Behavior
- Observer Pattern for Lifecycle Hooks

## Success Criteria

- Observer tests run without database persistence — fast and isolated
- Custom model events are registered in `$observables` and fire correctly
- Normal persistence flows continue to use `save()` and fire events automatically
- Custom events use `halt = false` unless halting is explicitly intended
