# Anti-Patterns: Async Event Mapping

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | integration-architecture |
| Knowledge Unit | Async Event Mapping |
| Difficulty | Expert |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|--------------|----------|----------|
| 1 | Direct Passthrough Without Mapping Layer | Architecture | High |
| 2 | Stateful or Side-Effect-Laden Mappers | Architecture | Medium |
| 3 | Storing Only the Mapped Domain Event | Reliability | High |
| 4 | Unversioned Mapping Logic | Maintenance | Critical |
| 5 | Silent Failure on Unknown Event Types | Observability | Medium |

---

## Anti-Pattern 1: Direct Passthrough Without Mapping Layer

### Category
Architecture

### Description
Processing incoming webhook payloads directly in domain handlers without a mapping layer, coupling the application's business logic to the provider's event schema.

### Why It Happens
Single-provider integrations start simply: the webhook payload is consumed directly. As more providers are added, the coupling grows organically without a deliberate abstraction boundary.

### Warning Signs
- Domain handlers reference provider-specific field names (`$payload->data->object->amount`)
- Adding a new provider requires modifying all downstream event processors
- Provider schema changes cause cascading failures across the application
- Same concepts have different field paths for different providers

### Why Harmful
Provider schema changes become breaking changes across the entire application. Adding or switching providers requires rewriting business logic. The domain model is polluted with provider-specific structures instead of representing business concepts.

### Real-World Consequences
- Stripe schema update requires weeks of regression testing across all payment handlers
- Switching from Stripe to Adyen requires rewriting every event processor, not just the mapping layer
- Provider-specific bugs manifest in domain logic, making debugging harder
- Multi-provider support becomes prohibitively expensive to maintain

### Preferred Alternative
Implement a dedicated event mapper per provider that translates provider-specific webhook events into application domain events. Business logic operates only on domain events.

```php
interface WebhookMapper {
    public function map(WebhookEvent $event): DomainEvent;
}

class StripeChargeSucceededMapper implements WebhookMapper {
    public function map(WebhookEvent $event): PaymentReceived {
        return new PaymentReceived(
            amount: $event->data->object->amount,
            currency: $event->data->object->currency,
            provider: 'stripe',
            providerEventId: $event->id,
        );
    }
}
```

### Refactoring Strategy
1. Define domain event classes for each business concept (PaymentReceived, SubscriptionUpdated)
2. Create mapper interface and per-provider implementations
3. Replace direct payload access in handlers with domain event consumption
4. Route raw webhooks through a mapper registry before dispatching to handlers
5. Write mapper tests with provider fixture data to ensure schema coverage

### Detection Checklist
- [ ] Domain handlers never reference provider-specific field names
- [ ] Adding a new provider only requires a new mapper class
- [ ] Provider schema changes only affect mapper implementations
- [ ] Domain events are provider-agnostic

### Related Rules/Skills/Trees
- Rule: Keep mapping stateless: same input always produces same output
- Rule: Version mapping logic to handle schema evolution separately
- Prerequisite: Domain events, event sourcing fundamentals

---

## Anti-Pattern 2: Stateful or Side-Effect-Laden Mappers

### Category
Architecture

### Description
Event mappers that maintain state between mappings or perform side effects (database writes, API calls) during the mapping process, making them non-deterministic and untestable.

### Why Happens
Developers treat the mapping step as a convenient place to enrich events with additional data, fetching related records or performing validation that requires database access.

### Warning Signs
- Mapper constructor accepts repository or service dependencies
- Mapper calls external APIs or databases during transformation
- Running the same payload through the mapper twice produces different results
- Mapper test requires database seeding or API mocking

### Why Harmful
Stateful/side-effectful mappers cannot be reliably replayed. Event replay is a core benefit of event sourcing; if mapping depends on mutable state, replaying events at a different time may produce different domain events, corrupting projections.

### Real-World Consequences
- Replaying webhook events from last week produces different domain events because external state has changed
- Mapper failures during enrichment block the entire webhook processing pipeline
- Tests are flaky due to database state dependencies
- Cannot test mapping logic with simple fixture data

### Preferred Alternative
Keep mappers as pure functions: input = raw webhook event, output = domain event. Perform enrichment in a separate step (reactor or projector) after mapping is complete.

