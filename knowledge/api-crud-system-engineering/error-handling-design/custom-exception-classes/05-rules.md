# Phase 5: Rules — Custom Exception Classes

## Rule: One Exception Class Per Error Code
---
## Category
Code Organization | Maintainability
---
## Rule
Always define exactly one exception class per error code; never reuse a single exception class for multiple distinct error scenarios.
---
## Reason
The exception class name becomes the self-documenting identifier for the error — `UserNotFoundException` tells you exactly what happened without inspecting the code. One-to-one mapping keeps testing, handling, and monitoring unambiguous.
---
## Bad Example
```php
class ApiException extends \RuntimeException
{
    // Used for every error with a different $code string
}
throw new ApiException('USER_NOT_FOUND', 404);
throw new ApiException('ORDER_ALREADY_REFUNDED', 409);
```
---
## Good Example
```php
class UserNotFoundException extends OperationalException
{
    public function __construct(string $identifier)
    {
        parent::__construct(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: 'The requested user was not found.',
        );
    }
}
class OrderAlreadyRefundedException extends OperationalException
{
    public function __construct(int $orderId)
    {
        parent::__construct(
            errorCode: ErrorCodes::ORDER_ALREADY_REFUNDED,
            statusCode: 409,
            message: 'This order has already been refunded.',
        );
    }
}
```
---
## Exceptions
During rapid prototyping before the error taxonomy is finalized; consolidate to single classes once stable.
---
## Consequences Of Violation
Harder to track error sources; handler must inspect exception internals instead of using `instanceof`; test coverage gaps.

---

## Rule: Never Include Business Logic in Exception Constructors
---
## Category
Design | Reliability
---
## Rule
Always keep exception constructors free of side effects — no logging, database queries, notifications, or service calls. Exceptions carry data only.
---
## Reason
Exceptions may be constructed but never thrown (e.g., during serialisation checks, logging). Business logic in constructors causes unexpected side effects, serialisation errors, and test coupling.
---
## Bad Example
```php
class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        Log::warning('User not found', ['user_id' => $userId]); // side effect
        Mail::send(...); // side effect — fails when serializing for queue
        parent::__construct(...);
    }
}
```
---
## Good Example
```php
class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        // No side effects — data only
        parent::__construct(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: 'The requested user was not found.',
            context: ['user_id' => $userId],
        );
    }
}
// Logging happens in the handler, not the exception
```
---
## Exceptions
No common exceptions — exception constructors must be side-effect free.
---
## Consequences Of Violation
Serialisation errors when queueing exceptions; test failures from unexpected service calls; double-logging; memory/resource leaks.

---

## Rule: Mark All Exception Properties as readonly
---
## Category
Reliability | Maintainability
---
## Rule
Always declare all exception properties as `readonly` (or the entire class as `readonly` in PHP 8.2+) to prevent mutation after construction.
---
## Reason
Immutable exception context ensures predictable error response content — no code can modify the error code, message, or context after the exception is thrown.
---
## Bad Example
```php
class UserNotFoundException extends OperationalException
{
    protected array $context = []; // mutable — can be changed after throw
}
// Later in some handler:
$e->context['extra'] = 'leaked data'; // unpredictable
```
---
## Good Example
```php
readonly class UserNotFoundException extends OperationalException
{
    public function __construct(
        int $userId,
    ) {
        parent::__construct(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: 'The requested user was not found.',
            context: ['user_id' => $userId],
        );
    }
}
```
---
## Exceptions
PHP 8.0/8.1 compatibility required; use `private(set)` (PHP 8.4) as the closest alternative.
---
## Consequences Of Violation
Unpredictable error responses as context is mutated post-throw; debugging nightmare tracking what mutated the exception.

---

## Rule: Use Static Factory Methods for Varying Exception Contexts
---
## Category
Design | Maintainability
---
## Rule
Always provide static factory methods on exception classes when multiple construction patterns exist — e.g., `UserNotFound::forId($id)` and `UserNotFound::forEmail($email)` — instead of complex constructor signatures.
---
## Reason
Static factories with intention-revealing names are more readable than constructor parameters with flags; they enforce correct context per pattern at compile time.
---
## Bad Example
```php
class UserNotFoundException extends OperationalException
{
    public function __construct(
        string $identifier,
        string $identifierType, // 'id' | 'email' — ambiguous
    ) { /* ... */ }
}
throw new UserNotFoundException($email, 'email'); // unclear at call site
```
---
## Good Example
```php
class UserNotFoundException extends OperationalException
{
    public static function forId(int $id): static
    {
        return new static(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: "The requested user was not found.",
            context: ['user_id' => $id],
        );
    }
    public static function forEmail(string $email): static
    {
        return new static(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: "No user exists with this email address.",
            context: ['email_hash' => hash('sha256', $email)],
        );
    }
}
throw UserNotFoundException::forId($userId); // clear intent
```
---
## Exceptions
The exception has only one possible construction pattern with no variation in context.
---
## Consequences Of Violation
Reduced readability at throw sites; wrong context passed due to parameter order confusion; harder to maintain as exception evolves.

