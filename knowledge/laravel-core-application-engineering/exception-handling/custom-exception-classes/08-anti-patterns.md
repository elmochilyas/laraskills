# Anti-Patterns: Custom Exception Classes

## 1. The Stringly-Typed Exception

Using a generic exception class with a string `type` or `code` field to distinguish error types instead of creating distinct typed exception classes.

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

Create distinct typed exception classes for each domain-specific error condition. Typed exceptions enable catch-by-type in handlers and services. String-based discrimination forces message parsing or conditional type checks, which are brittle and bypass PHP's type system.

```php
class PaymentFailedException extends Exception {}
class InsufficientInventoryException extends Exception {}

// Handler catches by type
$exceptions->renderable(function (PaymentFailedException $e, Request $request) {
    return response()->json(['error' => 'Payment failed.'], 422);
});
```

## 2. The Context-Free Exception

A custom exception class that adds no properties beyond the inherited `$message` — it's a typed name without structured data.

```php
throw new PaymentFailedException('Payment failed for user 123, amount 50.00');
// Handler must parse: $message = explode(',', $e->getMessage())
```

Add typed `public readonly` properties for contextual data (user ID, amount, SKU, reason). Message strings change during copy updates, breaking any code that parses them. Typed properties are immutable, self-documenting, and directly accessible by handlers, loggers, and error trackers:

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

## 3. The God Exception

A single custom exception class used for all domain errors with a string `type` field to distinguish them, defeating the purpose of typed exceptions.

```php
// One class for everything — handler cannot catch by type
class BillingException extends Exception
{
    public function __construct(
        public readonly string $type, // 'payment_failed', 'subscription_expired', 'invoice_error'
        string $message,
    ) {
        parent::__construct($message);
    }
}
```

Each domain error condition should have its own exception class. The type itself is documentation. `PaymentFailedException` says exactly what went wrong. The handler matches on type, not message string parsing. Adding a new error type with the god exception requires modifying every switch statement on the string code.

## 4. The Unregistered Exception

Creating a custom exception class but never registering a `renderable()` callback or implementing a `render()` method — the exception falls through to a generic 500 response.

```php
class PaymentFailedException extends Exception
{
    // No render() method
    // No renderable() callback registered in handler
    // Falls through to default 500 with no useful details
}
```

Every custom exception must either be registered with a `renderable()` callback in the exception handler or implement its own `render()` method. An unregistered custom exception produces a generic error with no useful information for the client — the purpose of a custom exception is precise handling, and that handling must be defined.

## 5. The Location-Based Naming

Naming exception classes based on where they are thrown instead of what went wrong.

```php
// Named after location — doesn't describe the error
class UserServiceException extends Exception {}
throw new UserServiceException('User not found.'); // Could mean anything
```

Name exception classes based on what went wrong (e.g., `PaymentFailedException`, `InsufficientInventoryException`). A name based on location tells nothing about what happened and conflates unrelated error conditions in the same class.

```php
// Named after the condition — self-documenting
class UserNotFoundException extends Exception {}
throw new UserNotFoundException('User not found.');
```

## 6. The Sensitive Data Carrier

Including passwords, tokens, API keys, or PII in exception properties or messages.

```php
throw new AuthenticationFailedException(
    password: 'plaintext-password', // Never
    token: 'eyJ...full-jwt',       // Never
    email: 'user@example.com',
);
```

Exception properties are logged, reported to error trackers, and may be rendered in error responses. Sensitive data in exceptions creates compliance violations (GDPR, PCI-DSS) and security risks. Use anonymized identifiers:

```php
throw new AuthenticationFailedException(
    email: md5('user@example.com'), // Anonymized
    failureReason: 'invalid_credentials',
);
```

## 7. The Flat Namespace

Putting all custom exceptions in the flat `App\Exceptions` namespace without domain organization.

```php
// 30+ exception classes in one directory
App\Exceptions\PaymentFailedException
App\Exceptions\InvoiceNotFoundException
App\Exceptions\InventoryShortageException
```

For applications with more than 10 custom exception classes, namespace them by domain. Domain-based namespacing makes exceptions discoverable, prevents naming collisions, and mirrors the application's bounded contexts:

```php
App\Exceptions\Billing\PaymentFailedException
App\Exceptions\Inventory\ShortageException
App\Exceptions\Subscriptions\ExpiredException
```
