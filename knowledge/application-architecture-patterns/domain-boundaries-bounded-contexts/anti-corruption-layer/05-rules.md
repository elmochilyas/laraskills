# Rule: Always use ACL when integrating with a system that has a different domain model
---
## Category
Architecture
---
## Rule
When integrating with a legacy or external system whose domain model differs from your context's model, always build an Anti-Corruption Layer.
---
## Reason
Directly using a foreign model corrupts your context's domain language and schema. The context loses independence because changes in the foreign system propagate into your model.
---
## Bad Example
```php
// Directly using legacy system's model in new context
use LegacySystem\Models\Order; // legacy schema leaks into new context
$order = Order::find($id);
return $order->order_total_amount; // legacy naming convention in new context
```
---
## Good Example
```php
// ACL translates between legacy model and context model
class LegacyOrderTranslator
{
    public function toDomainOrder(array $legacyData): Order
    {
        return new Order(
            id: $legacyData['order_id'],
            total: Money::fromCents($legacyData['order_total_amount'] * 100),
            status: OrderStatus::fromLegacyCode($legacyData['order_status'])
        );
    }
}
```
---
## Exceptions
When the external system's model closely aligns with your context's model and changes infrequently.
---
## Consequences Of Violation
Foreign schema leaks into context; domain language is corrupted; legacy changes break context.

# Rule: Own the anti-corruption layer in the consuming context
---
## Category
Architecture
---
## Rule
Place the anti-corruption layer within the consuming context's boundary, not in the upstream system.
---
## Reason
The consuming context is responsible for protecting its own model integrity. The upstream system should not be aware of or modified for translation logic.
---
## Bad Example
```php
// ACL placed in the upstream legacy system
// Legacy system needs to know about the new context's model
class LegacySystem
{
    public function toDomainOrder(): DomainOrder { /* translation in legacy */ }
}
```
---
## Good Example
```php
// ACL lives in the consuming context
namespace App\Domains\Billing\AntiCorruption;

class LegacyOrderTranslator
{
    public function toDomainOrder(LegacyOrder $legacy): DomainOrder { /* ... */ }
}

class LegacyBillingFacade
{
    public function __construct(
        private LegacyOrderTranslator $translator,
        private LegacyApiClient $client
    ) {}

    public function getOrder(int $id): DomainOrder
    {
        $legacyData = $this->client->fetchOrder($id);
        return $this->translator->toDomainOrder($legacyData);
    }
}
```
---
## Exceptions
When the upstream system provides a standard, well-maintained SDK that already translates to a clean model.
---
## Consequences Of Violation
Consuming context's model is exposed to upstream system changes and foreign concepts.

# Rule: Translate conceptually, not just syntactically
---
## Category
Design
---
## Rule
Ensure the ACL translates concepts (behavior, invariants) between models, not just field names.
---
## Reason
A thin pass-through that renames fields but preserves the foreign system's conceptual model doesn't protect your domain. True translation converts the foreign concept into your context's native concept.
---
## Bad Example
```php
// Thin ACL — only field name translation, no concept conversion
class ThinTranslator
{
    public function toOrder(array $legacy): Order
    {
        return new Order(
            id: $legacy['order_id'],
            total: $legacy['total_amount'],
            status: $legacy['order_status']
        );
    }
}
```
---
## Good Example
```php
// True conceptual translation
class FullTranslator
{
    public function toOrder(array $legacy): Order
    {
        $orderStatus = match ($legacy['order_status']) {
            'P' => OrderStatus::Pending,
            'A' => OrderStatus::Approved,
            'C' => OrderStatus::Completed,
            'X' => OrderStatus::Cancelled,
            default => OrderStatus::Unknown,
        };

        $total = Money::fromCents(
            (int) round($legacy['total_amount'] * 100),
            Currency::from($legacy['currency_code'])
        );

        return new Order(
            id: $legacy['order_id'],
            total: $total,
            status: $orderStatus
        );
    }
}
```
---
## Exceptions
When the external model is already well-aligned and only field names differ.
---
## Consequences Of Violation
Domain model still reflects legacy thinking; extraction or migration later is as hard as before.

