# Domain vs Application Services — Engineering Rules

---

## Rule 1: Distinguish Service Type by Role

Classify every service as either an *application service* (orchestration, infrastructure coordination) or a *domain service* (pure business computation). Never create a service with an ambiguous or dual role.

---

## Category

Architecture

---

## Rule

Every service class must be explicitly categorized as either an application service (orchestrates workflow, coordinates infrastructure) or a domain service (encapsulates pure business logic). A service must not perform both roles simultaneously.

---

## Reason

Ambiguous service roles lead to coupling between business rules and infrastructure. When a service mixes orchestration with domain computation, the domain logic becomes dependent on framework concerns, making it untestable without bootstrapping and unreusable across contexts.

---

## Bad Example

```php
class OrderService
{
    public function processOrder(Cart $cart): Order
    {
        DB::beginTransaction();
        $total = $this->calculateComplexDiscount($cart); // domain logic mixed in
        $order = Order::create(['total' => $total]);
        Mail::to($cart->user)->send(new OrderConfirmation($order));
        DB::commit();
        return $order;
    }

    private function calculateComplexDiscount(Cart $cart): float
    {
        // Domain logic coupled to infrastructure class
    }
}
```

---

## Good Example

```php
// Application service — orchestrates
class PlaceOrderService
{
    public function __construct(
        private PricingService $pricing, // domain service
        private OrderRepository $orders,
    ) {}

    public function execute(Cart $cart): Order
    {
        return DB::transaction(function () use ($cart) {
            $total = $this->pricing->calculateTotal($cart);
            return $this->orders->create($cart, $total);
        });
    }
}

// Domain service — pure computation
class PricingService
{
    public function calculateTotal(Cart $cart): Money
    {
        // Pure business logic, no framework dependencies
    }
}
```

---

## Exceptions

In very small applications (under 5 services), a combined approach may be acceptable temporarily. Refactor into separate services when the application grows.

---

## Consequences Of Violation

Maintenance risks: domain logic is coupled to framework, cannot be reused in CLI/queue contexts. Testing risks: domain logic requires framework boot to test. Scalability risks: cannot extract domain logic to separate processes or microservices.

---

## Rule 2: Application Services Must Not Contain Domain Logic

Application services must only orchestrate: call domain services, manage transactions, and coordinate infrastructure. They must not implement business rules, calculations, or validation logic.

---

## Category

Architecture

---

## Rule

Application services must not implement business rules, calculations, or domain validation. Business logic must be delegated to domain services, entities, or value objects. Application services may only call, coordinate, and aggregate.

---

## Reason

Embedding domain logic in application services couples business rules to infrastructure concerns (HTTP, repositories, mail). This prevents the domain logic from being tested in isolation, reused across entry points, or extracted into a separate domain layer.

---

## Bad Example

```php
class CheckoutService
{
    public function checkout(Cart $cart): Order
    {
        $tax = $cart->subtotal * 0.1; // domain calculation
        $discount = $cart->items > 5 ? 0.15 : 0; // business rule
        $total = $cart->subtotal + $tax - ($cart->subtotal * $discount);
        return Order::create(['total' => $total, 'user_id' => $cart->user_id]);
    }
}
```

---

## Good Example

```php
class CheckoutService
{
    public function __construct(
        private TaxCalculator $taxCalculator,
        private DiscountEngine $discountEngine,
        private OrderRepository $orders,
    ) {}

    public function checkout(Cart $cart): Order
    {
        $tax = $this->taxCalculator->calculate($cart);
        $discount = $this->discountEngine->apply($cart);
        $total = $cart->subtotal->add($tax)->subtract($discount);
        return $this->orders->create($cart, $total);
    }
}
```

---

## Exceptions

Simple formatting or data transformation (e.g., converting a string to lowercase) that has no business meaning may remain in the application service.

---

## Consequences Of Violation

Maintenance risks: business rules scattered across application services, hard to audit. Testing risks: domain logic can only be tested via slow integration tests with framework boot. Reliability risks: business rules are duplicated when reused across different application services.

---

## Rule 3: Domain Services Must Not Depend on Infrastructure

Domain services must have zero dependencies on Laravel framework, Eloquent, HTTP, cache, queues, or external APIs. They may only depend on domain objects (entities, value objects, domain interfaces).

---

## Category

Architecture

---

## Rule

Domain services must not inject or use any infrastructure concern: no Eloquent models, no Repository implementations, no Cache, no Mail, no Queue, no Request, no DB facade. Dependencies must be limited to domain interfaces, entities, and value objects.

---

## Reason

Infrastructure dependencies make domain services untestable without framework boot, violate the domain layer's independence, and prevent the domain logic from being extracted into a standalone library or microservice. The domain layer must be pure PHP with no framework coupling.

---

## Bad Example

```php
class TaxCalculator
{
    public function __construct(
        private DB $db,                        // infrastructure
        private CacheManager $cache,           // infrastructure
    ) {}

    public function calculate(Cart $cart): Money
    {
        $rate = $this->cache->remember('tax_rate', 3600, function () {
            return $this->db->table('tax_rates')->first();
        });
        return new Money($cart->total * $rate->percentage);
    }
}
```

