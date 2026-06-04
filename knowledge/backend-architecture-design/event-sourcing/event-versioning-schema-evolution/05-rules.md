## Rule 1: Event schemas are immutable once stored—never modify published events
---
## Category
Architecture
---
## Rule
Once an event has been stored in the event store or published to the broker, its schema is frozen. All schema changes must be additive or handled via upcasting.
---
## Reason
Modifying published events breaks consumers that depend on the old schema and corrupts the event sourcing audit trail.
---
## Bad Example
```
// Deployed version of OrderPlaced has fields: orderId, total
// Developer removes "total" and adds "subtotal" + "tax"
// Consumers still reading "total" break
```
---
## Good Example
```
// Event v1: OrderPlacedV1 (orderId, total)
// Event v2: OrderPlacedV2 (orderId, subtotal, tax, total — deprecated)
// Consumers can migrate at their own pace
```
---
## Exceptions
When the event has not yet been consumed by any consumer and no replays exist (pre-production only).
---
## Consequences Of Violation
Broken consumers, data corruption, failed replays.
---
## Rule 2: Use upcasters to handle old event versions during read/replay
---
## Category
Architecture
---
## Rule
When loading events from the event store, apply upcasters to transform older event formats to the current version before the aggregate/projector sees them.
---
## Reason
Without upcasters, every consumer must handle every historical event version, leading to scattered version checks and complexity.
---
## Bad Example
```php
class OrderProjector
{
    public function onOrderPlaced(object $event): void
    {
        $total = isset($event->total) ? $event->total : $event->subtotal + $event->tax;
        // scattered version handling
    }
}
```
---
## Good Example
```php
// Upcaster transforms old format
class OrderPlacedUpcaster
{
    public function upcast(array $payload): array
    {
        if (!isset($payload['total']) && isset($payload['subtotal'])) {
            $payload['total'] = $payload['subtotal'] + ($payload['tax'] ?? 0);
        }
        return $payload;
    }
}

// Consumer always sees current format
```
---
## Exceptions
When the transformation is destructive and cannot be automated; the consumer must handle both versions explicitly.
---
## Consequences Of Violation
Versioning logic scattered across all consumers, increased complexity.
---
## Rule 3: Integration events must be backward-compatible and versioned in the event name
---
## Category
Architecture
---
## Rule
Include a version in the integration event name (e.g., `OrderPlacedV1`, `OrderPlacedV2`). Old versions remain published for a deprecation window.
---
## Reason
Backward-compatible events with versioned names allow consumers to migrate independently, one at a time.
---
## Bad Example
```
// Event renamed but same routing key
Event: OrderPlaced → OrderPlaced (but completely different schema)
Consumers break without warning.
```
---
## Good Example
```
Event: OrderPlacedV1 (deprecated, still published for 3 months)
Event: OrderPlacedV2 (new version, new consumers)
Consumer migration: update to V2 within window.
```
---
## Exceptions
When the change is purely additive (adding optional fields) and existing consumers ignore unknown fields.
---
## Consequences Of Violation
Forced coordinated deployments, consumer breakage.
---
## Rule 4: Add fields as optional with defaults to maintain backward compatibility
---
## Category
Architecture
---
## Rule
When extending an event schema, add fields as nullable or with sensible defaults; never make new fields required.
---
## Reason
Required new fields break existing consumers that don't know about the field.
---
## Bad Example
```json
// v2 adds required field "customer_email"
// v1 consumers fail because they don't send it
```
---
## Good Example
```json
// v2 adds optional field "customer_email": null
// v1 consumers: ignore
// v2 consumers: use if present
```
---
## Exceptions
When the field is required for regulatory compliance and old consumers must update.
---
## Consequences Of Violation
Consumer breakage on deploy, blocked deployments.
---
## Rule 5: Test event schema evolution with consumer contract tests
---
## Category
Testing
---
## Rule
Write contract tests (e.g., Pact) for each integration event version; run both against all active consumers to detect breakage.
---
## Reason
Without contract tests, schema changes are checked only at runtime, when consumers break in production.
---
## Bad Example
```
Deploy event v2. Consumers start failing in production.
"No staging test caught this."
```
---
## Good Example
```
Pact verification runs in CI:
- Event v1 contract: all consumers pass ✓
- Event v2 contract: Consumer A fails ✗ (unexpected field)
Developer: "Consumer A needs a migration window."
```
---
## Exceptions
When consumers are internal to the same deployment (monolith); integration test covers both.
---
## Consequences Of Violation
Production breakage, rollback scramble, team friction.