# Rule: Structure ACL with Translator, Facade, and Adapter sub-patterns
---
## Category
Design
---
## Rule
Structure the ACL using three distinct sub-patterns: Translator (conversion), Facade (simplification), Adapter (port implementation).
---
## Reason
Separating translation, interface simplification, and contract implementation keeps the ACL maintainable and testable. Each component has a single responsibility.
---
## Bad Example
```php
// Monolithic ACL that does everything
class LegacyIntegration
{
    public function fetchOrder(int $id): Order
    {
        $response = Http::get("legacy/api/orders/$id");
        $data = $response->json();
        return new Order(/* translation */);
    }
}
```
---
## Good Example
```php
interface BillingPort
{
    public function getOrder(int $id): Order;
}

class LegacyOrderAdapter implements BillingPort
{
    public function __construct(
        private LegacyOrderFacade $facade,
        private LegacyOrderTranslator $translator
    ) {}

    public function getOrder(int $id): Order
    {
        $legacyDto = $this->facade->fetch($id);
        return $this->translator->toDomainOrder($legacyDto);
    }
}

class LegacyOrderFacade
{
    public function fetch(int $id): LegacyOrderDto
    {
        $response = Http::withBasicAuth(config('legacy.api_key'), '')
            ->get("legacy/api/orders/$id");
        return LegacyOrderDto::fromResponse($response->json());
    }
}

class LegacyOrderTranslator
{
    public function toDomainOrder(LegacyOrderDto $dto): Order { /* ... */ }
}
```
---
## Exceptions
Very simple integrations where a single service class suffices.
---
## Consequences Of Violation
ACL is hard to test, maintain, or evolve; any change to API or translation touches the same class.

# Rule: Do not expose legacy system details through the ACL
---
## Category
Architecture
---
## Rule
Ensure the ACL hides all legacy system implementation details (table names, API endpoints, data formats) from the consuming context.
---
## Reason
If legacy details leak through the ACL, the consuming context becomes coupled to the legacy implementation. Switching away from legacy requires changes to the consuming context.
---
## Bad Example
```php
// Legacy API endpoint structure leaked
class LegacyFacade
{
    // Consuming context knows about "legacy-sap-billing/api/v2/orders"
    public function fetchOrder(int $id): array
    {
        return Http::get("legacy-sap-billing/api/v2/orders/$id")->json();
    }
}
```
---
## Good Example
```php
// All legacy details encapsulated behind Adapter interface
interface OrderProvider
{
    public function getOrder(int $id): Order;
}

class LegacyOrderAdapter implements OrderProvider
{
    public function getOrder(int $id): Order
    {
        return $this->translator->toDomainOrder(
            $this->client->call('GetOrder', ['OrderId' => $id])
        );
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Context is coupled to legacy implementation; replacing legacy system requires changes to the consuming context.

# Rule: Provide bidirectional translation when sending data to external system
---
## Category
Design
---
## Rule
When the consuming context writes data to the external system, implement two-way translation in the ACL (inbound and outbound).
---
## Reason
Single-direction ACL protects reads but not writes. Outbound commands must be translated from the context's model to the external system's format to maintain model integrity in both directions.
---
## Bad Example
```php
// Only inbound translation — outbound data passes through raw
class LegacyOrderTranslator
{
    public function toDomainOrder(array $legacy): Order { /* inbound */ }
    // No toLegacy method
}
```
---
## Good Example
```php
// Bidirectional translation
class LegacyOrderTranslator
{
    public function toDomainOrder(array $legacyData): Order
    {
        return new Order(
            id: $legacyData['OrderID'],
            total: Money::fromCents($legacyData['TotalCents']),
            status: $this->translateStatus($legacyData['StatusCode'])
        );
    }

    public function toLegacyArray(Order $order): array
    {
        return [
            'OrderID' => $order->id,
            'TotalCents' => $order->total->toCents(),
            'StatusCode' => $this->reverseStatus($order->status),
        ];
    }
}
```
---
## Exceptions
Read-only integrations where the context only consumes data and never writes back.
---
## Consequences Of Violation
Write operations bypass model integrity; external system receives unconverted data causing semantic mismatch.

# Rule: Test ACL translation logic in isolation
---
## Category
Testing
---
## Rule
Unit test the ACL's translation logic in isolation by mocking the external system facade and verifying translation output.
---
## Reason
ACL translation logic contains business-critical conversion rules (status mapping, currency conversion). Untested translation silently produces incorrect domain objects.
---
## Bad Example
```php
// No ACL tests — translation logic only tested through integration
public function testOrderRetrieval(): void
{
    $response = $this->get('/orders/1');
    // Tests full stack but doesn't verify translation logic
}
```
---
## Good Example
```php
// ACL translation tested in isolation
public function test_translates_legacy_status_to_domain_enum(): void
{
    $translator = new LegacyOrderTranslator();
    $legacyData = ['OrderID' => 1, 'StatusCode' => 'C', 'TotalCents' => 2500];

    $order = $translator->toDomainOrder($legacyData);

    $this->assertEquals(OrderStatus::Completed, $order->status);
}

