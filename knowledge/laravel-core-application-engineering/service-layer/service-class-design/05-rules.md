# Service Class Design — Engineering Rules

---

## Rule 1: Services Must Be Stateless

Service classes must not capture per-request or per-call state on `$this`. All operational data must be passed as method parameters and all results must be returned as return values.

---

## Category

Design

---

## Rule

Service methods must not set mutable instance properties during execution. Every method must receive all required data as parameters and return results explicitly. Properties on the service class must be limited to injected dependencies (repositories, gateways, services) that are stable across calls.

---

## Reason

Stateless services are safe in any runtime (PHP-FPM, Octane, RoadRunner), composable without side effects, and trivially testable. Stateful services leak data across requests in long-lived processes and introduce concurrency bugs that are difficult to debug.

---

## Bad Example

```php
class UserService
{
    private ?User $lastCreated = null;

    public function register(string $name, string $email): void
    {
        $this->lastCreated = User::create(['name' => $name, 'email' => $email]);
    }

    public function getLastCreated(): ?User
    {
        return $this->lastCreated;
    }
}
```

---

## Good Example

```php
class UserService
{
    public function __construct(
        private UserRepository $users,
    ) {}

    public function register(string $name, string $email): User
    {
        return $this->users->create(['name' => $name, 'email' => $email]);
    }
}
```

---

## Exceptions

Memoization of expensive, immutable computation results within a single request's lifetime is acceptable if the service is never used in Octane/RoadRunner.

---

## Consequences Of Violation

Reliability risks: state leakage across requests in Octane/RoadRunner causes data corruption. Testing risks: stateful services require careful test isolation. Performance risks: state may be held longer than necessary.

---

## Rule 2: Limit Constructor Dependencies to 8

Service constructors must not exceed 8 injected dependencies. Services exceeding this limit must be split into smaller, more focused services.

---

## Category

Maintainability

---

## Rule

The maximum number of constructor-injected dependencies for any service class is 8. If a service requires more than 8 dependencies, it must be decomposed into multiple services, each with a narrower responsibility.

---

## Reason

Constructor count correlates with responsibility scope. A service needing 9+ dependencies is coupled to too many subsystems, violating single responsibility. Large constructors are difficult to read, hard to test, and indicate the service should be split.

---

## Bad Example

```php
class OrderService
{
    public function __construct(
        private OrderRepository $orders,
        private UserRepository $users,
        private ProductRepository $products,
        private InventoryRepository $inventory,
        private PaymentGateway $gateway,
        private MailService $mail,
        private DiscountService $discounts,
        private TaxService $tax,
        private ShippingService $shipping,  // 9th dependency — too many
    ) {}
}
```

---

## Good Example

```php
class OrderPlacementService
{
    public function __construct(
        private OrderRepository $orders,
        private PaymentGateway $gateway,
        private InventoryService $inventory,
        private PricingService $pricing,
    ) {} // 4 dependencies — focused
}

class OrderNotificationService
{
    public function __construct(
        private MailService $mail,
        private OrderRepository $orders,
    ) {} // 2 dependencies — focused
}
```

---

## Exceptions

A service orchestrating an exceptionally complex workflow may require up to 10 dependencies. Document the justification and consider splitting into sub-orchestrators.

---

## Consequences Of Violation

Maintenance risks: high coupling to many subsystems makes changes dangerous. Testing risks: large constructor requires extensive mocking. Readability risks: constructor signatures are overwhelming.

---

## Rule 3: Name Methods as Business Operations, Not HTTP Actions

Service method names must reflect business domain operations (`register`, `suspend`, `place`, `cancel`), not HTTP actions (`store`, `update`, `destroy`, `index`).

---

## Category

Design

---

## Rule

Service method names must use business-domain verbs. HTTP action names (`store`, `update`, `destroy`, `index`, `show`, `edit`) are prohibited in service classes. Services must not know about HTTP.

---

## Reason

Services are domain-layer constructs, not HTTP handlers. HTTP verb names couple the domain to the transport layer, making services unusable from CLI/queue contexts without confusion. Business verbs express domain intent and remain stable across transport changes.

---

## Bad Example