```php
class PaymentReceivedMapper {
    // Pure function: no dependencies, no side effects
    public function map(WebhookEvent $event): PaymentReceived {
        return new PaymentReceived(
            amount: $event->data->object->amount / 100, // Stripe uses cents
            currency: strtoupper($event->data->object->currency),
        );
    }
}
// Enrichment happens separately in a reactor
class PaymentEnrichmentReactor {
    public function onPaymentReceived(PaymentReceived $event): void {
        $user = User::findByProviderId($event->providerCustomerId);
        $event->setUserId($user->id); // Enrich with local data
    }
}
```

### Refactoring Strategy
1. Extract all side effects and stateful operations from mappers
2. Move enrichment logic to reactors or projectors
3. Remove all constructor dependencies from mapper classes
4. Replace database lookups with event enrichment steps after mapping
5. Add pure-function tests with event fixtures

### Detection Checklist
- [ ] Mappers are stateless: no constructor dependencies
- [ ] Mappers produce identical output for identical input at any time
- [ ] Enrichment happens in separate reactors, not in mappers
- [ ] Mapper tests use only event fixture data (no database or API mocking)

### Related Rules/Skills/Trees
- Rule: Keep mapping stateless: same input always produces same output
- Rule: Validate mapped domain events before dispatching
- Related KU: CQRS/ES (projectors vs reactors separation)

---

## Anti-Pattern 3: Storing Only the Mapped Domain Event

### Category
Reliability

### Description
Storing only the mapped domain event and discarding the raw webhook payload, losing the original provider data needed for audit, reprocessing, or schema migration.

### Why Happens
The mapped domain event contains all the information needed for processing. Developers see no immediate need to store the raw payload, which feels redundant.

### Warning Signs
- Event store contains only domain events; raw webhook payloads are discarded
- Unable to reprocess a webhook with updated mapping logic
- Provider disputes require contacting third-party logs to verify what was sent
- Mapping bugs cannot be fixed retroactively (original data is gone)

### Why Harmful
Raw webhook payloads are the source of truth. Without them, mapping logic bugs become permanent data corruption. Changing mapping for a new provider schema version is impossible because old payloads are unavailable for retransformation. Compliance audits cannot verify what the provider actually sent versus what was processed.

### Real-World Consequences
- A mapping bug corrupts 10,000 payment amounts; cannot reprocess with corrected mapper
- Compliance audit finds unrecoverable gap: raw payloads not preserved
- Provider changes date field format; old events cannot be migrated to new format
- Debugging production issues requires re-requesting webhook samples from provider

### Preferred Alternative
Store both the raw webhook event and the mapped domain event in the event store. The raw event is immutable; the domain event can be regenerated with updated mapping during replay.

```php
class WebhookReceived {
    public function __construct(
        public readonly string $provider,
        public readonly array $rawPayload,   // Immutable source of truth
        public readonly string $eventType,
    ) {}
}

class PaymentReceived {
    public function __construct(
        public readonly int $amount,
        public readonly string $currency,
        public readonly string $providerEventId,
    ) {}
}
```

### Refactoring Strategy
1. Add raw webhook payload storage alongside existing domain event storage
2. Create a `WebhookReceived` event type that stores and preserves the raw payload
3. Update mapping pipeline to store raw event before mapping to domain event
4. Implement replay capability that re-runs mapping logic on raw payloads
5. Add compliance reports linking raw payloads to processed domain events

### Detection Checklist
- [ ] Raw webhook payload is stored before any processing
- [ ] Raw payloads are immutable (append-only storage)
- [ ] Replay uses raw payloads, not previously mapped domain events
- [ ] Compliance audit trail includes both raw and mapped events
- [ ] Mapping bugs can be fixed retroactively by replaying raw payloads

### Related Rules/Skills/Trees
- Rule: Both raw and mapped events stored in event store
- Skill: Event Mapper as a dedicated class per provider with interface
- Related KU: Event-Driven Architecture with Webhook Event Sourcing

---

## Anti-Pattern 4: Unversioned Mapping Logic

### Category
Maintenance

### Description
Modifying mapping logic in-place without versioning, so that replayed events use the current mapper which may not handle the schema that was current when the event was originally received.

### Why Happens
Mapping logic evolves with provider schema changes. Developers update the mapper to handle the new schema without considering that old events in the store use the old schema that the updated mapper may break on.

### Warning Signs
- Mapper class has no version identifier
- Old event replays fail with "undefined index" or type errors
- Provider schema changes are handled by modifying existing mapper code
- No test suite covering old schema versions

