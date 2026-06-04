# Custom Exception Classes

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Custom Exception Classes
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Custom exception classes represent domain-specific error conditions: `PaymentFailedException`, `InsufficientInventoryException`, `TeamLimitExceededException`. Each exception type conveys what went wrong and carries contextual data needed for handling, logging, and user feedback.

The engineering value is precise error handling. Instead of catching a generic `Exception` and inspecting a string message, you catch a typed exception. The handler matches on type, and the exception carries structured data (not a message string) for the response.

---

## Core Concepts

### Basic Custom Exception

```php
namespace App\Exceptions\Billing;

use Exception;

class PaymentFailedException extends Exception
{
    public function __construct(
        public readonly string $paymentMethod,
        public readonly float $amount,
        public readonly string $failureReason,
        string $message = 'Payment processing failed',
        int $code = 422,
        ?Throwable $previous = null,
    ) {
        parent::__construct($message, $code, $previous);
    }
}
```

### Throwing Custom Exceptions

```php
class PaymentService
{
    public function charge(User $user, float $amount): Invoice
    {
        $result = $this->gateway->charge($user->stripe_id, $amount);

        if (!$result->success) {
            throw new PaymentFailedException(
                paymentMethod: $user->stripe_id,
                amount: $amount,
                failureReason: $result->error_message,
                message: 'Unable to process your payment. Please try a different card.',
            );
        }

        return Invoice::create([...]);
    }
}
```

### Catching Custom Exceptions

```php
try {
    $invoice = $this->paymentService->charge($user, $amount);
} catch (PaymentFailedException $e) {
    Log::warning('Payment failed', [
        'user' => $user->id,
        'amount' => $e->amount,
        'reason' => $e->failureReason,
    ]);

    return back()->with('error', $e->getMessage());
}
```

---

## Mental Models

### The Typed Problem Statement

A custom exception is a typed problem statement. `PaymentFailedException` says "a payment failed." Its properties say "this was the amount, this was the reason." The type itself is documentation — you know exactly what went wrong.

### The Structured Error Payload

Unlike a generic exception with a string message, a custom exception carries structured data. The handler can access `$e->amount`, `$e->userId`, `$e->failureReason` — not just `$e->getMessage()`. This enables rich logging and contextual error responses.

---

## Internal Mechanics

### Exception Inheritance

```
Throwable (interface)
  └── Exception (base)
       ├── PaymentFailedException
       ├── InsufficientInventoryException
       ├── TeamLimitExceededException
       ├── InvalidSubscriptionException
       └── ...
```

All custom exceptions extend `Exception` (or another exception class). They inherit `$message`, `$code`, and `$previous`. Add domain-specific properties via the constructor.

### Serialization for Logging

Custom exceptions are logged with their contextual data. Laravel's logging system captures the exception's `__toString()` output (which includes the message, code, file, and trace). Additional context can be extracted by the handler:

```php
public function register(): void
{
    $this->reportable(function (PaymentFailedException $e) {
        Log::error('Payment failure', [
            'exception_class' => get_class($e),
            'amount' => $e->amount,
            'payment_method' => $e->paymentMethod,
            'reason' => $e->failureReason,
        ]);
    });
}
```

---

## Patterns

### Exception with HTTP Status

```php
class TeamLimitExceededException extends Exception
{
    public function __construct(
        public readonly int $teamId,
        public readonly int $currentMemberCount,
        public readonly int $maxMembers,
    ) {
        parent::__construct(
            message: "Team limit reached ({$currentMemberCount}/{$maxMembers} members)",
            code: 403, // HTTP 403 Forbidden
        );
    }
}
```

### Exception with Render Logic

```php
class InsufficientInventoryException extends Exception
{
    public function __construct(
        public readonly string $sku,
        public readonly int $requested,
        public readonly int $available,
    ) {
        parent::__construct(
            message: "Insufficient inventory for SKU {$sku}",
            code: 422,
        );
    }

    public function render(Request $request): JsonResponse|RedirectResponse
    {
        if ($request->expectsJson()) {
            return response()->json([
                'error' => $this->getMessage(),
                'sku' => $this->sku,
                'requested' => $this->requested,
                'available' => $this->available,
            ], $this->code);
        }

        return back()->withErrors([
            'inventory' => "Only {$this->available} units available.",
        ]);
    }
}
```

### Exception Base Class per Domain

```php
namespace App\Exceptions\Billing;

abstract class BillingException extends Exception
{
    abstract public function getUserMessage(): string;
}

class PaymentFailedException extends BillingException
{
    public function getUserMessage(): string
    {
        return 'Your payment could not be processed.';
    }
}

class SubscriptionExpiredException extends BillingException
{
    public function getUserMessage(): string
    {
        return 'Your subscription has expired. Please renew to continue.';
    }
}
```

### Exception with Context for Reporting

```php
class ExternalApiTimeoutException extends Exception
{
    public function __construct(
        public readonly string $service,
        public readonly string $endpoint,
        public readonly float $timeoutSeconds,
    ) {
        parent::__construct(
            message: "External API {$service} timed out after {$timeoutSeconds}s",
            code: 502,
        );
    }

    public function context(): array
    {
        return [
            'service' => $this->service,
            'endpoint' => $this->endpoint,
            'timeout' => $this->timeoutSeconds,
        ];
    }
}
```

