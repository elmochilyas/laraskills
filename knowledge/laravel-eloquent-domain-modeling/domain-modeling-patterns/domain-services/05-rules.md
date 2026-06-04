# Domain Services — Rules

---

## Rule: Name Domain Services as Verbs Describing a Process
---
## Category
Maintainability
---
## Rule
Name domain service classes using verb-based nouns that describe the process they perform, such as `OrderFulfillmentService`, `PricingCalculator`, or `FraudDetectionService`.
---
## Reason
Verb-based names communicate that the service is a process or operation, not a thing. `OrderFulfillmentService` expresses an action; `OrderService` is vague — it could be anything related to orders.
---
## Bad Example
```php
class OrderService { ... }    // Too vague — what does it do?
class OrderHelper { ... }     // "Helper" suggests no clear responsibility
class OrderManager { ... }    // "Manager" is meaningless
```
---
## Good Example
```php
class OrderFulfillmentService { ... }
class PricingCalculator { ... }
class FraudDetectionService { ... }
class ShippingCostCalculator { ... }
```
---
## Exceptions
Infrastructure services (e.g., `MailService`, `SmsService`) follow a different naming pattern — they are about the channel, not the domain process.
---
## Consequences Of Violation
Unclear responsibilities, services that accumulate unrelated methods into "managers" or "helpers," and code that requires reading the implementation to understand the service's purpose.

---

## Rule: Keep Domain Services Stateless
---
## Category
Architecture
---
## Rule
Never store mutable state in domain service class properties. Domain services must be stateless — all data they operate on is passed as method parameters.
---
## Reason
Stateful services introduce hidden dependencies between method calls, make testing order-dependent, and prevent the service from being safely shared across requests or used as a singleton.
---
## Bad Example
```php
class PricingCalculator
{
    private float $total = 0; // Mutable state!

    public function calculate(Order $order): float
    {
        foreach ($order->items as $item) {
            $this->total += $item->price * $item->quantity; // Accumulating state
        }
        return $this->total;
    }
}
```
---
## Good Example
```php
class PricingCalculator
{
    public function calculate(Order $order): float
    {
        return $order->items->sum(
            fn ($item) => $item->price * $item->quantity
        );
    }
}
```
---
## Exceptions
Cache references as constructor-injected immutable dependencies, never as mutable operation state.
---
## Consequences Of Violation
Race conditions in concurrent requests, order-dependent test failures, and unexpected results when a service instance is reused across operations.

---

## Rule: Inject Domain Interfaces, Not Concrete Implementations
---
## Category
Architecture
---
## Rule
Type-hint constructor parameters in domain services using interfaces (repository interfaces, other service interfaces) rather than concrete Eloquent model classes or implementation classes.
---
## Reason
Depending on interfaces keeps the domain service decoupled from infrastructure, making it testable with mock implementations and ensuring the domain layer has no dependency on the ORM.
---
## Bad Example
```php
class OrderFulfillmentService
{
    public function __construct(
        private EloquentOrderRepository $repo, // Concrete implementation
        private MailService $mailer,           // Infrastructure dependency
    ) {}
}
```
---
## Good Example
```php
class OrderFulfillmentService
{
    public function __construct(
        private OrderRepository $repo,      // Domain interface
        private InventoryService $inventory, // Domain interface
        private PricingCalculator $pricing,  // Domain interface
    ) {}
}
```
---
## Exceptions
Value objects and domain primitives that have no interface — they are the concrete type by nature.
---
## Consequences Of Violation
Domain services that cannot be unit-tested without a database connection or mail server, and tight coupling that prevents switching persistence strategies.

---

## Rule: Ensure Domain Services Contain Domain Logic, Not Infrastructure
---
## Category
Architecture
---
## Rule
Keep domain service methods focused on business rules and domain calculations. Never include HTTP calls, raw database queries, file I/O, or external API interactions directly in a domain service.
---
## Reason
Domain services belong in the domain layer, which must be infrastructure-agnostic. Mixing infrastructure concerns violates the layered architecture and makes domain logic untestable without infrastructure setup.
---
## Bad Example
```php
class FraudDetectionService
{
    public function __construct(private HttpClient $http) {}

    public function check(Order $order): bool
    {
        $response = $this->http->post('https://fraud-api.example.com/check', [
            'amount' => $order->total_cents,
        ]); // External API call — infrastructure, not domain!

        return $response->json()['is_fraud'];
    }
}
```
---
## Good Example
```php
interface FraudCheckProvider
{
    public function check(int $amountCents, string $currency): FraudResult;
}

class FraudDetectionService
{
    public function __construct(
        private FraudCheckProvider $provider,
        private OrderRepository $orders,
    ) {}

    public function isSuspicious(Order $order): bool
    {
        $threshold = $this->orders->averageOrderAmount() * 3;
        if ($order->total_cents > $threshold) {
            return true; // Domain rule: orders > 3x average are flagged
        }

        return $this->provider->check(
            $order->total_cents,
            $order->currency
        )->isFraud;
    }
}
```
---
## Exceptions
No common exceptions. Infrastructure calls are always extracted behind interfaces or delegated to application services.
---
## Consequences Of Violation
Domain layer coupled to external systems, untestable business logic, and infrastructure changes forcing modifications to domain logic.