### Why Harmful
Replaying events from months ago with current mapping logic fails because the current mapper expects the newest schema. Event replay is a core benefit of event sourcing; unversioned mapping breaks this guarantee entirely.

### Real-World Consequences
- Disaster recovery replay fails: old events can't be processed by new mapper
- Time-travel debugging impossible: cannot see how old events looked at original time
- Schema migration requires manual event-by-event fixes in production
- Compliance time-window audit (e.g., "show all payments from Jan 2025") throws errors

### Preferred Alternative
Version mapping logic and use a mapper registry that selects the correct version based on event timestamp or schema version field.

```php
class V1PaymentReceivedMapper implements WebhookMapper {
    public function map(WebhookEvent $event): PaymentReceived {
        return new PaymentReceived(
            amount: $event->data->object->amount / 100,
            currency: $event->data->object->currency,
        );
    }
}

class V2PaymentReceivedMapper implements WebhookMapper {
    public function map(WebhookEvent $event): PaymentReceived {
        return new PaymentReceived(
            amount: (int) ($event->data->object->amount_cents ?? $event->data->object->amount),
            currency: strtoupper($event->data->object->currency),
        );
    }
}
```

### Refactoring Strategy
1. Extract current mapping logic into a versioned class (V1)
2. Add a version selector based on event timestamp or schema version header
3. When provider schema changes, create a new mapper version (V2) rather than modifying V1
4. Test both versions with fixtures from their respective time periods
5. Document schema change history alongside mapper versions

### Detection Checklist
- [ ] Each mapper has a version identifier
- [ ] Old events are replayed with the mapper version active at their time
- [ ] New mapper versions are created, not in-place modifications
- [ ] Fixture tests exist for each mapper version
- [ ] Schema changes are documented with version mappings

### Related Rules/Skills/Trees
- Rule: Version mapping logic to handle schema evolution separately
- Rule: Mapping configuration externalized for provider-schema changes
- Related KU: Event-Driven Architecture with Webhook Event Sourcing (event versioning)

---

## Anti-Pattern 5: Silent Failure on Unknown Event Types

### Category
Observability

### Description
Ignoring or silently dropping incoming webhook event types that have no corresponding mapper, with no alerting or logging to detect unknown events.

### Why Happens
Unknown events don't crash the application; they just pass through without mapping. Without explicit handling, they produce no error and go unnoticed until a business process fails.

### Warning Signs
- Mapper registry silently skips unmapped event types
- No metrics or alerts for unmapped webhook events
- Provider adds new event types but application never processes them
- Business users notice missing functionality before developers

### Why Harmful
Providers frequently add new event types for new features. Silently dropping unknown events means new capabilities are missed. During provider schema migrations, temporary unmapped events can cause data loss without detection.

### Real-World Consequences
- New Stripe payment method types go unprocessed for weeks
- Adyen adds a fraud detection event; application never flags fraudulent transactions
- Provider schema migration produces unknown events for days; all are silently dropped
- Compliance violation: certain events must be processed by regulation

### Preferred Alternative
Log unknown event types prominently, alert on them, and route them to a dead letter queue for investigation. Add a dashboard showing mapping coverage per provider.

```php
class EventMapperRegistry {
    public function map(WebhookEvent $event): ?DomainEvent {
        $mapper = $this->mappers[$event->type] ?? null;
        if (!$mapper) {
            Log::warning('Unknown webhook event type', [
                'provider' => $event->provider,
                'type' => $event->type,
                'payload' => $event->rawPayload,
            ]);
            Monitor::increment("webhook.unknown_event.{$event->provider}");
            throw new UnmappedEventException($event->type);
        }
        return $mapper->map($event);
    }
}
```

### Refactoring Strategy
1. Add explicit event type registry that throws/logs on unknown types
2. Create alert for unknown event types exceeding threshold
3. Add mapping coverage dashboard per provider
4. Create dead letter queue for unmapped events with manual retry capability
5. Subscribe to provider changelogs to proactively add new event type mappers

### Detection Checklist
- [ ] Unknown event types are logged with full payload context
- [ ] Alert exists for unknown event type rate > 0
- [ ] Mapping coverage is visible per provider
- [ ] Dead letter queue captures unmapped events for manual processing
- [ ] Provider changelogs are monitored for new event types

### Related Rules/Skills/Trees
- Rule: Log unmapped/unknown webhook events for monitoring provider changes
- Skill: Reactors for alerting on unmapped event types
- Related KU: Webhook Receiving (dead letter queue pattern)