---

## Architectural Decisions

### Fine-Grained vs Broad Exceptions

| Concern | Fine-Grained | Broad |
|---|---|---|
| Number of classes | Many (10+) | Few (1-3) |
| Catch precision | Exact type matching | Must check message/code |
| Handler customization | Per-type callbacks | Conditional logic in handler |
| Maintenance | Add new type for new error | Reuse existing type |
| Discoverability | Clear what can go wrong | Must read source code |

Prefer fine-grained exceptions for distinct error conditions that need different handling. Use broad exceptions for generic failures (e.g., `ExternalServiceException` for any third-party failure).

### Render Logic in Exception vs Handler

| Concern | Render in Exception | Render in Handler |
|---|---|---|
| Cohesion | Error + response together | Error separated from response |
| Handler load | Light (method per exception) | Heavy (many renderable callbacks) |
| Exception portability | Includes framework concerns | Pure domain logic |
| Testing | Test the exception's render method | Test the handler callback |

Keep render logic in the exception for small projects. Use the handler for larger projects where you want to centralize response formatting.

---

## Tradeoffs

| Concern | Custom Exception | Generic Exception + Code |
|---|---|---|
| Type safety | Catch by type | Inspect code (stringly typed) |
| IDE support | Autocomplete on properties | Stringly typed properties |
| Error context | Typed properties | Message parsing or array |
| File overhead | One file per exception | One exception class |

---

## Performance Considerations

Exception creation and catching has the same cost regardless of how many custom properties you add. The overhead is in the stack trace generation, not in the object itself. No performance concern for custom exceptions.

---

## Production Considerations

- Name exceptions clearly: `PaymentFailedException`, not `PaymentException` (which could mean any payment error)
- Include relevant context in the constructor: user ID, amount, SKU, etc.
- Keep the message user-friendly if it will be displayed to end users
- Create a base exception per domain for grouping (`BillingException`, `InventoryException`)
- Document what each exception means and when it's thrown
- Test exception creation and rendering in isolation
- Use `Spatie\Ignition` or similar for better dev error pages with custom exception data

---

## Common Mistakes

### Exceptions Without Context

```php
// Bad — no context, must parse message
throw new PaymentFailedException('Payment failed for user 123');

// Good — typed context
throw new PaymentFailedException(
    paymentMethod: $user->stripe_id,
    amount: $amount,
    failureReason: $result->errorMessage,
);
```

### Catching Too Broad

```php
// Bad — catches everything, including unrelated errors
catch (PaymentFailedException $e) {
    // But also catches generic Exception if hierarchy is wrong
}

// Good — specific
catch (InsufficientFundsException $e) {
    // Handle insufficient funds
} catch (CardDeclinedException $e) {
    // Handle card declined
}
```

### Exception Class in Wrong Namespace

A `PaymentFailedException` in `App\Exceptions\` is fine for small apps. For larger apps, namespace by domain: `App\Exceptions\Billing\PaymentFailedException`.

---

## Failure Modes

### Exception Never Caught

A custom exception is thrown but no `renderable()` callback is registered in the handler, and no try/catch exists. Laravel's handler renders it as a 500 error (generic server error page). The user sees an unhelpful error. Register all custom exceptions in the handler.

### Exception Thrown in Non-HTTP Context

A custom exception is thrown from a queued job. The `renderable()` callback is never triggered (there's no HTTP request to render to). The exception is logged according to the `reportable()` callback. Ensure every custom exception has a `report()` path for non-HTTP contexts.

---

## Ecosystem Usage

### Ignition (Laravel 10 and below)

Ignition displays custom exception properties automatically on the error page, making it easy to inspect exception context during development.

### Spatie Error Solutions

Packages like spatie/laravel-ignition provide "solutions" that suggest fixes for common custom exceptions, improving developer experience.

### IDE Generators

PHP IDE plugins (PhpStorm, VS Code) can auto-complete custom exception properties, making typed exceptions as easy to use as arrays.

### Sentry / Flare

Error tracking services automatically capture custom exception context when the exception implements a `context()` method or uses public readonly properties.

---

## Related Knowledge Units

- **Exception Fundamentals** (this workspace) — base exception handling concepts
- **Global Exception Handling** (this workspace) — handler customization
- **HTTP Exceptions** (this workspace) — HTTP-specific exception types
- **API Exception Handling** (this workspace) — rendering custom exceptions as JSON
- **Exception Logging & Reporting** (this workspace) — capturing custom exception context
- **Exception Testing** (this workspace) — testing custom exception behaviour

---

## Research Notes

- Custom exceptions extend `\Exception` or another custom exception class
- `$message`, `$code`, and `$previous` are inherited from `\Exception`
- Additional properties should be `public readonly` for access by handler and logger
- `render()` method on the exception is called by Laravel if it exists — an alternative to handler callbacks
- `context()` method return value is merged into the exception's log context
- Domain-specific base exceptions enable handler-level grouping (catch all `BillingException` subtypes)
- Flare/Sentry display custom exception properties automatically for debugging