```php
class UserService
{
    public function store(array $data): User { /* ... */ }
    public function update(int $id, array $data): User { /* ... */ }
    public function destroy(int $id): bool { /* ... */ }
}
```

---

## Good Example

```php
class UserService
{
    public function register(RegisterUserData $data): User { /* ... */ }
    public function suspend(User $user): void { /* ... */ }
    public function activate(User $user): void { /* ... */ }
}
```

---

## Exceptions

When a service wraps a third-party API whose operations are inherently HTTP-like (e.g., `ApiClientService`), using the external API's verb names may be clearer.

---

## Consequences Of Violation

Maintenance risks: renaming when adding CLI/queue support. Design risks: service layer coupled to HTTP semantics. Readability risks: method names do not express domain intent.

---

## Rule 4: Return Typed Results from Every Method

Every service method must declare a return type. Methods must return the actual result or `void`, never `mixed` or `array` without an `@return` annotation specifying keys.

---

## Category

Maintainability

---

## Rule

All service methods must have explicit return type declarations. Return types must be specific: use a Model class, DTO, custom result object, `Collection`, `bool`, or `void`. Never use `mixed` or untyped `array` as a return type for methods that return structured data.

---

## Reason

Explicit return types form a contract between the service and its callers. Callers know what to expect without reading the implementation. Typed returns enable static analysis, IDE autocompletion, and prevent runtime type errors.

---

## Bad Example

```php
class OrderService
{
    public function place($data) // no return type, no parameter type
    {
        return [
            'order' => Order::create($data),
            'payment' => Payment::create($data),
        ];
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function place(PlaceOrderData $data): OrderResult
    {
        return new OrderResult(
            order: $this->orders->create($data),
            payment: $this->payment->charge($data),
        );
    }
}
```

---

## Exceptions

Methods serving as event dispatchers or side-effect-only operations may return `void`. Internal private helper methods may be less strict but should still prefer typed returns.

---

## Consequences Of Violation

Reliability risks: callers may receive unexpected types at runtime. Maintenance risks: callers must read implementations to understand return values. Static analysis risks: type errors are not caught during development.

---

## Rule 5: Split Services Beyond 15–20 Methods

A service class with more than 15–20 methods must be decomposed into smaller services or have complex operations extracted into action classes.

---

## Category

Maintainability

---

## Rule

When a service class exceeds 15–20 public methods, it must be refactored. Extract related method groups into separate services or extract complex individual operations into dedicated action classes. A service class must have a clearly defined scope.

---

## Reason

Services with 20+ methods violate single responsibility, become difficult to navigate, and create merge conflicts as multiple developers work on the same file. Small, focused services are easier to understand, test, and maintain.

---

## Bad Example

```php
class UserService // 28 methods
{
    public function register(...) {}
    public function login(...) {}
    public function logout(...) {}
    public function suspend(...) {}
    public function activate(...) {}
    public function updateEmail(...) {}
    public function updatePassword(...) {}
    public function resetPassword(...) {}
    public function verifyEmail(...) {}
    public function updateProfile(...) {}
    public function uploadAvatar(...) {}
    public function deleteAvatar(...) {}
    // ... 16 more methods
}
```

---

## Good Example

```php
class RegistrationService
{
    public function register(RegisterUserData $data): User {}
    public function verifyEmail(User $user): void {}
}

class UserProfileService
{
    public function update(UpdateProfileData $data): User {}
    public function uploadAvatar(User $user, UploadedFile $file): User {}
}

class UserSecurityService
{
    public function suspend(User $user): void {}
    public function activate(User $user): void {}
    public function resetPassword(User $user): void {}
}
```

---

## Exceptions

Capability-oriented services (e.g., `PaymentService`) that naturally have many related operations may exceed 20 methods if all methods genuinely belong to the same single responsibility.

---

## Consequences Of Violation

Maintenance risks: single file becomes a bottleneck for multiple developers. Testing risks: large test files with many test cases. Readability risks: difficult to find specific methods among dozens of others.

---

## Rule 6: Never Inject HTTP Dependencies into Services

Services must not depend on `Illuminate\Http\Request`, `Illuminate\Http\Response`, `Illuminate\Http\RedirectResponse`, or `Illuminate\Session\SessionManager`.

---

## Category

Architecture

---

## Rule

