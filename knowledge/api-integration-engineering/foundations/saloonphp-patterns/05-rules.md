## One Connector Per External Service
---
## Category
Architecture
---
## Rule
Create one Saloon Connector class per external service and register it as a singleton in the container.
---
## Reason
Connectors hold base URL, headers, auth, and connection pool configuration; a single instance ensures connection reuse and consistent configuration across all requests to that service.
---
## Bad Example
```php
$connector = new StripeConnector(); // new instance created per request — no connection reuse
```
---
## Good Example
```php
// ServiceProvider
$this->app->singleton(StripeConnector::class, function () {
    return new StripeConnector();
});
// Usage — same instance reused
```
---
## Exceptions
Multi-tenant integrations where each tenant needs a different connector configuration.
---
## Consequences Of Violation
No connection pooling (higher latency), inconsistent configuration, increased socket usage.
## One Request Class Per Endpoint
---
## Category
Code Organization
---
## Rule
Create one Request class per API endpoint (HTTP method + path combination); never put multiple endpoints in one class.
---
## Reason
Each endpoint has unique method, path, query parameters, body schema, and response DTO; merging them violates SRP and creates ambiguous classes.
---
## Bad Example
```php
class UserRequest extends Request {
    public function resolveEndpoint(): string {
        return $this->userId ? "/users/{$this->userId}" : '/users';
    }
}
```
---
## Good Example
```php
class ListUsersRequest extends Request { protected Method $method = Method::GET; public function resolveEndpoint(): string { return '/users'; } }
class GetUserRequest extends Request { protected Method $method = Method::GET; public function resolveEndpoint(): string { return "/users/{$this->id}"; } }
class CreateUserRequest extends Request { protected Method $method = Method::POST; public function resolveEndpoint(): string { return '/users'; } }
```
---
## Exceptions
Endpoints that differ only by optional query parameters can share a request class.
---
## Consequences Of Violation
Conditional logic inside request classes, hard-to-test endpoints, unclear API contracts.
## Always Use DTOs for Response Mapping
---
## Category
Maintainability
---
## Rule
Implement `createDtoFromResponse()` on every Request class to map API responses to typed DTOs.
---
## Reason
DTOs provide type safety, autocompletion, and explicit contracts; raw array access throughout the codebase is brittle and error-prone.
---
## Bad Example
```php
$response = $connector->send(new ListChargesRequest());
$data = $response->array(); // raw array — no type safety
```
---
## Good Example
```php
$charges = $connector->send(new ListChargesRequest())->dto(); // returns typed ChargeCollection
```
---
## Exceptions
Passthrough proxy endpoints where the raw response is forwarded unchanged.
---
## Consequences Of Violation
Array key typos cause runtime errors, no IDE support, refactoring breaks silently.
## Use MockClient for Testing
---
## Category
Testing
---
## Rule
Always use Saloon's MockClient in tests instead of making real HTTP calls to external APIs.
---
## Reason
MockClient provides fast, deterministic, environment-independent tests that verify request details and response handling.
---
## Bad Example
```php
public function test_fetch_charges(): void {
    $connector = new StripeConnector(); // real HTTP call
    $charges = $connector->send(new ListChargesRequest());
}
```
---
## Good Example
```php
public function test_fetch_charges(): void {
    $connector = new StripeConnector;
    $connector->withMockClient(new MockClient([
        ListChargesRequest::class => MockResponse::make(['data' => []], 200),
    ]));
    $charges = $connector->send(new ListChargesRequest())->dto();
}
```
---
## Exceptions
End-to-end or contract tests that explicitly validate against the real API.
---
## Consequences Of Violation
Flaky tests dependent on network and API availability, slow test suites, hitting upstream rate limits during tests.
## Use Pipelines for Cross-Cutting Concerns
---
## Category
Architecture
---
## Rule
Configure Saloon pipelines (auth, logging, retry) in the Connector's `bootConnector()` method, not per request.
---
## Reason
Pipeline middleware ensures consistent behavior across all requests to the service without duplicating configuration.
---
## Bad Example
```php
$request = new ListChargesRequest()->withTokenAuth($token); // auth handled per request
```
---
## Good Example
```php
class StripeConnector extends Connector {
    protected function bootConnector(): void {
        $this->authenticate(new BearerAuthenticator(config('services.stripe.secret')));
        $this->addLogger($this->logger);
    }
}
```
---
## Exceptions
Requests requiring special overrides (e.g., temporary elevated scope) may add per-request middleware.
---
## Consequences Of Violation
Inconsistent auth, logging gaps on some requests, duplicated configuration across request sites.