---

## Rule: Use Three-Level Inheritance Hierarchy Maximum
---
## Category
Code Organization | Maintainability
---
## Rule
Always limit the exception inheritance hierarchy to three levels maximum: `ApiException` → category base class → domain exception class. Never exceed this depth.
---
## Reason
Deep inheritance hierarchies make it hard to determine the effective error handling strategy; instanceof checks become expensive and confusing beyond three levels.
---
## Bad Example
```php
// Four levels — confusing, hard to maintain
ApiException → OperationalException → UserException → UserNotFoundException
```
---
## Good Example
```php
// Three levels — clear, easy to reason about
ApiException → OperationalException → UserNotFoundException
```
---
## Exceptions
A domain has an exceptionally large number of errors (50+) that require an intermediate grouping; review quarterly and flatten if possible.
---
## Consequences Of Violation
Confusing handler logic; instanceof checks miss exceptions due to unexpected depth; harder onboarding for new developers.

---

## Rule: Place All Domain Exceptions in app/Domains/{Domain}/Exceptions/
---
## Category
Code Organization
---
## Rule
Always place custom exception classes in `app/Domains/{Domain}/Exceptions/` directory, mirroring the domain namespace structure; never throw domain exceptions from a global `Exceptions` directory.
---
## Reason
Domain-aligned directory structure makes error types discoverable by domain, prevents naming collisions, and keeps exceptions co-located with the domain code that throws them.
---
## Bad Example
```php
// All exceptions dumped in one directory
app/Exceptions/UserNotFoundException.php
app/Exceptions/OrderNotFoundException.php
app/Exceptions/PaymentDeclinedException.php
```
---
## Good Example
```php
// Each domain owns its exceptions
app/Domains/User/Exceptions/UserNotFoundException.php
app/Domains/Order/Exceptions/OrderNotFoundException.php
app/Domains/Payment/Exceptions/PaymentDeclinedException.php
```
---
## Exceptions
The application has only one domain (single bounded context); a single `app/Exceptions/` directory suffices.
---
## Consequences Of Violation
Exception files become unmanageable as domains grow; naming collisions between domains; developers must search multiple directories to find exceptions.

---

## Rule: Register All Custom Exception Classes in the Handler
---
## Category
Reliability | Testing
---
## Rule
Always register every custom exception class in the global exception handler's renderable callbacks; use CI/PHPStan to enforce that no `ApiException` subclass is unmapped.
---
## Reason
Unregistered exceptions fall through to the generic 500 fallback, losing their specific error code, status, and context detail — defeating the purpose of custom exceptions.
---
## Bad Example
```php
// New exception created but never registered in handler
class OrderAlreadyRefundedException extends OperationalException {}
// Falls through to generic 500 with SYSTEM.INTERNAL_ERROR
```
---
## Good Example
```php
// Register in Handler:
$this->renderable(function (OrderAlreadyRefundedException $e, Request $request) {
    return $request->expectsJson()
        ? response()->json($e->toEnvelope(), $e->getStatusCode())
        : null;
});

// CI rule enforces registration:
// PHPStan: all child classes of ApiException must have a registered renderable
```
---
## Exceptions
Exceptions that are always caught and handled locally (never reach the handler); document these explicitly.
---
## Consequences Of Violation
Custom exceptions lose their specific handling; clients receive generic 500 with wrong error code; debugging is impaired.

---

## Rule: Limit Exception Context to 5 Fields Maximum
---
## Category
Performance | Design
---
## Rule
Always limit exception context arrays to 5 fields maximum; never include large data objects, collections, or full request data in context.
---
## Reason
Exception context is serialized for logs and error tracking; large context causes memory bloat, slow serialization, and excessive log storage costs.
---
## Bad Example
```php
class OrderNotFoundException extends OperationalException
{
    public function __construct(Order $order)
    {
        parent::__construct(
            errorCode: ErrorCodes::ORDER_NOT_FOUND,
            statusCode: 404,
            message: 'Order not found.',
            context: [
                'order_data' => $order->toArray(), // Full model — too large
                'related_orders' => $order->related()->get()->toArray(), // collection
            ],
        );
    }
}
```
---
## Good Example
```php
class OrderNotFoundException extends OperationalException
{
    public function __construct(int $orderId)
    {
        parent::__construct(
            errorCode: ErrorCodes::ORDER_NOT_FOUND,
            statusCode: 404,
            message: 'Order not found.',
            context: [
                'order_id' => $orderId,
                'resource_type' => 'Order',
            ], // 2 small fields
        );
    }
}
```
---
## Exceptions
No common exceptions — more than 5 fields indicates the exception is carrying too much responsibility.
---
## Consequences Of Violation
Memory exhaustion on error bursts; slow log ingestion; excessive error tracking costs; serialisation errors with large objects.
