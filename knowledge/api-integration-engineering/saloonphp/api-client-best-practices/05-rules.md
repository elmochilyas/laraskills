## Never Call APIs Directly in Controllers
---
## Category
Code Organization
---
## Rule
Encapsulate all external API interaction in dedicated service classes; never call Http facade or Guzzle directly in controllers.
---
## Reason
Controllers should orchestrate, not transport; inline HTTP calls prevent testing, duplicate code, and violate separation of concerns.
---
## Bad Example
```php
class UserController {
    public function index(): JsonResponse {
        return response()->json(Http::get('https://api.example.com/users')->json());
    }
}
```
---
## Good Example
```php
class UserController {
    public function __construct(private UserService $userService) {}
    public function index(): JsonResponse {
        return response()->json($this->userService->getAllUsers());
    }
}
```
---
## Exceptions
Prototypes or one-off scripts where service classes are premature.
---
## Consequences Of Violation
Untestable controllers, duplicated HTTP logic across controllers, mixing transport concerns with presentation.
## Return Typed DTOs, Not Raw Responses
---
## Category
Maintainability
---
## Rule
Always return typed DTOs or collections from service methods; never return raw Response objects or arrays.
---
## Reason
DTOs provide type safety, autocompletion, and explicit contracts; raw responses leak HTTP-layer concerns into callers.
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
Passthrough proxy endpoints forwarding raw responses unchanged.
---
## Consequences Of Violation
Array key typos cause runtime errors, no IDE support, brittle refactoring, HTTP coupling throughout the application.
## Inject Http Facade Via Constructor
---
## Category
Testing
---
## Rule
Inject the Http facade via constructor in all service classes; never instantiate it inside methods.
---
## Reason
Constructor injection enables `Http::fake()` in tests without modifying production code.
---
## Bad Example
```php
public function getUsers(): array {
    return Http::withToken(config('services.api.secret'))->get('/users')->json();
}
```
---
## Good Example
```php
public function __construct(private Http $http) {}
public function getUsers(): array {
    return $this->http->withToken(config('services.api.secret'))->get('/users')->throw()->json();
}
```
---
## Exceptions
None — always inject for testability.
---
## Consequences Of Violation
Tests cannot mock HTTP calls; test suite makes real HTTP calls, becoming slow and flaky.
## Map HTTP Errors to Domain Exceptions
---
## Category
Architecture
---
## Rule
Map HTTP error status codes to typed domain exceptions in the service layer; never let Guzzle exceptions propagate.
---
## Reason
Business logic should catch domain exceptions (e.g., `PaymentFailedException`), not transport-level HTTP exceptions.
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
        throw match ($e->getCode()) {
            404 => new NotFoundException("Charge {$id} not found"),
            default => new ServiceException('API error', previous: $e),
        };
    }
}
```
---
## Exceptions
When the caller needs raw HTTP status for specific branching logic.
---
## Consequences Of Violation
Raw HTTP exceptions exposed to controllers, inconsistent error handling, security information leakage.
## Externalize Configuration from Service Classes
---
## Category
Code Organization
---
## Rule
Store all API configuration (base URLs, credentials, timeouts) in Laravel config files; never hardcode in services.
---
## Reason
Environment-specific values change independently of code; config files manage this without code changes or redeployment.
---
## Bad Example
```php
return Http::baseUrl('https://api.stripe.com/v1')->withToken('sk_live_xxx');
```
---
## Good Example
```php
return Http::baseUrl(config('services.stripe.base_url'))
    ->withToken(config('services.stripe.secret'));
```
---
## Exceptions
None — always externalize configuration.
---
## Consequences Of Violation
Hardcoded credentials in version control, environment-specific changes require code deploys, security risks.
