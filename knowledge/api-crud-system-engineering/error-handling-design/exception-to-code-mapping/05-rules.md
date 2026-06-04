# Phase 5: Rules — Exception-to-Code Mapping

## Rule: Use an Explicit Mapping Array, Not Conventions or Reflection
---
## Category
Maintainability | Code Organization
---
## Rule
Always define the exception-to-code mapping as an explicit array of FQCN → error code pairs in the handler; never use naming conventions, attributes, or reflection to derive the mapping.
---
## Reason
An explicit array is auditable, easy to review in PRs, and trivially understood by all team members. Conventions and reflection are invisible to code review and break silently when naming patterns change.
---
## Bad Example
```php
// Convention-based — breaks if class renamed
private function resolveCode(Throwable $e): string
{
    $name = str_replace('Exception', '', class_basename($e));
    return strtoupper(Str::snake($name)); // Fragile
}
```
---
## Good Example
```php
protected array $exceptionCodeMap = [
    AuthenticationException::class   => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
    AuthorizationException::class    => ErrorCodes::USER_AUTH_FORBIDDEN,
    ModelNotFoundException::class    => ErrorCodes::RESOURCE_NOT_FOUND,
    ValidationException::class       => ErrorCodes::VALIDATION_ERROR,
    ThrottleRequestsException::class => ErrorCodes::SYSTEM_RATE_LIMITED,
    QueryException::class            => ErrorCodes::SYSTEM_DATABASE_ERROR,
];
```
---
## Exceptions
Custom exceptions implementing a `HasErrorCode` interface that returns their own code; use the interface as a higher-priority check before the map.
---
## Consequences Of Violation
Mapping breaks silently on class rename; new team members cannot understand mapping logic; review misses incorrect mappings.

---

## Rule: Register a Catch-All Throwable Fallback as the Last Mapping
---
## Category
Reliability | Framework Usage
---
## Rule
Always register a `Throwable` fallback renderable as the last callback in the handler to catch any unmapped exception; never rely on every possible exception having an explicit mapping.
---
## Reason
Without a fallback, an unmapped exception returns a Symfony/Whoops HTML error page or a generic 500 with no envelope, breaking the API contract for JSON clients.
---
## Bad Example
```php
// No fallback — unknown exception returns Whoops HTML
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, $request) { /* ... */ });
    $this->renderable(function (ValidationException $e, $request) { /* ... */ });
    // Everything else → Whoops HTML error page
}
```
---
## Good Example
```php
public function register(): void
{
    $this->renderable(function (AuthenticationException $e, $request) { /* ... */ });
    $this->renderable(function (ValidationException $e, $request) { /* ... */ });
    // Catch-all fallback — always last
    $this->renderable(function (Throwable $e, $request) {
        return $request->expectsJson()
            ? $this->renderServerError($e, $request)
            : null;
    });
}
```
---
## Exceptions
No common exceptions — a Throwable fallback is mandatory for API reliability.
---
## Consequences Of Violation
HTML error pages returned for API requests; client integration breaks; unhandled exceptions expose stack traces in production.

---

## Rule: Map All Framework Exceptions Explicitly
---
## Category
Framework Usage | Reliability
---
## Rule
Always register explicit mappings for all Laravel framework exceptions that may surface in API routes: `AuthenticationException`, `AuthorizationException`, `ModelNotFoundException`, `ValidationException`, `ThrottleRequestsException`, and `QueryException`.
---
## Reason
Framework exceptions have default behaviors (redirect, HTML response) that are inappropriate for API routes. Without explicit mappings, these return non-JSON responses or incorrect status codes.
---
## Bad Example
```php
// Only some framework exceptions mapped — others fall through
protected array $exceptionCodeMap = [
    ModelNotFoundException::class => ErrorCodes::RESOURCE_NOT_FOUND,
    // Missing: AuthenticationException, ValidationException, etc.
];
```
---
## Good Example
```php
protected array $exceptionCodeMap = [
    AuthenticationException::class   => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
    AuthorizationException::class    => ErrorCodes::USER_AUTH_FORBIDDEN,
    ModelNotFoundException::class    => ErrorCodes::RESOURCE_NOT_FOUND,
    ValidationException::class       => ErrorCodes::VALIDATION_ERROR,
    ThrottleRequestsException::class => ErrorCodes::SYSTEM_RATE_LIMITED,
    QueryException::class            => ErrorCodes::SYSTEM_DATABASE_ERROR,
    NotFoundHttpException::class     => ErrorCodes::ROUTE_NOT_FOUND,
];
```
---
## Exceptions
A framework exception that is always caught and handled within controllers and never reaches the handler.
---
## Consequences Of Violation
API routes return HTML redirects for auth failures; validation errors return raw error arrays without envelope; model 404s return Whoops.