---

## Good Example

```php
class TaxCalculator
{
    public function calculate(Cart $cart, TaxRate $rate): Money
    {
        return $cart->total->multiply($rate->percentage);
    }
}
```

---

## Exceptions

Domain services may depend on domain interfaces (e.g., `TaxRateProviderInterface`) whose implementations are injected at runtime. The interface must be defined in the domain layer, not in infrastructure.

---

## Consequences Of Violation

Testing risks: domain service requires full Laravel bootstrap, database connection, and cache driver. Scalability risks: domain logic cannot be extracted to a separate package or service. Maintenance risks: changing infrastructure (e.g., cache driver) forces changes to domain logic.

---

## Rule 4: Domain Services Must Be Testable Without Framework Boot

Every domain service method must be testable by instantiating with `new` and calling the method directly. No Laravel container, no database, no mocking framework should be required.

---

## Category

Testing

---

## Rule

All domain service methods must be testable by constructing the service with `new` and calling the method directly. No Laravel application instance, no container resolution, no database connection, and no mocking framework may be required to test any domain service.

---

## Reason

Pure domain services can be tested in microseconds, enabling rapid TDD feedback. Framework-dependent tests take seconds to bootstrap, slowing development velocity and discouraging frequent testing. True unit tests for domain logic must be instantaneous.

---

## Bad Example

```php
// Domain service needs Laravel boot to test
class DiscountEngine
{
    public function __construct(
        private CacheManager $cache,
    ) {}

    public function calculate(Cart $cart): Money { /* ... */ }
}

// Test requires:
// $engine = app(DiscountEngine::class); // container boot
```

---

## Good Example

```php
class DiscountEngine
{
    public function calculate(Cart $cart): Money
    {
        // Pure logic with no framework dependencies
    }
}

// Test:
// $engine = new DiscountEngine();
// $result = $engine->calculate($cart);
```

---

## Exceptions

Application services (which orchestrate infrastructure) naturally require framework boot or mocked dependencies. This rule applies only to domain services. Framework-dependent testing of application services is acceptable.

---

## Consequences Of Violation

Testing risks: slow test suite, tests skipped due to boot time, low test coverage. Maintenance risks: developers avoid testing domain logic because of friction. Reliability risks: untested business rules reach production.

---

## Rule 5: Domain Services Must Operate on Domain Objects

Domain service methods must accept and return domain objects (entities, value objects, domain primitives). They must not accept raw request data, DTOs, or Eloquent models directly.

---

## Category

Architecture

---

## Rule

Domain service method signatures must use domain types: entities, value objects, enums, and domain primitives. They must not accept Eloquent models, Form Requests, DTOs from the application layer, or raw arrays/scalars representing unstructured data.

---

## Reason

Accepting Eloquent models or application-layer DTOs couples the domain service to the persistence or HTTP layer. Domain services must operate on the domain's own vocabulary and types to remain infrastructure-independent and reusable.

---

## Bad Example

```php
class ShippingCostCalculator
{
    public function calculate(
        array $items,             // raw data, not domain type
        array $destination,       // raw data
    ): float { /* ... */ }
}
```

---

## Good Example

```php
class ShippingCostCalculator
{
    public function calculate(
        Package $package,
        Address $destination,
    ): Money { /* ... */ }
}
```

---

## Exceptions

No common exceptions. Domain services must always use domain types in their public API.

---

## Consequences Of Violation

Maintenance risks: domain service signature changes when Eloquent model or DTO changes. Testing risks: creating test instances requires database records or full DTO construction. Portability risks: domain service cannot be reused outside this Laravel application.

---

## Rule 6: Do Not Create Domain Services for CRUD Pass-Through

A service that only delegates to a repository without applying business logic is not a domain service. If a service method has no business rules, domain calculations, or invariants to enforce, remove it.

---

## Category

Architecture

---

## Rule

Never create a domain service whose methods only pass data through to a repository or Eloquent model. A domain service must encapsulate at least one business rule, calculation, or invariant enforcement that would otherwise not exist.

---

## Reason

CRUD pass-through services add indirection without value. They increase the codebase size, add an unnecessary layer to navigate, and create the illusion of domain modeling where none exists. Domain services justify their existence by housing business logic.

---

## Bad Example

```php
// This is not a domain service — pure pass-through
class UserDomainService
{
    public function __construct(private UserRepository $users) {}

    public function find(int $id): ?User { return $this->users->find($id); }
    public function findAll(): Collection { return $this->users->all(); }
    public function delete(int $id): void { $this->users->delete($id); }
}
```

---

## Good Example

```php
// This IS a domain service — encapsulates business rules
class UserActivationService
{
    public function canActivate(User $user): bool
    {
        return $user->email_verified_at !== null
            && !$user->isSuspended()
            && $user->hasAcceptedTerms();
    }
}
```

---

## Exceptions

