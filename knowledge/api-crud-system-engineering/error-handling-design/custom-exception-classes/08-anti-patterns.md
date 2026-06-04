# Anti-Patterns — Custom Exception Classes

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Custom Exception Classes |
| Difficulty | Expert |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Catch-All Exception Classes | High | Medium | Code review: `ApiException` thrown directly instead of domain subclass |
| Exception Classes with Services | Critical | Low | Code review: repositories, loggers injected into exception constructor |
| Exception as DTO | Medium | Low | Code review: large data objects passed through exception context |
| Exception in Wrong Category | Medium | Medium | Code review: `UserNotFoundException` extends `InfrastructureException` |
| Deep Inheritance Beyond 3 Levels | Medium | Low | Code review: 4+ levels of exception class inheritance |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Throwing Generic Exception | `throw new \Exception('error')` everywhere | No error code, no category, no automatic handling |
| Mutable Context | `$e->context['extra'] = 'value'` after construction | Unpredictable error response, mutation across catch blocks |
| Forgotten Registration | New exception class not mapped in handler | Falls through to generic 500 |
| Exception Class Explosion | 100+ exception classes for every edge case | Unmaintainable catalog with no distinct handling |

---

## Anti-Pattern Details

### AP-CEC-01: Catch-All Exception Classes

**Description**: `ApiException` (or similar base class) is thrown directly at throw sites instead of creating domain-specific subclasses. The exception has no class-level distinction from other errors of the same hierarchy — it relies on a generic code or message for differentiation. The handler cannot route based on exception type.

**Root Cause**: Laziness or lack of understanding. Creating a new exception class requires a file, class definition, and registration. Throwing the base class requires none of these.

**Impact**:
- Handler cannot use `instanceof` for type-specific rendering
- Error tracking groups all base-class exceptions together
- Exception class name doesn't communicate the error
- Adding a new exception code doesn't get the benefit of a separate class

**Detection**:
- Code review: `throw new ApiException(...)` or `throw new OperationalException(...)` at throw sites
- Code review: exception handler has `instanceof` checks on the base class with string code matching
- Code review: the base class is never extended, only used directly

**Solution**:
- Create a dedicated exception class for every distinct error scenario
- The class name IS the error documentation: `UserNotFoundException`, `InsufficientStockException`
- Throw the specific class; the handler can match by `instanceof`
- If the class count exceeds 50, review for consolidation

**Example**:
```php
// BEFORE: Catch-all base class thrown directly
class UserService
{
    public function find(int $id): User
    {
        $user = User::find($id);
        if (!$user) {
            throw new OperationalException( // ❌ no class-level distinction
                errorCode: ErrorCodes::USER_NOT_FOUND,
                statusCode: 404,
                message: 'User not found.',
            );
        }
        return $user;
    }
}

// AFTER: Dedicated exception class
class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        parent::__construct(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: 'User not found.',
            context: ['resource_type' => 'User', 'user_id' => $userId],
        );
    }
}

class UserService
{
    public function find(int $id): User
    {
        return User::find($id) ?? throw new UserNotFoundException($id);
    }
}
```

---

### AP-CEC-02: Exception Classes with Services

**Description**: An exception class constructor accepts injected services (repositories, loggers, mailers, notification services) and performs actions like logging, sending emails, or querying the database. This violates the principle that exceptions carry data only — the exception becomes responsible for side effects.

**Root Cause**: Convenience. The developer wants to log the error or send a notification "as part of throwing the exception," not realizing that exceptions are often serialized, rethrown, or caught silently.

**Impact**:
- Serialization errors: services injected into exceptions cannot be serialized for queue jobs
- Side effects on construction: constructing an exception to store in a variable triggers unwanted actions
- Testing coupling: tests must mock injected services even when testing unrelated code that happens to construct the exception
- Error tracking: logged exceptions may be logged twice (once in constructor, once in handler)

**Detection**:
- Code review: exception constructor has type hints for repositories, loggers, mailers
- Code review: exception constructor calls `Log::error()`, `Mail::send()`, or database queries
- Runtime: serialization errors when dispatching exceptions to queues

**Solution**:
- Exceptions should only accept data (scalars, DTOs, context arrays) — never services
- Move all side effects (logging, notification) to the exception handler
- The exception constructor does one thing: sets its properties

**Example**:
```php
// BEFORE: Exception with services
class PaymentFailedException extends OperationalException
{
    public function __construct(
        PaymentDto $dto,
        private LoggerInterface $logger, // ❌ service injected
        private Notifier $notifier,       // ❌ service injected
    ) {
        $this->logger->error('Payment failed', ['order_id' => $dto->orderId]);
        $this->notifier->sendAlert('Payment failed'); // ❌ side effect in constructor
        parent::__construct(/* ... */);
    }
}

// AFTER: Exception carries data only
class PaymentFailedException extends OperationalException
{
    public function __construct(
        int $orderId,
        string $gatewayResponse,
    ) {
        parent::__construct(
            errorCode: ErrorCodes::PAYMENT_DECLINED,
            statusCode: 402,
            message: 'Payment was declined.',
            context: ['order_id' => $orderId, 'gateway_response' => $gatewayResponse],
        );
    }
}
// Logging and notification happen in the handler
```

---

### AP-CEC-03: Forgotten Registration

**Description**: A new custom exception class is created and thrown, but it is never registered in the exception handler's mapping table. When the exception is thrown, it doesn't match any renderable callback and falls through to the generic `Throwable` fallback, losing its specific error code and response shape.

**Root Cause**: The developer creates and throws the exception but forgets to update the handler. There is no CI enforcement or checklist.

**Impact**:
- The exception loses its specific error code — returns generic `SYSTEM.INTERNAL_ERROR`
- The specific error code is not logged or tracked
- Error tracking groups all unregistered exceptions together
- Debugging is confusing: "I threw `UserNotFoundException` but got a generic 500"

**Detection**:
- Code review: new exception class exists but no corresponding mapping in Handler
- CI: no check that all `*Exception` classes extending `ApiException` have handler mappings
- Bug reports: specific exception thrown but generic error returned

**Solution**:
- Add the handler mapping simultaneously with creating the exception class
- Register a CI or PHPStan rule that enforces every `ApiException` subclass has a handler mapping
- Write a test that constructs and throws each exception class and asserts the correct response

**Example**:
```php
// BEFORE: Exception created but not registered
// File: app/Exceptions/Order/OrderAlreadyShippedException.php
class OrderAlreadyShippedException extends OperationalException
{
    public function __construct(int $orderId)
    {
        parent::__construct(
            errorCode: 'ORDER.ALREADY_SHIPPED',
            statusCode: 409,
            message: 'This order has already been shipped.',
        );
    }
}

// Handler: no mapping for OrderAlreadyShippedException → falls through to generic 500 ❌

// AFTER: Exception + mapping created together
class Handler extends ExceptionHandler
{
    public function register(): void
    {
        $this->renderable(function (OrderAlreadyShippedException $e, Request $request) {
            return $request->expectsJson()
                ? response()->json(new ErrorEnvelope($e->getErrorCode(), $e->getMessage(), 409), 409)
                : null;
        });
    }
}
```
