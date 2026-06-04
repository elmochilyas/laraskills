# Rules: Formalized contracts between contexts

## Rule 1: Define contracts at every context boundary
---
## Category
Architecture
---
## Rule
Always define a formal contract (interface + DTO) for every communicating pair of bounded contexts.
---
## Reason
Without a defined contract, changes in one context silently break consumers. Contracts decouple producer implementation from consumer expectations.
---
## Bad Example
```php
// Consumer directly calls the producer's Eloquent model
$order = Order::find($id);
$order->update(['status' => 'shipped']);
```
---
## Good Example
```php
// Contract defined as interface + DTO
interface OrderServiceInterface
{
    public function shipOrder(ShipOrderDto $dto): ShipmentConfirmationDto;
}

// Consumer depends only on the interface
public function __construct(
    private OrderServiceInterface $orderService
) {}
```
---
## Exceptions
Internal interfaces within the same bounded context do not require formal cross-context contracts.
---
## Consequences Of Violation
Tight coupling between contexts; changes in one context break consumers without warning; integration tests fail unexpectedly.
---

## Rule 2: Use DTOs instead of Eloquent models in contracts
---
## Category
Code Organization | Maintainability
---
## Rule
Never pass Eloquent models or ORM entities across context boundaries in contracts — use readonly DTOs.
---
## Reason
Eloquent models expose the producer's internal persistence layer. Consumers become coupled to schema details. DTOs are immutable and independent of the persistence implementation.
---
## Bad Example
```php
interface OrderServiceInterface
{
    public function placeOrder(Order $order): Order; // Couples consumer to Eloquent
}
```
---
## Good Example
```php
readonly class PlaceOrderDto
{
    public function __construct(
        public string $customerId,
        public array $lineItems,
        public string $currency,
    ) {}
}

readonly class OrderConfirmationDto
{
    public function __construct(
        public string $orderId,
        public string $status,
        public float $total,
    ) {}
}

interface OrderServiceInterface
{
    public function placeOrder(PlaceOrderDto $dto): OrderConfirmationDto;
}
```
---
## Exceptions
Within a single bounded context, sharing Eloquent models is acceptable.
---
## Consequences Of Violation
Contract reflects implementation details; schema changes in the producer cascade to consumers; DTO immutability guarantees are lost.
---

## Rule 3: Version contracts on breaking changes
---
## Category
Maintainability | Reliability
---
## Always version contracts when making backward-incompatible changes. Never change a contract without incrementing its version.
---
## Reason
Consumers pin to a major version and upgrade independently. Breaking changes (removing fields, changing types, adding required fields) without versioning silently break consumers in production.
---
## Bad Example
```php
// V1 contract
class ShipOrderDto
{
    public function __construct(public string $orderId) {}
}

// Same class updated — required field added, no version bump
class ShipOrderDto
{
    public function __construct(
        public string $orderId,
        public string $customerEmail, // Breaking change!
    ) {}
}
```
---
## Good Example
```php
// V1 contract — stable, never mutated
class ShipOrderDtoV1
{
    public function __construct(public string $orderId) {}
}

// V2 contract — new version with additional field
class ShipOrderDtoV2
{
    public function __construct(
        public string $orderId,
        public string $customerEmail,
    ) {}
}

// Producer implements both
interface OrderServiceInterface
{
    public function shipOrderV1(ShipOrderDtoV1 $dto): ShipmentConfirmationDto;
    public function shipOrderV2(ShipOrderDtoV2 $dto): ShipmentConfirmationDto;
}
```
---
## Exceptions
Additive changes (new optional fields, new methods) that don't break existing consumers do not require a new version.
---
## Consequences Of Violation
Production outages when consumers receive unexpected data; emergency rollbacks; loss of consumer trust in the contract.
---

## Rule 4: Use semantic versioning for contracts
---
## Category
Maintainability
---
## Use semantic versioning (MAJOR.MINOR.PATCH) for all cross-context contracts.
---
## Reason
Major = breaking change, Minor = additive change, Patch = bug fix. Consumers safely pin to a major version and upgrade at their own pace.
---
## Bad Example
```php
// Version numbers present but meaningless — no policy behind them
class OrderServiceV2
{
    // "V2" in the class name but no changelog or migration guide
}
```
---
## Good Example
```php
// Contract version is documented and follows semver
// v1.0.0 — initial release
// v1.1.0 — added getOrderHistory() (backward-compatible)
// v2.0.0 — changed placeOrder() return type (breaking)

interface OrderServiceContract
{
    public const VERSION = '2.0.0';

    public function placeOrder(PlaceOrderDto $dto): OrderConfirmationDto;
    public function getOrderHistory(string $customerId): array;
}
```
---
## Exceptions
None. Every contract must have a clear versioning strategy.
---
## Consequences Of Violation
Consumers cannot determine what changed; upgrade risk is unknown; incompatible versions deployed together cause runtime failures.
---

