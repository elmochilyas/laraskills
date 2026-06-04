## Map Incoming Provider Events to Internal Domain Events
---
## Category
Architecture
---
## Rule
Create a dedicated event mapper per provider that transforms raw webhook events into domain events; never process provider-native schemas directly.
---
## Reason
Decoupling provider schemas from domain logic allows provider-agnostic processing and insulates the application from provider schema changes.
---
## Bad Example
```php
class PaymentController {
    public function stripe(Request $request) {
        if ($request->input('type') === 'charge.succeeded') {
            // Stripe-specific logic — coupled to Stripe schema
        }
    }
}
```
---
## Good Example
```php
class StripeEventMapper {
    public function map(array $stripeEvent): PaymentReceived {
        return new PaymentReceived(
            amount: $stripeEvent['data']['object']['amount'],
            currency: $stripeEvent['data']['object']['currency'],
            providerRef: $stripeEvent['id'],
        );
    }
}
// Handle any provider via domain event
EventHandler::handle($mappedEvent);
```
---
## Exceptions
Single-provider systems with stable schemas.
---
## Consequences Of Violation
Provider schema changes break processing logic, difficult to support multiple providers, domain logic coupled to external schemas.
## Keep Mappers Stateless and Versioned
---
## Category
Maintainability
---
## Rule
Implement event mappers as stateless pure functions; version mapping logic for replay compatibility.
---
## Reason
Stateless mappers are testable and deterministic; versioning ensures replay with old mapping logic produces correct results for historical events.
---
## Bad Example
```php
// Uses current time or state — non-deterministic mapping
$mapped->timestamp = now();
```
---
## Good Example
```php
class StripeEventMapperV1 {
    public function map(array $raw, string $receivedAt): PaymentReceived {
        return new PaymentReceived(
            amount: $raw['data']['object']['amount'],
            receivedAt: $receivedAt, // passed in, not generated
        );
    }
}
```
---
## Exceptions
None — mappers must be stateless and versioned.
---
## Consequences Of Violation
Replay produces different results than original processing, event sourcing integrity violated, debugging chaos.
## Log Unmapped Events as Warnings
---
## Category
Observability
---
## Rule
Log all incoming webhook events that don't match any known mapper as warnings; alert on new unknown event types.
---
## Reason
Unknown events may indicate provider schema changes, new event types, or configuration issues; early detection prevents missed processing.
---
## Bad Example
```php
// Unknown event silently ignored — never noticed until customer asks
```
---
## Good Example
```php
if (!$mapper->canMap($event['type'])) {
    Log::warning('Unknown webhook event type', [
        'provider' => 'stripe',
        'type' => $event['type'],
        'webhook_id' => $event['id'],
    ]);
    Metrics::increment('webhook.unknown_event.stripe');
    return; // or store for manual review
}
```
---
## Exceptions
None — always log unknown events.
---
## Consequences Of Violation
Critical webhooks silently missed, undetected provider schema changes, data gaps from unmapped events.
## Store Both Raw and Mapped Events in Event Store
---
## Category
Reliability
---
## Rule
Persist both the raw provider webhook and the mapped domain event in the event store for complete audit trail.
---
## Reason
Raw events preserve provider evidence; mapped events enable domain processing. Both are needed for audit and replay.
---
## Bad Example
```php
// Stores only mapped domain event — loses provider-specific evidence
```
---
## Good Example
```php
$rawEvent = RawWebhook::create(['provider' => 'stripe', 'payload' => $request->getContent()]);
$domainEvent = $mapper->map($rawEvent->payload);
DomainEventStore::store($domainEvent); // mapped version for processing
// Both raw and mapped persist
```
---
## Exceptions
Non-critical events where audit trail isn't required.
---
## Consequences Of Violation
Inability to audit original provider data, reprocessing produces different results, compliance gaps.
## Centralize Tool/Function Schemas
---
## Category
Maintainability
---
## Rule
Define all LLM tool/function schemas in a single registry; reference them from integration points.
---
## Reason
Centralized schema registry ensures consistency across prompts, prevents duplication, and enables schema-wide validation.
---
## Bad Example
```php
// Tool schema hardcoded in multiple places — inconsistent and hard to update
```
---
## Good Example
```php
class ToolRegistry {
    public static function getSchema(string $name): array {
        return match($name) {
            'create_order' => [
                'type' => 'function',
                'function' => [
                    'name' => 'create_order',
                    'parameters' => [
                        'type' => 'object',
                        'properties' => ['product_id' => ['type' => 'string']],
                        'required' => ['product_id'],
                    ],
                ],
            ],
        };
    }
}
```
---
## Exceptions
Simple integrations with a single tool.
---
## Consequences Of Violation
Schema duplication, inconsistent tool definitions across prompts, harder to update and validate.