Application services may contain simple delegation as part of orchestration (e.g., calling a repository within a broader workflow). The rule targets domain services specifically.

---

## Consequences Of Violation

Maintenance risks: unnecessary layers to navigate and maintain. Performance risks: extra method call overhead with no benefit. Code organization risks: dilutes the meaning of the domain service pattern, making it harder to find actual business logic.

---

## Rule 7: Application Services Coordinate Infrastructure

Application services are the single place where infrastructure concerns (repositories, gateways, mail, queues, caches) are coordinated. They should call domain services for business logic, not implement it.

---

## Category

Architecture

---

## Rule

Application services must be the sole coordinator of infrastructure operations: database transactions, repository calls, mail sending, queue dispatching, cache operations, and external API calls. Domain logic must be delegated to domain services.

---

## Reason

Centralizing infrastructure coordination in application services provides a clear boundary: all infrastructure coupling lives in one layer. Domain services remain pure. If infrastructure wiring changes (e.g., switching cache drivers), only application services change.

---

## Bad Example

```php
// Controller coordinates infrastructure directly
class OrderController
{
    public function store(Request $request)
    {
        DB::beginTransaction();
        $order = Order::create($request->all());
        Mail::to($order->user)->send(new OrderConfirmation($order));
        DB::commit();
        return redirect()->route('orders.show', $order);
    }
}
```

---

## Good Example

```php
class PlaceOrderService
{
    public function __construct(
        private PricingService $pricing,
        private OrderRepository $orders,
        private MailService $mail,
    ) {}

    public function execute(Cart $cart): Order
    {
        return DB::transaction(function () use ($cart) {
            $total = $this->pricing->calculateTotal($cart);
            $order = $this->orders->create($cart, $total);
            $this->mail->sendConfirmation($order);
            return $order;
        });
    }
}
```

---

## Exceptions

Simple CRUD controllers that only write to one table and have no business logic may call Eloquent directly without an application service.

---

## Consequences Of Violation

Maintenance risks: infrastructure coordination scattered across controllers, actions, and services, making changes dangerous. Testing risks: business logic tested via HTTP feature tests instead of unit tests. Reliability risks: missing transaction boundaries in some code paths.

---

## Rule 8: Application Services Must Not Be Injected into Domain Services

Domain services must never depend on application services. The dependency direction must always be: Controller → Application Service → Domain Service.

---

## Category

Architecture

---

## Rule

Domain services must never accept application services as dependencies. Domain services may only depend on other domain services, domain entities, value objects, or domain interfaces. The dependency graph must be unidirectional from application layer toward domain layer.

---

## Reason

If a domain service depends on an application service, the domain layer gains a dependency on infrastructure concerns, breaking the layered architecture. This creates circular dependency potential and prevents the domain layer from being extracted or tested independently.

---

## Bad Example

```php
class TaxCalculator // Domain service
{
    public function __construct(
        private NotificationService $notifications, // Application service
    ) {}

    public function calculate(Cart $cart): Money { /* ... */ }
}
```

---

## Good Example

```php
class TaxCalculator // Domain service — pure
{
    public function calculate(Cart $cart): Money { /* ... */ }
}

class CheckoutService // Application service
{
    public function __construct(
        private TaxCalculator $tax,            // domain ← app
        private NotificationService $mail,     // infrastructure
    ) {}
}
```

---

## Exceptions

No common exceptions. Domain services must never reference application services.

---

## Consequences Of Violation

Architecture risks: domain layer gains infrastructure coupling, breaking DDD layering. Testing risks: testing domain services requires bootstrapping application infrastructure. Maintenance risks: circular dependencies when application services also depend on domain services.

---

## Rule 9: Domain Services Should Be Stateless and Side-Effect-Free

Domain service methods should be pure functions: given the same input, they always return the same output, and they produce no side effects (no writes to databases, no sending emails, no modifying input objects).

---

## Category

Design

---

## Rule

Domain service methods must be deterministic (same input → same output) and must not produce side effects. They must not write to databases, send notifications, modify input objects, or change global state.

---

## Reason

Side effects in domain services make them unpredictable, hard to test, and unsafe to call multiple times. Pure domain logic is composable, cacheable, and trivially testable. Side effects belong in application services.

---

## Bad Example

```php
class FeeCalculator
{
    public function calculate(Order $order): Money
    {
        $fee = $order->total->multiply(0.02);
        $order->fee = $fee; // side effect — modifies input
        Log::info('Fee calculated', ['fee' => $fee]); // side effect
        return $fee;
    }
}
```

---

## Good Example

```php
class FeeCalculator
{
    public function calculate(Order $order): Money
    {
        return $order->total->multiply(0.02);
    }
}
```

---

## Exceptions

Domain services may cache calculation results within method scope (local variables) for performance, but must not write to external caches.

---

## Consequences Of Violation

Testing risks: calling a domain service method has hidden effects, making tests unreliable. Reliability risks: non-deterministic behavior in concurrent contexts (Octane). Maintenance risks: hidden side effects make reasoning about code behavior difficult.
