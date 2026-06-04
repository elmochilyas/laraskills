## Define Interface Per Service
---
## Category
Architecture
---
## Rule
Define an interface for every API service class to enable dependency injection and mocking in tests.
---
## Reason
Interfaces decouple consumers from implementations, allowing swap of HTTP client, mock services in tests, and future provider changes without modifying callers.
---
## Bad Example
```php
class StripeService { public function charge(array $data): Charge { /* ... */ } }
// Used directly: new StripeService(...) — hard to mock
```
---
## Good Example
```php
interface PaymentService { public function charge(CreateChargeDTO $dto): Charge; }
class StripeService implements PaymentService { /* ... */ }
// Bound in ServiceProvider: $this->app->bind(PaymentService::class, StripeService::class);
```
---
## Exceptions
Prototypes or single-provider integrations where provider swap is not anticipated.
---
## Consequences Of Violation
Tight coupling to implementation, difficult to mock in tests, painful provider migration.
## Return DTOs, Never Raw Response Objects
---
## Category
Maintainability
---
## Rule
Always return typed DTOs or collections from service methods; never return raw Response objects or arrays.
---
## Reason
DTOs provide type safety, IDE autocompletion, and explicit contracts; raw responses leak HTTP-layer concerns into business logic.
---
## Bad Example
```php
public function getCharges(): array { return $this->http->get('/charges')->json(); }
```
---
## Good Example
```php
public function getCharges(): ChargeCollection {
    return ChargeCollection::fromResponse($this->http->get('/charges')->throw()->json());
}
```
---
## Exceptions
Proxy/passthrough endpoints where the response is forwarded unchanged to another consumer.
---
## Consequences Of Violation
Array key typos cause runtime errors, no autocompletion, brittle refactoring, HTTP coupling throughout codebase.
## Inject Http Client Via Constructor
---
## Category
Testing
---
## Rule
Inject the HTTP client (Http facade, Guzzle client, or Saloon connector) via constructor; never instantiate inside the service.
---
## Reason
Constructor injection enables `Http::fake()` and MockClient injection in tests without modifying service code.
---
## Bad Example
```php
class PaymentService {
    public function charge(array $data): array {
        $http = Http::withToken(config('services.stripe.secret')); // hard to mock
    }
}
```
---
## Good Example
```php
class PaymentService {
    public function __construct(private Http $http) {}
    public function charge(array $data): array {
        return $this->http->withToken(config('services.stripe.secret'))->post('/charges', $data);
    }
}
```
---
## Exceptions
None — always inject for testability.
---
## Consequences Of Violation
Impossible to unit test without real HTTP calls, integration tests become flaky and slow.
## Handle Errors Within the Service Boundary
---
## Category
Reliability
---
## Rule
Handle all HTTP-level errors (4xx, 5xx, timeouts, connection errors) within the service class; never let Guzzle exceptions propagate to controllers.
---
## Reason
Service boundary is the natural error handling layer; controllers should receive domain exceptions, not transport-level errors.
---
## Bad Example
```php
public function getCharge(string $id): array {
    return $this->http->get("/charges/{$id}")->throw()->json(); // GuzzleException propagates
}
```
---
## Good Example
```php
public function getCharge(string $id): Charge {
    try {
        return Charge::fromResponse($this->http->get("/charges/{$id}")->throw()->json());
    } catch (RequestException $e) {
        throw new PaymentProviderException('Failed to fetch charge', previous: $e);
    }
}
```
---
## Exceptions
When the controller explicitly needs to handle different error scenarios differently.
---
## Consequences Of Violation
Raw HTTP exceptions exposed to users, inconsistent error handling, security information leakage.
## One Service Class Per External System
---
## Category
Code Organization
---
## Rule
Create one dedicated service class per external system; never mix integrations for different providers in one class.
---
## Reason
Single responsibility keeps each integration independently testable, deployable, and understandable without cross-provider coupling.
---
## Bad Example
```php
class PaymentService {
    public function stripeCharge(array $data): array { /* ... */ }
    public function paypalCharge(array $data): array { /* ... */ }
}
```
---
## Good Example
```php
class StripeService { public function charge(CreateChargeDTO $dto): Charge { /* ... */ } }
class PayPalService { public function charge(CreateChargeDTO $dto): Charge { /* ... */ } }
```
---
## Exceptions
Very thin abstraction layers (e.g., a factory that delegates to provider-specific services).
---
## Consequences Of Violation
God classes that violate SRP, difficult to test, merge conflicts on concurrent changes to different providers.
