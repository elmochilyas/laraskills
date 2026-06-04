# Skill: Set Up Halting Event Listener with Proper Logging

## Purpose

Implement a halting (`*ing`) event listener that validates model state, logs the reason for halting, and returns `false` to abort the database operation — with clear, debuggable failure messages.

## When To Use

- Preventing invalid model state from being persisted
- Authorizing delete/update operations based on business rules
- Enforcing domain invariants at the ORM level

## When NOT To Use

- The validation can be done in a FormRequest (more explicit and discoverable)
- The validation is the model's own responsibility (override `save()` instead)
- The listener may execute on a queue (halting has no effect in deferred context)

## Prerequisites

- Observer or closure-based event listener is registered on the model
- The listener is synchronous (not queued)

## Inputs

- Halting condition (boolean expression)
- Log message and context for debugging
- Return value (`false` to halt, `null` to continue)

## Workflow

1. Identify the operation to validate (create, update, delete, etc.) and use the corresponding `*ing` event
2. Implement the halting condition with an early return pattern:
   ```
   public function saving(Order $order): ?bool
   {
       if ($order->total_cents < 0) {
           Log::warning('Attempted save with negative total', [
               'order_id' => $order->id,
               'total_cents' => $order->total_cents,
           ])
           return false
       }
       return null
   }
   ```
3. Return `null` (not `true`) when the operation should proceed:
   - `null` or no return = continue
   - Only strict `return false` halts
4. For the `replicating` event, halt only for mutation control:
   ```
   public function replicating(Order $order): ?bool
   {
       if ($order->is_archived) { return false }
       return null
   }
   ```

## Validation Checklist

- [ ] `return false` is only used in `*ing` events (not `*ed` events)
- [ ] A log warning or exception precedes every `return false`
- [ ] `null` is returned (not `true`) when the operation should continue
- [ ] Halting is not used as the primary validation mechanism (FormRequest preferred)
- [ ] Event halting is not relied upon in queued listeners
- [ ] `replicating` halting is used only for copy control, not data validation

## Common Failures

- **Silent halt**: Returning `false` without logging or throwing. Developers have no indication why the operation failed.
- **Halting in *ed event**: `saved()` returning false has no effect — the data is already persisted. The developer thinks the operation was aborted but it wasn't.
- **Primary validation via event**: All validation logic in observers instead of FormRequest. Business rules are hidden and hard to discover.
- **Queued listener halting**: `ShouldQueue` listener returns `false` but the save already committed. Halting only works synchronously.

## Decision Points

- **Log vs throw**: Log a warning and return `false` for recoverable validation failures. Throw an exception when halting indicates a programming error.
- **Event halting vs FormRequest**: Use FormRequest for primary data validation (explicit, at the entry point). Use event halting for cross-cutting constraints that must apply regardless of entry point.

## Performance Considerations

- Halting events prevent the database operation — can save I/O for invalid operations
- Logging before halting adds minimal overhead

## Security Considerations

- Halting events can prevent unauthorized operations — but they're invisible at the call site
- Prefer explicit policy/authorization checks over hidden event halting for access control

## Related Rules

- Rule 1: Only Return `false` From `*ing` Events to Halt the Operation
- Rule 2: Throw an Exception or Log Before Returning `false`
- Rule 3: Return `null` (Not `true`) From Halting Events When You Want the Operation to Continue
- Rule 4: Do Not Use Event Halting as the Primary Validation Mechanism
- Rule 5: Never Rely on Event Halting in Queued Listeners

## Related Skills

- Event Dispatch Order for Sequencing
- Event Catalog for Lifecycle Events
- Observer Pattern for Lifecycle Hooks

## Success Criteria

- Invalid operations are aborted with a logged reason
- Valid operations proceed without interruption
- No silent halts — every `return false` is preceded by logging
- Primary validation remains in FormRequest, not hidden in observers
- Halting is never relied upon in queued/deferred contexts