---

## Rule: Map Third-Party Package Exceptions in Their Service Providers
---
## Category
Code Organization | Maintainability
---
## Rule
Always register error code mappings for third-party package exceptions in the package's own service provider or a dedicated provider; never add them to the main handler's mapping array.
---
## Reason
Package-specific mappings should be co-located with the package registration — if the package is removed, the mapping goes with it. The main handler should only contain first-party and framework mappings.
---
## Bad Example
```php
// Handler grows with every package added
class Handler extends ExceptionHandler
{
    protected array $exceptionCodeMap = [
        AuthenticationException::class => '...',
        // Spatie mapping mixed in with core mappings
        \Spatie\Permission\Exceptions\UnauthorizedException::class => ErrorCodes::USER_AUTH_INSUFFICIENT_ROLE,
    ];
}
```
---
## Good Example
```php
// In SpatiePermissionServiceProvider:
class SpatiePermissionServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->make(Handler::class)->registerMapping(
            \Spatie\Permission\Exceptions\UnauthorizedException::class,
            ErrorCodes::USER_AUTH_INSUFFICIENT_ROLE,
        );
    }
}
```
---
## Exceptions
Small projects with one or two packages; keep mappings in the handler until the list grows beyond 3 third-party entries.
---
## Consequences Of Violation
Handler file grows uncontrollably; package removal leaves orphaned mappings; merge conflicts on the handler array.

---

## Rule: Vary ModelNotFoundException Mapping by Model Class
---
## Category
Design | Maintainability
---
## Rule
Always switch on the model class name when mapping `ModelNotFoundException` to return a domain-specific error code per model; never return a single generic `NOT_FOUND` for all models.
---
## Reason
Different resources require different client handling — a user 404 should trigger different UI than an order 404. A single generic code forces clients to parse the message or resource_type to differentiate.
---
## Bad Example
```php
$this->renderable(function (ModelNotFoundException $e, $request) {
    return response()->json(
        new ErrorEnvelope(ErrorCodes::RESOURCE_NOT_FOUND, 'Not found.', 404),
        404,
    );
    // Same code for User, Order, Payment — client can't differentiate
});
```
---
## Good Example
```php
$this->renderable(function (ModelNotFoundException $e, $request) {
    $model = class_basename($e->getModel());
    $code = match ($model) {
        'User'  => ErrorCodes::USER_NOT_FOUND,
        'Order' => ErrorCodes::ORDER_NOT_FOUND,
        'Payment' => ErrorCodes::PAYMENT_NOT_FOUND,
        default => ErrorCodes::RESOURCE_NOT_FOUND,
    };
    return response()->json(
        new ErrorEnvelope($code, 'The requested resource was not found.', 404),
        404,
    );
});
```
---
## Exceptions
Models where the resource type should not be revealed for security (public APIs hiding resource existence).
---
## Consequences Of Violation
Clients cannot distinguish resource types in 404 responses; error handling code must parse messages; unable to show resource-specific UI.

---

