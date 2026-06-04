# Skill: Manage Asynchronous Inter-Module Communication via Events

## Purpose
Use domain events for decoupled asynchronous communication between modules: the publisher dispatches an event without knowing about subscribers; subscribers react independently without blocking the publisher.

## When To Use
- Module A needs to notify Module B but doesn't need an immediate response
- Default choice for cross-module communication in a modular monolith
- Breaking dependency cycles between modules

## When NOT To Use
- Module A needs an immediate response from Module B (use sync contracts)
- Within a single module (use direct method calls)
- Event count per request exceeds 10 (flow becomes opaque)

## Prerequisites
- Event classes created in the publishing module
- Laravel event system or independent message bus
- Queue system for async dispatch (Redis, SQS, database)

## Inputs
- Identified cross-module notifications
- Event payload data structure
- Listener behavior per event

## Workflow
1. **Create domain event classes in the publishing module.** Use past-tense names (`OrderPlaced`, `PaymentReceived`). Include only relevant data as immutable constructor parameters (IDs and changed values, not Eloquent models).

2. **Dispatch events at the right time in business operations.** Dispatch after the core operation completes and data is persisted. Use Laravel's `Event::dispatch()` or a dedicated event bus.

3. **Queue cross-module events by default.** Implement `ShouldQueue` on listeners. Slow listeners (email, reports, webhooks) must not block the HTTP response. Sync dispatch only when data consistency requires it.

4. **Create listener classes in subscribing modules.** Each listener class handles one event. Listeners belong in the subscriber's Infrastructure layer. One listener per side effect.

5. **Make listeners idempotent.** Check if the action was already performed before executing. Use a deduplication table or natural idempotency (e.g., INSERT IGNORE, idempotency keys).

6. **Register event-listener mapping.** Use Laravel's `EventServiceProvider` `$listen` array or the subscribing module's service provider. Keep event registration in the subscriber's layer.

7. **Document module events as the async API contract.** Maintain a document per module listing dispatched events, payload structure, and expected listener behavior. Other teams need this for integration.

## Validation Checklist
- [ ] Event classes use past-tense naming
- [ ] Event payloads contain IDs and values, not Eloquent models
- [ ] Cross-module events are queued by default (ShouldQueue)
- [ ] Listeners perform idempotency checks
- [ ] No events used for within-module communication
- [ ] Event dispatch is after data persistence
- [ ] Module events are documented

## Common Failures
- **Events within a single module.** Dispatching and listening within same module — use direct method calls.
- **Too much data in events.** Passing entire Eloquent models — use IDs and DTOs only.
- **Sync events for slow operations.** Email, PDF, or webhook listeners blocking HTTP response.
- **Non-idempotent listeners.** Duplicate events causing duplicate emails, charges, or records.

## Decision Points
- **Queue vs sync dispatch?** Default to queue for cross-module events. Sync only when data consistency for the same response requires it.
- **Idempotency strategy?** Check table (check if record exists) or natural idempotency (database constraints prevent duplicates).

## Performance Considerations
- Queued event dispatch adds ~1-5ms overhead (writing to queue). Listener runs async.
- Sync event handling adds listener execution time to the HTTP response.
- Event count per request should remain under 10 for traceability.

## Security Considerations
- Events are dispatched within the application security context — no additional security isolation.
- Events should not contain sensitive data (passwords, tokens, PII). Use IDs for sensitive data that listeners query on demand.

## Related Rules
- Rule: Queue Cross-Module Events by Default (MMD-07/05-rules.md)
- Rule: Keep Event Payloads Minimal (MMD-07/05-rules.md)
- Rule: Past-Tense Event Naming (MMD-07/05-rules.md)
- Rule: Make Listeners Idempotent (MMD-07/05-rules.md)
- Rule: No Events for Within-Module Communication (MMD-07/05-rules.md)
- Rule: Document Module Events (MMD-07/05-rules.md)
- Rule: Limit Events Per Request (MMD-07/05-rules.md)

## Related Skills
- Manage Sync Inter-Module Communication via Contracts (MMD-06/06-skills.md)
- Define and Dispatch Domain Events (LAP-08/06-skills.md)
- Enforce Module Isolation (MMD-12/06-skills.md)
- Apply CQRS Pattern (CPC-08/06-skills.md)

## Success Criteria
- All asynchronous cross-module communication uses domain events.
- Event payloads are minimal (IDs and DTOs, never Eloquent models).
- Listeners are queued and idempotent.
- Module events are documented as the async API contract.
