# Domain Event Patterns — Anti-Patterns

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | domain-event-patterns |

## Anti-Patterns

### Dispatching Events from Controllers
- **Severity:** High
- **Problem:** The controller dispatches the event after calling the domain method. If another controller, CLI command, or queue job also triggers the same state change, it must remember to dispatch the event too.
- **Solution:** Dispatch from the domain method itself. The event is guaranteed to fire for every state change, regardless of the entry point.

### Using Full Model Instances as Event Payloads
- **Severity:** Medium
- **Problem:** Passing the full Eloquent model as event payload causes serialization issues when listeners are queued. Serializing the model includes relations, making the payload large and fragile.
- **Solution:** Pass only the model's ID or a minimal DTO in the event payload. Listeners re-fetch the model if needed.

### Generic Single Event for All Changes
- **Severity:** Medium
- **Problem:** Using a single `OrderChanged` event with a type discriminator instead of separate `OrderPlaced`, `OrderShipped`, `OrderCancelled` events.
- **Solution:** Create one event class per distinct business occurrence. Makes listener registration explicit and self-documenting.

### Synchronous Expensive Listeners
- **Severity:** High
- **Problem:** An email listener runs synchronously in the request, adding latency and coupling the response time to an external service.
- **Solution:** Implement `ShouldQueue` on expensive listeners to run them asynchronously.
