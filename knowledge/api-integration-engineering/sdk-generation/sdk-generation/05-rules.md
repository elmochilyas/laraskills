## Keep SDK Separate as Composer Package
---
## Category
Code Organization
---
## Rule
Maintain API client SDKs as separate Composer packages; never embed SDK code directly in the application codebase.
---
## Reason
Separate packages enable semantic versioning, independent CI/CD, and reuse across multiple projects.
---
## Bad Example
```php
// SDK classes in app/Services/Stripe/ — coupled to application
```
---
## Good Example
```json
{
    "require": {
        "acme/stripe-sdk": "^2.0"
    }
}
```
---
## Exceptions
Single-application, single-project SDKs unlikely to be reused.
---
## Consequences Of Violation
Cannot version SDK independently, harder to test in isolation, reuse requires copying code.
## Use One Request Class Per Endpoint
---
## Category
Code Organization
---
## Rule
Create a dedicated Saloon Request class for each API endpoint (method + path combination); never reuse one Request for multiple endpoints.
---
## Reason
Dedicated Request classes encapsulate endpoint-specific logic (headers, query params, DTO mapping), making each endpoint independently testable and maintainable.
---
## Bad Example
```php
class GenericRequest extends Request {
    public function resolveEndpoint(): string { return $this->endpoint; } // generic — mixed logic
}
```
---
## Good Example
```php
class GetUserRequest extends Request {
    public function resolveEndpoint(): string { return "/users/{$this->username}"; }
    public function createDtoFromResponse(Response $response): UserDto { /* ... */ }
}
class ListReposRequest extends Request {
    public function resolveEndpoint(): string { return "/users/{$this->username}/repos"; }
    public function createDtoFromResponse(Response $response): RepoCollection { /* ... */ }
}
```
---
## Exceptions
Simple CRUD endpoints with identical patterns (use trait-based generation).
---
## Consequences Of Violation
Endpoint-specific logic mixed in generic Request class, hard to test individual endpoints, difficult to add new endpoints.
## Implement Exception Taxonomy per HTTP Status
---
## Category
Architecture
---
## Rule
Map HTTP status codes to typed exceptions: NetworkException, AuthenticationException, RateLimitException, ValidationException, ServerException.
---
## Reason
Typed exceptions enable callers to handle specific error conditions (retry on RateLimitException, re-authenticate on AuthenticationException) without parsing status codes.
---
## Bad Example
```php
throw new \Exception("API error: {$response->status()}"); // generic — no specific handling
```
---
## Good Example
```php
throw match ($response->status()) {
    401, 403 => new AuthenticationException($response),
    429 => new RateLimitException($response),
    422 => new ValidationException($response),
    500, 502, 503 => new ServerException($response),
    default => new ApiException($response),
};
```
---
## Exceptions
None — always implement typed exception taxonomy.
---
## Consequences Of Violation
Callers must parse status codes manually, error handling logic duplicated across call sites, specific error conditions missed.
## Never Leak Guzzle/PSR-7 Types Outside SDK
---
## Code Organization
---
## Rule
SDK public methods must return only SDK-defined types (DTOs, collections); never expose Guzzle Response, PSR-7 interfaces, or raw arrays.
---
## Reason
Exposing transport-layer types couples all SDK consumers to Guzzle; changing HTTP client would break all callers.
---
## Bad Example
```php
public function getUser(string $name): \GuzzleHttp\Psr7\Response { // leaks Guzzle type
```
---
## Good Example
```php
public function getUser(string $name): UserDto { // SDK-defined type — consumer-agnostic
```
---
## Exceptions
None — always wrap transport types.
---
## Consequences Of Violation
Changing HTTP client breaks all SDK consumers, coupling to transport layer, untestable without HTTP mocking.
## Cache Connector Instances Per Request
---
## Performance
---
## Rule
Cache Saloon connector instances (singleton per service per request) to avoid Guzzle re-initialization overhead.
---
## Reason
Connector initialization creates Guzzle client with middleware stack, handlers, and auth; recreating per request adds 1-3ms overhead.
---
## Bad Example
```php
public function charge($data) {
    $connector = new StripeConnector(); // created on every call
}
```
---
## Good Example
```php
class PaymentService {
    private StripeConnector $connector;
    public function __construct() {
        $this->connector = app(StripeConnector::class); // singleton — cached per request
    }
}
```
---
## Exceptions
Single-call-per-request integrations where overhead is negligible.
---
## Consequences Of Violation
Unnecessary Guzzle re-initialization, increased latency, wasted resources per request.
## Log All SDK Calls with Full Context
---
## Observability
---
## Rule
Add logging middleware to the SDK that captures endpoint, request ID, status code, timing, and error details.
---
## Reason
Without SDK-level logging, debugging production integration issues requires adding debug code; context-rich logs enable rapid diagnosis.
---
## Bad Example
```php
// No logging — debugging requires adding log statements
```
---
## Good Example
```php
class LoggingMiddleware {
    public function __invoke(callable $handler): callable {
        return function ($request, array $options) use ($handler) {
            $start = microtime(true);
            return $handler($request, $options)->then(function ($response) use ($start, $request) {
                Log::info('SDK call', [
                    'method' => $request->getMethod(),
                    'uri' => (string) $request->getUri(),
                    'status' => $response->getStatusCode(),
                    'duration' => (microtime(true) - $start) * 1000,
                ]);
            });
        };
    }
}
```
---
## Exceptions
None — always log SDK calls.
---
## Consequences Of Violation
Production debugging requires adding log statements, slow incident diagnosis, no performance baseline data.
## Handle Nullable Fields Explicitly in DTOs
---
## Reliability
---
## Rule
Use nullable types (e.g., `?string`) for all optional response fields in DTOs; never assume fields are always present.
---
## Reason
API responses may omit optional fields; non-nullable types cause runtime errors on null values.
---
## Bad Example
```php
class UserDto {
    public string $middleName; // crashes if API omits middle_name
}
```
---
## Good Example
```php
class UserDto {
    public ?string $middleName = null; // handles omitted field gracefully
}
```
---
## Exceptions
Fields guaranteed to always be present (API contract enforces required).
---
## Consequences Of Violation
Runtime type errors on null values, production crashes on responses with omitted optional fields.
## Test Against Sandbox API in CI; Mock Locally
---
## Testing
---
## Rule
Run SDK contract tests against a sandbox/test API in CI; use Saloon MockClient or Http::fake() for local development.
---
## Reason
Sandbox tests verify real API behavior; mock tests enable fast, isolated local testing without network dependency.
---
## Bad Example
```php
// Only mock tests — real API behavior never verified
```
---
## Good Example
```php
// CI: runs against sandbox API with test credentials
public function test_get_user_returns_dto(): void {
    $dto = $this->sdk->getUser('testuser');
    $this->assertInstanceOf(UserDto::class, $dto);
}
// Local: mock client
public function test_get_user_with_mock(): void {
    $this->sdk->swapClient(new MockClient([...]));
}
```
---
## Exceptions
APIs without sandbox environments.
---
## Consequences Of Violation
Real API integration bugs caught only in production, mock-sandbox differences undetected, deployment risk.