## Rule 5: Contract-test both producer and consumer
---
## Category
Testing
---
## Always write contract tests that both the producer and consumer run against the same contract definition.
---
## Reason
The producer verifies it satisfies the contract. The consumer verifies it can work with the contract. Without both, either side can drift from the contract without detection.
---
## Bad Example
```php
// Only the producer tests
class OrderServiceTest extends TestCase
{
    public function test_it_places_order(): void
    {
        // Producer tests its implementation but no consumer-side contract test
    }
}
```
---
## Good Example
```php
// Shared contract test — runs in both contexts
class OrderServiceContractTest extends TestCase
{
    /** @test */
    public function producer_satisfies_contract(): void
    {
        $service = app(OrderServiceInterface::class);
        $result = $service->placeOrder(new PlaceOrderDto(
            customerId: 'c1',
            lineItems: [['sku' => 'ABC', 'qty' => 1]],
            currency: 'USD',
        ));

        $this->assertInstanceOf(OrderConfirmationDto::class, $result);
        $this->assertNotEmpty($result->orderId);
    }

    /** @test */
    public function consumer_can_use_contract(): void
    {
        $dto = new PlaceOrderDto(
            customerId: 'c1',
            lineItems: [['sku' => 'ABC', 'qty' => 1]],
            currency: 'USD',
        );

        // Consumer validates it can construct and send valid DTOs
        $this->assertNotNull($dto->customerId);
    }
}
```
---
## Exceptions
None. Both sides must always contract-test.
---
## Consequences Of Violation
Producer changes contract unintentionally and consumer breaks in production; regressions go undetected until deployment.
---

## Rule 6: Keep DTOs immutable
---
## Category
Design | Reliability
---
## Define all contract DTOs as readonly classes with public constructor promotion.
---
## Reason
If the consumer modifies the DTO, it creates hidden coupling and side effects. Immutable DTOs guarantee the contract data is stable and predictable.
---
## Bad Example
```php
class ShipOrderDto
{
    public string $orderId; // Mutable — consumer can change it
    public ?string $trackingNumber; // Mutable
}
```
---
## Good Example
```php
readonly class ShipOrderDto
{
    public function __construct(
        public string $orderId,
        public ?string $trackingNumber = null,
    ) {}
}
```
---
## Exceptions
None. Immutability is a core property of contract DTOs.
---
## Consequences Of Violation
Consumer accidentally mutates DTO, causing subtle bugs; producer receives unexpected state; debugging becomes difficult.
---

## Rule 7: Keep contracts lean
---
## Category
Maintainability
---
## Limit contract DTOs to the minimum fields the consumer actually needs. Avoid "kitchen sink" DTOs with 20+ fields.
---
## Reason
Every field in a DTO is a dependency. Excess fields make the contract harder to change, force consumers to handle irrelevant data, and increase serialization cost.
---
## Bad Example
```php
readonly class OrderDto
{
    public function __construct(
        public string $orderId,
        public string $customerId,
        public string $customerName,
        public string $customerEmail,
        public string $customerPhone,
        public string $customerAddress,
        public string $billingAddress,
        public string $shippingAddress,
        public array $lineItems,
        public float $subtotal,
        public float $tax,
        public float $shipping,
        public float $total,
        public string $currency,
        public string $status,
        public string $paymentMethod,
        public string $paymentStatus,
        public string $createdAt,
        public string $updatedAt,
        // ... 20+ fields, consumer only needs 5
    ) {}
}
```
---
## Good Example
```php
readonly class OrderConfirmationDto
{
    public function __construct(
        public string $orderId,
        public string $status,
        public float $total,
        public string $currency,
    ) {}
}
```
---
## Exceptions
Fat events for event-driven communication require more fields (see CPC-04). This rule applies to synchronous contract DTOs, not integration events.
---
## Consequences Of Violation
Contract becomes hard to evolve; consumers depend on unnecessary fields; breaking changes become more frequent.
---

## Rule 8: Place contracts in a shared location
---
## Category
Code Organization
---
## Define cross-context contracts in a shared directory or shared kernel package, not inside either context's private code.
---
## Reason
Contracts must be accessible to both producer and consumer without either importing the other's internal code. A shared location prevents circular dependencies and makes contracts discoverable.
---
## Bad Example
```php
// Contract defined inside the producer context
// src/Contexts/Billing/Contracts/PaymentProcessorInterface.php

// Consumer must import from Billing context — creates dependency
use Billing\Contracts\PaymentProcessorInterface;
```
---
## Good Example
```php
// Contract defined in shared kernel
// src/Kernel/Contracts/Billing/PaymentProcessorInterface.php

// Both contexts depend on the shared kernel
use Kernel\Contracts\Billing\PaymentProcessorInterface;
```
---
## Exceptions
If using a monorepo with strict namespace separation, contracts can live in a dedicated `Contracts/` directory at the package root.
---
## Consequences Of Violation
Circular package dependencies; context boundaries eroded; contracts hidden inside implementation packages.
---
