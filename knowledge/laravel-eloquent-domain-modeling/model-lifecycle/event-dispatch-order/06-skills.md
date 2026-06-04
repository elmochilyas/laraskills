# Skill: Verify Event Dispatch Order for Model Operations

## Purpose

Analyze and validate the correct sequence of Eloquent event dispatch for create, update, delete, and other lifecycle operations, ensuring listeners fire in the expected order and use the correct event for halting.

## When To Use

- Writing event listeners that depend on execution order
- Debugging unexpected behavior in model event chains
- Implementing validation that must run before or after other listeners
- Understanding when `saving` vs `creating`/`updating` fires

## When NOT To Use

- Events are independent and order doesn't matter
- Listeners trivially handle single events

## Prerequisites

- Observer or event listener classes are registered
- Understanding of the event dispatch sequences

## Inputs

- Type of model operation (create, update, delete, soft delete, restore, force delete)
- List of registered listeners for each event

## Workflow

1. Determine the operation type and its dispatch sequence:
   - Create: `saving → creating → INSERT → created → saved`
   - Update: `saving → updating → UPDATE → updated → saved`
   - Delete: `deleting → DELETE → deleted`
   - Soft delete: `deleting → trashing → UPDATE deleted_at → trashed → deleted`
   - Restore: `restoring → UPDATE deleted_at = NULL → restored`
2. Register `saving` for validation common to both create and update:
   ```
   public function saving(Order $order): ?bool { /* shared validation */ }
   ```
3. Register `creating` or `updating` for operation-specific logic:
   ```
   public function creating(Order $order): ?bool { /* insert-only checks */ }
   public function updating(Order $order): ?bool { /* update-only checks */ }
   ```
4. Use `created`/`updated` when the operation type matters for side effects:
   ```
   public function created(Order $order): void { Mail::send(new WelcomeEmail($order)) }
   ```
5. Handle pivot events separately — their order relative to model events is not guaranteed
6. Only return `false` from `*ing` events (never from `*ed` events)

## Validation Checklist

- [ ] `saving` listeners handle both create and update scenarios
- [ ] `creating` or `updating` used when operation-specific logic is needed
- [ ] `*ing` events used for halting (return false), `*ed` events for side effects
- [ ] `$model->wasRecentlyCreated` used in `saved` when both operations need handling
- [ ] Pivot events are not assumed to fire in any order relative to model events
- [ ] `deleted` and `saved` are treated as independent event chains

## Common Failures

- **Assuming `saved` fires only for one operation**: Writing `saved` logic that only makes sense for inserts (e.g., sending welcome email). It fires on update too. Use `created` instead.
- **Returning false from *ed events**: `saved()` returning `false` has no effect — the operation already committed. Use `saving()` for halting.
- **Order dependency between pivot and model events**: Pivot events may fire before or after model `saved`. Never assume a specific order.

## Decision Points

- **saving + creating vs saving alone**: Use `saving` for shared validation. Use `creating`/`updating` in addition when insert-specific or update-specific checks are needed.
- **wasRecentlyCreated in saved vs separate events**: Use `wasRecentlyCreated` in `saved` for simple distinctions. Use separate `created`/`updated` handlers when the code paths diverge significantly.

## Performance Considerations

- Event dispatch order adds no overhead — listeners are called in sequence regardless of order
- A halting `saving` listener prevents `creating`/`updating` from running — can save DB operations

## Security Considerations

- Halting events in the wrong order (e.g., authorization before validation) could allow invalid data through — keep authorization in `saving` which fires first

## Related Rules

- Rule 1: Never Rely on `saved` Firing Only for Inserts or Only for Updates
- Rule 3: Only Return `false` From `*ing` Events to Halt — Never From `*ed` Events
- Rule 4: Remember That `saving` Wraps `creating`/`updating`
- Rule 5: Handle Pivot Events Separately From Main Model Events

## Related Skills

- Event Catalog for Lifecycle Events
- Event Propagation for Halting Behavior
- Observer Pattern for Lifecycle Hooks

## Success Criteria

- Event listeners fire in the correct sequence for each operation type
- Validation correctly aborts operations via `*ing` events
- Side effects in `*ed` events fire reliably after successful operations
- Pivot events and model events are handled independently
