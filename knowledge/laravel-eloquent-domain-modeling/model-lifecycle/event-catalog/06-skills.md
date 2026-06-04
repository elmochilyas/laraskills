# Skill: Set Up Before/After Event Pairing with Correct Halting Behavior

## Purpose

Configure observer methods using the correct event phase — `*ing` events for validation (which can halt the operation) and `*ed` events for side effects (which cannot halt) — ensuring reliable model lifecycle handling.

## When To Use

- Writing observer methods that need to validate model state
- Adding side effects (cache, logs) that should run after successful persistence
- Distinguishing between insert and update operations

## When NOT To Use

- The validation can be done in a FormRequest (prefer centralized validation)
- The side effect is complex enough to warrant a dedicated job (dispatch to queue)

## Prerequisites

- Observer class exists or is being created
- Understanding of which events map to which database operations

## Inputs

- List of events to listen to (`saving`, `creating`, `created`, `saving`, `saved`, etc.)
- Validation logic for `*ing` events
- Side effect logic for `*ed` events

## Workflow

1. Identify the correct event phase for each listener:
   - Validation/authorization → `*ing` events (can halt by returning `false`)
   - Side effects (cache, logs) → `*ed` events (cannot halt, operation already done)
2. Implement validation in the `*ing` event with explicit `return false`:
   ```
   public function saving(Order $order): ?bool
   {
       if ($order->total_cents < 0) { return false }
       return null
   }
   ```
3. Implement side effects in the `*ed` event:
   ```
   public function saved(Order $order): void
   {
       Cache::forget("order:{$order->id}")
   }
   ```
4. Use `created`/`updated` when the operation type matters; use `saved` when it doesn't:
   ```
   public function created(Order $order): void { /* insert only */ }
   public function updated(Order $order): void { /* update only */ }
   public function saved(Order $order): void   { /* both insert and update */ }
   ```
5. Register `replicating` event to modify attributes before model duplication
6. Handle pivot events (`pivotAttached`, etc.) in separate dedicated observers

## Validation Checklist

- [ ] `*ing` events used for validation (can halt with `return false`)
- [ ] `*ed` events used for side effects (no attempt to halt)
- [ ] `created`/`updated` used when operation type matters; `saved` used for both
- [ ] `replicating` used to reset attributes before `replicate()`
- [ ] Pivot events are handled in separate observers from model events
- [ ] Soft-delete events (`trashed`, `restored`) only used on soft-deletable models
- [ ] `retrieved` not used for authorization

## Common Failures

- **Validation in *ed event**: Returning `false` from `saved()` has no effect — the operation already committed. Use `saving()` instead.
- **Misusing `saved` when `created`/`updated` is needed**: Using `$order->wasRecentlyCreated` check instead of registering separate `created` and `updated` handlers. Use separate methods for clarity.
- **Dead soft-delete listeners**: Registering `trashed` on a model without `SoftDeletes` trait. The event never fires.

## Decision Points

- **saving vs creating/updating**: Use `saving` for validation common to both insert and update. Use `creating`/`updating` for operation-specific logic.
- **saved vs created/updated**: Use `saved` when the same side effect applies to both operations. Use `created`/`updated` when the logic differs.

## Performance Considerations

- Each observer method adds a method call — negligible for reasonable observer counts
- `*ed` events fire after the DB operation — they cannot slow down the write itself

## Security Considerations

- `retrieved` is too late for authorization — use policies or query scopes instead
- `*ing` events can abort operations — ensure they don't become a vector for denial of service

## Related Rules

- Rule 1: Use `*ing` Events for Validation and Authorization, `*ed` Events for Side Effects
- Rule 2: Use `created`/`updated` When the Operation Type Matters; Use `saved` When It Does Not
- Rule 4: Use `replicating` to Modify Attributes Before Replication
- Rule 6: Register Pivot Event Listeners Separately From Model Event Listeners

## Related Skills

- Event Dispatch Order for Sequencing
- Event Propagation for Halting Behavior
- Observer Pattern for Lifecycle Hooks

## Success Criteria

- Validation in `*ing` events correctly aborts invalid operations
- Side effects in `*ed` events run reliably after successful persistence
- Operation type (insert vs update) is handled with the appropriate event
- Pivot events are cleanly separated from model events