## Rule: Vary AuthenticationException Mapping by Guard Name
---
## Category
Design | Maintainability
---
## Rule
Always switch on the guard name when mapping `AuthenticationException` to select the appropriate error code; never use a single generic code for all guards.
---
## Reason
Sanctum token expired → client can refresh; Passport token invalid → client must re-login; web guard → redirect. Different guards require different client actions.
---
## Bad Example
```php
$this->renderable(function (AuthenticationException $e, $request) {
    return response()->json(
        new ErrorEnvelope(ErrorCodes::USER_AUTH_UNAUTHENTICATED, 'Auth required.', 401),
        401,
    );
    // Same code for expired Sanctum token and invalid Passport token
});
```
---
## Good Example
```php
$this->renderable(function (AuthenticationException $e, $request) {
    $code = match ($e->guards()) {
        ['sanctum'] => ErrorCodes::USER_AUTH_TOKEN_EXPIRED,
        ['passport'] => ErrorCodes::USER_AUTH_TOKEN_INVALID,
        default => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
    };
    return response()->json(
        new ErrorEnvelope($code, 'Authentication required.', 401),
        401,
    );
});
```
---
## Exceptions
Single-guard applications where all auth failures behave identically.
---
## Consequences Of Violation
Expired tokens incorrectly trigger re-login instead of silent refresh; guard-specific client logic cannot be implemented.

---

## Rule: Log Unmapped Exceptions at WARNING Level
---
## Category
Maintainability | Reliability
---
## Rule
Always log a WARNING-level message when an exception falls through the mapping without an explicit code; never silently assign a default code.
---
## Reason
Silent fallback to `INTERNAL_ERROR` hides missing mappings. A WARNING log surfaces the gap during development and testing so it can be addressed before it reaches production.
---
## Bad Example
```php
public function resolveCode(Throwable $e): string
{
    return $this->exceptionCodeMap[$e::class]
        ?? ErrorCodes::SYSTEM_INTERNAL_ERROR; // Silent fallback — no alert
}
```
---
## Good Example
```php
public function resolveCode(Throwable $e): string
{
    if (isset($this->exceptionCodeMap[$e::class])) {
        return $this->exceptionCodeMap[$e::class];
    }

    Log::warning('Unmapped exception type', [
        'exception_class' => $e::class,
        'message' => $e->getMessage(),
    ]);

    return ErrorCodes::SYSTEM_INTERNAL_ERROR;
}
```
---
## Exceptions
No common exceptions — unmapped exceptions must always produce a warning in logs.
---
## Consequences Of Violation
Missing mappings go undetected until production; all unmapped exceptions return the same generic code; debugging is harder.

---

## Rule: Never Use Exception::class or Throwable::class as a Mapping Key for Specific Codes
---
## Category
Reliability | Maintainability
---
## Rule
Always register specific exception classes — never `Exception::class`, `RuntimeException::class`, or `Throwable::class` — as explicit mapping keys with production error codes.
---
## Reason
Generic base class mappings catch everything before more specific mappings can match, hiding all detailed error codes and defeating the purpose of the mapping system.
---
## Bad Example
```php
// Generic catch-all mapped first — nothing else matches
protected array $exceptionCodeMap = [
    \Exception::class => ErrorCodes::SYSTEM_INTERNAL_ERROR, // Eats everything
    AuthenticationException::class => ErrorCodes::USER_AUTH_UNAUTHENTICATED, // Never reached
];
```
---
## Good Example
```php
// Specific exceptions listed first; generic Throwable is the renderable fallback
protected array $exceptionCodeMap = [
    AuthenticationException::class   => ErrorCodes::USER_AUTH_UNAUTHENTICATED,
    AuthorizationException::class    => ErrorCodes::USER_AUTH_FORBIDDEN,
    ModelNotFoundException::class    => ErrorCodes::RESOURCE_NOT_FOUND,
    // No Exception::class here — handled by Throwable fallback renderable
];
```
---
## Exceptions
No common exceptions — generic class mappings are always an anti-pattern.
---
## Consequences Of Violation
All exceptions return `SYSTEM.INTERNAL_ERROR` regardless of type; operational errors trigger P1 alerts; client error handling completely broken.
