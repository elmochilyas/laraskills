# Rules for Custom Exception Classes

---

## Rule: Use Typed Exception Classes Instead of Generic Exceptions with String Codes

---

## Category

Design

---

## Rule

Always create a distinct exception class for each domain-specific error condition. Never use a single generic exception class with a string `type` or `code` field to distinguish error types.

---

## Reason

Typed exceptions enable catch-by-type in handlers and services. String-based discrimination forces message parsing or conditional type checks, which are brittle and bypass PHP's type system.

---

## Bad Example

```php
class DomainException extends Exception
{
    public function __construct(
        public readonly string $errorType, // 'payment_failed', 'inventory_low', etc.
        string $message,
    ) {
        parent::__construct($message);
    }
}

// Handler must parse $e->errorType instead of matching on class
throw new DomainException('payment_failed', 'Payment declined.');
```

---

## Good Example

```php
class PaymentFailedException extends Exception {}
class InsufficientInventoryException extends Exception {}

// Handler catches by type
$exceptions->renderable(function (PaymentFailedException $e, Request $request) {
    return response()->json(['error' => 'Payment failed.'], 422);
});
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: adding a new error type requires modifying every switch statement on the string code. Reliability risks: misspelled string codes silently fall through to generic handling.

---

## Rule: Always Include Structured Context Data as Public Readonly Properties

---

## Category

Design

---

## Rule

Always add typed `public readonly` properties to custom exceptions for contextual data (user ID, amount, SKU, reason). Never require handlers to parse the exception message string.

---

## Reason

Message strings change during copy updates, breaking any code that parses them. Typed properties are immutable, self-documenting, and directly accessible by handlers, loggers, and error trackers.

---

## Bad Example

```php
throw new PaymentFailedException('Payment failed for user 123, amount 50.00');
// Handler must parse: $message = explode(',', $e->getMessage())
```

---

## Good Example

```php
class PaymentFailedException extends Exception
{
    public function __construct(
        public readonly string $paymentMethod,
        public readonly float $amount,
        public readonly string $failureReason,
        string $message = 'Payment processing failed.',
        int $code = 422,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
```

---

## Exceptions

Exception classes used purely as control-flow signals with no contextual data need no properties.

---

## Consequences Of Violation

Maintenance risks: message format changes break handler logic. Reliability risks: error context is lost to logs because properties are not passed to structured logging.

---

## Rule: Create a Domain Base Exception for Grouping Related Errors

---

## Category

Architecture

---

## Rule

Always create an abstract base exception per domain (e.g., `BillingException`, `InventoryException`) for every group of related custom exception types. Extend all domain-specific exceptions from it.

---

## Reason

A domain base exception enables catch-all handling at the domain boundary: `catch (BillingException $e)`. Without it, you must either catch each type individually or fall back to catching `Exception`.

---

## Bad Example

```php
// No base exception — must catch each type individually
try {
    $billing->charge($user, $amount);
} catch (PaymentFailedException $e) {
    // handle
} catch (SubscriptionExpiredException $e) {
    // handle
} catch (InvoiceGenerationException $e) {
    // handle
}
```

---

## Good Example

```php
namespace App\Exceptions\Billing;

abstract class BillingException extends Exception {}

class PaymentFailedException extends BillingException {}
class SubscriptionExpiredException extends BillingException {}
class InvoiceGenerationException extends BillingException {}

// Single catch for all billing errors
try {
    $billing->charge($user, $amount);
} catch (BillingException $e) {
    // Log, notify, return error
}
```

---

## Exceptions

Small applications with 1–2 custom exceptions do not need a domain base. Add it when you have 3+ related exception types.

---

## Consequences Of Violation

Maintenance risks: adding a new exception type requires updating every catch list. Reliability risks: a missed type in a catch list causes unhandled exceptions to propagate.

---

## Rule: Use Public Readonly Properties, Never Getters for Context Data

---

## Category

Design

---

## Rule

Always use promoted `public readonly` constructor properties for exception context data. Never use private properties with getter methods.

---

## Reason

Private properties with getters add boilerplate and prevent direct access in logs and error trackers. `public readonly` properties are accessible, immutable, and serialize correctly in structured logging.

---

## Bad Example

```php
class PaymentFailedException extends Exception
{
    private string $paymentMethod;
    private float $amount;

    public function getPaymentMethod(): string { return $this->paymentMethod; }
    public function getAmount(): float { return $this->amount; }
}
```

---

## Good Example

```php
class PaymentFailedException extends Exception
{
    public function __construct(
        public readonly string $paymentMethod,
        public readonly float $amount,
    ) {
        parent::__construct('Payment failed.');
    }
}
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: more boilerplate to write and maintain. Reliability risks: getters may not be called during logging, losing context data from error reports.

---

## Rule: Name Exceptions Descriptively — What Failed, Not Where

---

## Category

Maintainability

---

## Rule

Name exception classes based on what went wrong (e.g., `PaymentFailedException`, `InsufficientInventoryException`). Never name exceptions based on where they are thrown (e.g., `UserControllerException`, `CheckoutProcessException`).

---

## Reason

The exception type communicates the error condition. A name based on location tells nothing about what happened and conflates unrelated error conditions in the same class.

---

## Bad Example

```php
// Named after location — doesn't describe the error
class UserServiceException extends Exception {}
throw new UserServiceException('User not found.'); // Could mean anything
```

---

## Good Example

```php
// Named after the condition — self-documenting
class UserNotFoundException extends Exception {}
throw new UserNotFoundException('User not found.');
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Maintenance risks: multiple unrelated error conditions are lumped into the same class. Reliability risks: handlers cannot distinguish between different error conditions.

---

## Rule: Never Include Sensitive Data in Exception Properties

---

## Category

Security

---

## Rule

Never include passwords, tokens, API keys, full credit card numbers, or any PII in exception properties or messages.

---

## Reason

Exception properties are logged, reported to error trackers, and may be rendered in error responses. Sensitive data in exceptions creates compliance violations (GDPR, PCI-DSS) and security risks.

---

## Bad Example

```php
throw new AuthenticationFailedException(
    password: 'plaintext-password', // Never
    token: 'eyJ...full-jwt',       // Never
    email: 'user@example.com',
);
```

---

## Good Example

```php
throw new AuthenticationFailedException(
    email: md5('user@example.com'), // Anonymized
    failureReason: 'invalid_credentials',
);
```

---

## Exceptions

No common exceptions.

---

## Consequences Of Violation

Security risks: credentials and PII leaked through error trackers. Compliance risks: GDPR/PCI-DSS violations from logging sensitive data.

---

## Rule: Register a renderable() or Implement render() for Every Custom Exception

---

## Category

Reliability

---

## Rule

Always ensure every custom exception is either registered with a `renderable()` callback in the exception handler or implements its own `render()` method. Never create a custom exception that falls through to a generic 500 response.

---

## Reason

An unregistered custom exception produces a generic error with no useful information for the client. The purpose of a custom exception is precise handling — that handling must be defined.

---

## Bad Example

```php
class PaymentFailedException extends Exception
{
    // No render() method
    // No renderable() callback registered in handler
    // Falls through to default 500 with no useful details
}
```

---

## Good Example

```php
// Option 1: renderable() in handler
$exceptions->renderable(function (PaymentFailedException $e, Request $request) {
    return response()->json(['error' => $e->getMessage()], 422);
});

// Option 2: render() on exception class
class PaymentFailedException extends Exception
{
    public function render(Request $request): JsonResponse
    {
        return response()->json([
            'error' => $this->getMessage(),
            'amount' => $this->amount,
        ], 422);
    }
}
```

---

## Exceptions

Exception classes caught and handled at the service layer (never propagated to HTTP) do not need rendering logic.

---

## Consequences Of Violation

Reliability risks: custom exceptions produce generic 500 responses. Maintenance risks: developers cannot tell whether a custom exception is intentionally unhandled or simply forgotten.

---

## Rule: Namespace Custom Exceptions by Domain for Larger Applications

---

## Category

Code Organization

---

## Rule

For applications with more than 10 custom exception classes, namespace them by domain (e.g., `App\Exceptions\Billing\PaymentFailedException`). Never put all custom exceptions in the flat `App\Exceptions` namespace.

---

## Reason

Flat namespaces become disorganized as the application grows. Domain-based namespacing makes exceptions discoverable, prevents naming collisions, and mirrors the application's bounded contexts.

---

## Bad Example

```php
// Flat namespace — 30+ exception classes in one directory
App\Exceptions\PaymentFailedException
App\Exceptions\InvoiceNotFoundException
App\Exceptions\InventoryShortageException
App\Exceptions\SubscriptionExpiredException
```

---

## Good Example

```php
// Domain-namespaced — organized by bounded context
App\Exceptions\Billing\PaymentFailedException
App\Exceptions\Billing\InvoiceNotFoundException
App\Exceptions\Inventory\ShortageException
App\Exceptions\Subscriptions\ExpiredException
```

---

## Exceptions

Small applications with fewer than 5 custom exceptions may use the flat `App\Exceptions` namespace.

---

## Consequences Of Violation

Maintenance risks: developers cannot easily find exception classes. Design risks: namespace collisions force awkward class names like `BillingPaymentFailedException`.

---

## Rule: Keep Exception Messages User-Friendly When User-Facing

---

## Category

Design

---

## Rule

Always keep the exception message user-friendly and safe for end-user display when the exception will be rendered in an API response or error page. Never use technical descriptions or internal error codes as the user-facing message.

---

## Reason

Exception messages often appear directly in error responses. Technical messages confuse users. User-friendly messages improve the experience without sacrificing debugging — log the technical details separately.

---

## Bad Example

```php
// Technical message shown to user
throw new PaymentFailedException(
    message: 'SQLSTATE[23000]: Integrity constraint violation: 1062 Duplicate entry',
    amount: 50.00,
    failureReason: 'duplicate_transaction',
);
```

---

## Good Example

```php
// User-friendly message; technical details in structured properties
throw new PaymentFailedException(
    message: 'Your payment could not be processed. Please try again.',
    amount: 50.00,
    failureReason: 'duplicate_transaction', // Logged, not displayed
);
```

---

## Exceptions

Internal applications where all users are developers may include technical details in messages.

---

## Consequences Of Violation

User experience: technical error messages confuse end users. Security risks: internal implementation details leak in error responses.