public function test_translates_domain_to_legacy_format(): void
{
    $translator = new LegacyOrderTranslator();
    $order = new Order(id: 1, status: OrderStatus::Completed, total: Money::fromCents(2500));

    $legacyData = $translator->toLegacyArray($order);

    $this->assertEquals('C', $legacyData['StatusCode']);
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Translation errors go undetected until production, causing incorrect domain objects and data corruption.

# Rule: Update ACL when the external system changes
---
## Category
Maintainability
---
## Rule
Update the ACL whenever the external system's schema, API, or behavior changes; treat ACL changes as part of the integration maintenance.
---
## Reason
An outdated ACL that silently produces incorrect translations is worse than no ACL — it corrupts data while appearing to work correctly.
---
## Bad Example
```php
// Legacy system changed status codes but ACL not updated
// Status 'D' (Dispatched) now also returns as 'C'
// ACL still maps 'C' → Completed but now includes Dispatched orders
```
---
## Good Example
```php
// ACL update is triggered by external system change notification
class LegacyOrderTranslator
{
    public function __construct(
        private LegacyStatusRegistry $statusRegistry
    ) {}

    public function toDomainOrder(array $legacy): Order
    {
        $status = $this->statusRegistry->getCurrentMapping($legacy['StatusCode']);
        return new Order(/* ... */ status: $status);
    }
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Silent data corruption; domain objects with incorrect translations propagate through the system.

# Rule: Do not use ACL for simple field-mapping integrations
---
## Category
Design
---
## Rule
Use a simple service method, not a full ACL, when the external system's model closely aligns with your context's model and only field names differ.
---
## Reason
ACL adds complexity (Translator, Facade, Adapter) that is unnecessary when the foreign model is already well-aligned. Premature ACL architecture slows development.
---
## Bad Example
```php
// Over-engineered ACL for a simple, well-aligned integration
class SimpleApiAdapter implements SimplePort
{
    public function __construct(
        private SimpleApiFacade $facade,
        private SimpleTranslator $translator
    ) {}
}
```
---
## Good Example
```php
// Simple service method for closely aligned models
class ExternalUserService
{
    public function __construct(
        private ExternalUserApi $api
    ) {}

    public function getUser(int $id): User
    {
        $external = $this->api->fetch($id);
        return new User(
            id: $external['id'],
            name: $external['full_name'],
            email: $external['email_address']
        );
    }
}
```
---
## Exceptions
When the integration is expected to diverge significantly in the future (ACL now saves rework later).
---
## Consequences Of Violation
Unnecessary architectural complexity for simple, stable integrations.

# Rule: Never let legacy models be imported directly into the consuming context
---
## Category
Code Organization
---
## Rule
Enforce that no legacy system class, Eloquent model, or DTO is imported directly in the consuming context's domain layer — all interaction goes through the ACL.
---
## Reason
Direct import creates implicit coupling. Any change to the legacy model's API or schema breaks the consumer immediately. The ACL is the only allowed bridge.
---
## Bad Example
```php
// Direct import bypassing ACL
use LegacySystem\Models\LegacyOrder; // BAD
class OrderController
{
    public function show(int $id): Order
    {
        $legacy = LegacyOrder::find($id);
        return new Order(
            id: $legacy->order_id,
            total: $legacy->total_amount
        );
    }
}
```
---
## Good Example
```php
// Only the ACL imports legacy classes
namespace App\Domains\Billing\AntiCorruption;
use LegacySystem\Models\LegacyOrder; // allowed only in ACL

class LegacyOrderAdapter implements OrderProvider
{
    public function getOrder(int $id): Order
    {
        $legacy = LegacyOrder::find($id);
        return $this->translator->toDomainOrder($legacy);
    }
}

// Controller never sees legacy
class OrderController
{
    public function __construct(
        private OrderProvider $orders // depends on interface
    ) {}
}
```
---
## Exceptions
No common exceptions.
---
## Consequences Of Violation
Context is coupled to legacy schema; replacing legacy system requires changing every consumer.
