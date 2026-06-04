## Inject Http Facade Via Constructor
---
## Category
Testing
---
## Rule
Inject the Http facade via constructor in wrapper/service classes; never instantiate it inside methods.
---
## Reason
Constructor injection enables `Http::fake()` injection in tests without modifying production code.
---
## Bad Example
```php
class PaymentService {
    public function charge(array $data): array {
        return Http::withToken(config('services.stripe.secret'))->post('/charges', $data)->json();
    }
}
```
---
## Good Example
```php
class PaymentService {
    public function __construct(private Http $http) {}
    public function charge(array $data): array {
        return $this->http->withToken(config('services.stripe.secret'))->post('/charges', $data)->throw()->json();
    }
}
```
---
## Exceptions
None — always inject for testability.
---
## Consequences Of Violation
Impossible to unit test without real HTTP calls; tests become slow, flaky, and environment-dependent.
## Map HTTP Errors to Domain Exceptions
---
## Category
Architecture
---
## Rule
Map HTTP error responses (4xx, 5xx) to typed domain exceptions within the wrapper; never propagate raw HTTP exceptions.
---
## Reason
Business logic should catch domain-specific exceptions (e.g., `PaymentFailedException`), not transport-level Guzzle exceptions.
---
## Bad Example
```php
public function getCharge(string $id): array {
    return $this->http->get("/charges/{$id}")->throw()->json(); // propagates GuzzleException
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
            404 => new ResourceNotFoundException("Charge {$id} not found"),
            429 => new RateLimitExceededException('Stripe rate limited'),
            default => new PaymentProviderException('Stripe error', previous: $e),
        };
    }
}
```
---
## Exceptions
When the caller needs raw HTTP status for specific branching logic.
---
## Consequences Of Violation
Guzzle/PHP HTTP exceptions leak throughout the codebase, coupling business logic to transport layer.
## Centralize Configuration in Config Files
---
## Category
Code Organization
---
## Rule
Externalize base URLs, credentials, and timeouts to `config/services/{service}.php`; never hardcode in wrappers.
---
## Reason
Environment-specific values change independently of code; config files manage this without code changes or redeployment.
---
## Bad Example
```php
return Http::baseUrl('https://api.stripe.com/v1')->withToken('sk_live_xxx')->get('/charges');
```
---
## Good Example
```php
// config/services/stripe.php
return [
    'base_url' => env('STRIPE_BASE_URL', 'https://api.stripe.com/v1'),
    'secret' => env('STRIPE_SECRET'),
    'timeout' => env('STRIPE_TIMEOUT', 30),
];
// Service class
return Http::baseUrl(config('services.stripe.base_url'))
    ->withToken(config('services.stripe.secret'))
    ->timeout(config('services.stripe.timeout'))
    ->get('/charges');
```
---
## Exceptions
None — config externalization is always preferred.
---
## Consequences Of Violation
Hardcoded credentials committed to version control, environment-specific values require code changes, security risks.
## Never Make API Calls Directly in Controllers
---
## Category
Code Organization
---
## Rule
Never call the Http facade or Guzzle directly in controllers; always delegate to a service class wrapper.
---
## Reason
Controllers should orchestrate, not transport; inline HTTP calls prevent testing, duplicate code, and mix concerns.
---
## Bad Example
```php
class UserController {
    public function index(): JsonResponse {
        $response = Http::get('https://api.example.com/users')->throw();
        return response()->json($response->json());
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
Prototypes or single-use scripts where a service class is over-engineering.
---
## Consequences Of Violation
Untestable controllers, duplicated HTTP logic, mixing transport concerns with presentation.
## Return Typed Data, Not Raw Response Objects
---
## Category
Maintainability
---
## Rule
Return typed DTOs or collections from wrapper methods; never return raw Response objects.
---
## Reason
Typed returns provide autocompletion, prevent key typos, and decouple callers from HTTP response structure.
---
## Bad Example
```php
public function getUsers(): array { return $this->http->get('/users')->json(); }
// Caller: $users[0]['name'] — no type safety
```
---
## Good Example
```php
public function getUsers(): UserCollection {
    return UserCollection::fromResponse($this->http->get('/users')->throw()->json());
}
// Caller: $users[0]->name — typed, autocompleted
```
---
## Exceptions
Passthrough proxy endpoints forwarding raw responses.
---
## Consequences Of Violation
Array key typos cause runtime errors, no IDE support, brittle refactoring.
