# State Machine Patterns — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | state-machine-patterns |

## Anti-Patterns

### Stringly-Typed State Assignments
- **Severity:** High
- **Problem:** Assigning status directly with strings: `$order->status = 'shipped'` instead of going through a transition method. This bypasses all validation and can set invalid states.
- **Solution:** Always use `transitionTo()` or shorthand methods for state changes. Make the status attribute non-publicly assignable if possible.

### Missing Terminal State Handling
- **Severity:** Medium
- **Problem:** The transition map allows transitions from terminal states (e.g., delivered → pending) or does not enforce that terminal states have empty transition arrays.
- **Solution:** Terminal states should have an empty allowed transitions array. The `transitionTo()` method will throw when trying to transition from a terminal state.

### Inline Transition Logic in Controllers
- **Severity:** High
- **Problem:** Controller code contains if/else blocks checking status and setting new status directly, duplicating the transition logic across multiple entry points.
- **Solution:** Centralize all transition logic in the model's `transitionTo()` method. Controllers call one domain method per transition.

### No Domain Events on Transitions
- **Severity:** Medium
- **Problem:** The transition method changes state but does not dispatch a domain event. Listeners cannot react to the state change without inspecting the model's dirty attributes.
- **Solution:** Dispatch domain events inside `transitionTo()` for each meaningful state change.