Services must not inject or use HTTP-layer classes: `Request`, `Response`, `RedirectResponse`, `Session`, `RequestStack`, or any class from the `Illuminate\Http` namespace. All HTTP data must be extracted in the controller and passed to services as primitives, DTOs, or domain objects.

---

## Reason

HTTP dependencies couple services to the web transport layer. A service with HTTP dependencies cannot be called from CLI commands, queue jobs, or tests without mocking HTTP objects. Services must be transport-agnostic.

---

## Bad Example

```php
class UserService
{
    public function __construct(
        private Request $request, // HTTP dependency — prohibited
    ) {}

    public function register(): User
    {
        return User::create($this->request->all());
    }
}
```

---

## Good Example

```php
class UserService
{
    public function register(RegisterUserData $data): User
    {
        return $this->users->create($data->toArray());
    }
}
```

---

## Exceptions

Services that explicitly wrap HTTP client functionality (e.g., `HttpClientService` or `ApiGatewayService`) may depend on HTTP constructs as part of their domain responsibility.

---

## Consequences Of Violation

Reusability risks: service cannot be used from CLI, queue, or tests without HTTP mocking. Testing risks: requires framework boot or mocking HTTP objects. Architecture risks: service layer is coupled to transport layer.

---

## Rule 7: Use Constructor Injection as the Primary DI Mechanism

All service dependencies must be injected through the constructor. Setter injection or `app()` resolution within methods is prohibited except for optional or conditional dependencies.

---

## Category

Design

---

## Rule

Service dependencies must be declared in the constructor signature and resolved by the container. Using `app()`, `resolve()`, `ServiceContainer::make()`, or `new` inside service methods for dependencies is prohibited. Setter injection is only acceptable for truly optional dependencies.

---

## Reason

Constructor injection makes dependencies explicit, testable (via constructor arguments), and immutable. Hidden resolution inside methods creates invisible dependencies that surprise developers and complicate testing.

---

## Bad Example

```php
class OrderService
{
    public function place(PlaceOrderData $data): Order
    {
        $gateway = app(PaymentGateway::class); // hidden dependency
        $mail = resolve(MailService::class); // hidden dependency
        // ...
    }
}
```

---

## Good Example

```php
class OrderService
{
    public function __construct(
        private PaymentGateway $gateway,
        private MailService $mail,
    ) {}

    public function place(PlaceOrderData $data): Order
    {
        // Dependencies are explicit and injectable
    }
}
```

---

## Exceptions

Optional dependencies with a default fallback (e.g., a logger that defaults to `NullLogger`) may use setter injection if constructor injection would force all callers to provide the dependency.

---

## Consequences Of Violation

Testing risks: hidden dependencies cannot be mocked without modifying the service. Maintenance risks: developers must read the full method to discover dependencies. Architecture risks: encourages service locator anti-pattern.

---

## Rule 8: Group Services by Entity or Capability

Each service must be organized around either a single business entity (`UserService`, `OrderService`) or a single cross-cutting capability (`AuthenticationService`, `NotificationService`), never around generic concepts.

---

## Category

Code Organization

---

## Rule

Every service must have a clear organizing principle: either a business entity (all operations related to `User`, `Order`, `Invoice`) or a cross-cutting capability (all operations related to `Authentication`, `Notification`, `Payment`). Services must not be organized around technical layers or generic concepts.

---

## Reason

Entity and capability grouping provides a predictable structure. Developers know where to find operations for a given entity or concern. Technical-layer grouping (e.g., `WriteService`, `ReadService`) provides no business insight and scatters related operations.

---

## Bad Example

```php
class WriteService // technical layer, not domain concept
{
    public function createUser(...) {}
    public function createOrder(...) {}
    public function createProduct(...) {}
}
```

---

## Good Example

```php
class UserService { public function register(...) {} }
class OrderService { public function place(...) {} }
class ProductService { public function create(...) {} }
```

---

## Exceptions

In very small applications (under 5 services), temporary grouping may be acceptable. Refactor to entity/capability grouping before the codebase grows beyond 10 services.

---

## Consequences Of Violation

Code organization risks: related operations are scattered across technical-layer services. Maintenance risks: changing entity behavior requires modifying multiple services. Readability risks: no business insight from service names.