---

## Rule: One Domain Service per Business Process
---
## Category
Design
---
## Rule
Design each domain service to encapsulate exactly one business process or calculation. If a service has more than one public method doing different things, split it.
---
## Reason
Services with multiple responsibilities become bloated "manager" classes where unrelated logic accumulates. Single-process services are easier to name, test, and maintain.
---
## Bad Example
```php
class OrderService // "Service" doing everything
{
    public function calculateShipping(Order $order): Money { ... }
    public function applyDiscount(Order $order, Coupon $coupon): void { ... }
    public function validateAddress(Order $order): ValidationResult { ... }
    public function checkFraud(Order $order): FraudResult { ... }
    // Four different responsibilities in one class
}
```
---
## Good Example
```php
class ShippingCostCalculator { public function calculate(Order $order): Money { ... } }
class DiscountApplier { public function apply(Order $order, Coupon $coupon): void { ... } }
class AddressValidator { public function validate(Order $order): ValidationResult { ... } }
class FraudDetectionService { public function check(Order $order): FraudResult { ... } }
// Each service has one responsibility
```
---
## Exceptions
When multiple small processes are always called together and extracting each adds more files than clarity. Use judgment — err on the side of splitting.
---
## Consequences Of Violation
Bloated service classes that violate Single Responsibility, accumulate dependencies, and become difficult to test due to a wide surface area of methods and injected dependencies.

---

## Rule: Return Domain Objects, Not HTTP Responses
---
## Category
Architecture
---
## Rule
Domain service methods should return domain objects, collections, value objects, or primitives. Never return HTTP responses, JSON structures, or redirects.
---
## Reason
Domain services are part of the domain layer, which must be framework-agnostic. Returning HTTP artifacts couples the service to the web layer, making it unusable from CLI commands, queue jobs, or other non-HTTP entry points.
---
## Bad Example
```php
class PricingCalculator
{
    public function calculate(Order $order): JsonResponse
    {
        $total = $order->items->sum(fn ($i) => $i->price * $i->quantity);

        return response()->json(['total' => $total]); // HTTP response!
    }
}
```
---
## Good Example
```php
class PricingCalculator
{
    public function calculate(Order $order): Money
    {
        $totalCents = $order->items->sum(
            fn ($i) => $i->unit_price_cents * $i->quantity
        );

        return new Money($totalCents, $order->currency);
    }
}
```
---
## Exceptions
No common exceptions. Domain services never return HTTP-related types.
---
## Consequences Of Violation
Services that can only be used from controllers, duplication of logic for CLI/queue entry points, and framework coupling in the domain layer.

---

## Rule: Do Not Put Cross-Aggregate Logic in Either Model or Service — Choose the Service
---
## Category
Architecture
---
## Rule
When a business operation involves multiple aggregate roots, place the orchestration logic in a domain service. Never put it in one of the aggregates (which would create asymmetric coupling) or in a controller.
---
## Reason
Putting multi-aggregate logic in an aggregate root creates an unnatural dependency on other aggregates. Putting it in a controller leaves business logic unencapsulated. A domain service is the natural home for cross-aggregate orchestration.
---
## Bad Example
```php
class Order extends Model
{
    public function fulfill(): void
    {
        // Order now knows about Inventory aggregate — coupling!
        Product::whereIn('id', $this->items->pluck('product_id'))
            ->decrement('stock');
        $this->status = 'fulfilled';
        $this->save();
    }
}
```
---
## Good Example
```php
class OrderFulfillmentService
{
    public function __construct(
        private InventoryService $inventory,
    ) {}

    public function fulfill(Order $order): void
    {
        $this->inventory->reserveItems($order->items);
        $order->status = 'fulfilled';
        $order->save();
    }
}
```
---
## Exceptions
When the "other aggregate" logic is actually part of the same aggregate — re-examine the boundary.
---
## Consequences Of Violation
Asymmetric coupling between aggregates, inability to test orchestration independently, and domain rules hidden inside model methods that imply single-aggregate scope but reach across boundaries.
