# Domain Event Patterns — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | laravel-eloquent-domain-modeling |
| Subdomain | domain-modeling-patterns |
| Knowledge Unit | domain-event-patterns |

## Rules

### Rule 1: Dispatch events from domain methods
Domain events must be dispatched from the model's domain method that triggers the state change, not from the controller or action class. This guarantees the event fires for every state change, regardless of caller.

### Rule 2: Name events in past tense
Event class names must be in past tense (OrderPlaced, PaymentReceived, InvoicePaid) to reflect that the event has already occurred and cannot be undone.

### Rule 3: Keep event payloads minimal
Event payloads should prefer IDs over full model instances, especially for queued listeners. This prevents serialization issues and reduces memory usage.

### Rule 4: Queue expensive listeners
Listeners that perform expensive operations (email sending, API calls, report generation) should implement ShouldQueue to run asynchronously.

### Rule 5: Test that events are dispatched
Write tests that assert events are dispatched when the corresponding domain method is called and not dispatched when the method should throw.
