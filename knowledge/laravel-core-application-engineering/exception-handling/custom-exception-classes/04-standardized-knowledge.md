# Custom Exceptions

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Exception Handling
- **Knowledge Unit:** Custom Exceptions
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

## Overview

Custom exception classes represent domain-specific error conditions: `PaymentFailedException`, `InsufficientInventoryException`, `TeamLimitExceededException`. Each exception type conveys what went wrong and carries contextual data needed for handling, logging, and user feedback.

The engineering value is precise error handling. Instead of catching a generic `Exception` and inspecting a string message, you catch a typed exception. The handler matches on type, and the exception carries structured data (not a message string) for the response.

## Core Concepts

- **Typed Exception Classes:** Extend `\Exception` with domain-specific name. The type itself documents what went wrong.
- **Structured Context Data:** Public readonly properties on the exception carry contextual data (user ID, amount, SKU) for handlers, loggers, and user feedback.
- **Exception Inheritance:** Custom exceptions extend `Exception` (or a domain base exception). They inherit `$message`, `$code`, and `$previous`.
- **Self-Rendering Exceptions:** A `render()` method on the exception class generates the HTTP response directly — an alternative to handler callbacks.
- **Domain Base Exceptions:** Abstract base exception per domain (`BillingException`, `InventoryException`) enables handler-level grouping (catch all `BillingException` subtypes).

## When To Use

- Distinct error conditions that need different handling, logging, or user feedback
- Errors that carry structured data beyond a message string
- Domain-specific failures where the exception type communicates the problem
- When you need to catch specific error types at different layers of the application

## When NOT To Use

- Generic errors that need no special handling — a generic `Exception` or `RuntimeException` suffices
- Errors that are always handled the same way regardless of type — a single exception class with a code/message field is simpler
- Exception classes without structured context — if the exception carries no data beyond a message, a generic class with a message parameter is sufficient

## Best Practices (WHY)

- **Why typed exceptions:** The type itself is documentation. `PaymentFailedException` says exactly what went wrong. The handler matches on type, not message string parsing.
- **Why structured context:** Carry user ID, amount, SKU as typed properties. The handler and logger can access them directly — no message parsing needed.
- **Why domain base exceptions:** Enables catch-all handling for a domain (`catch (BillingException $e)`). Useful for grouping related failures.
- **Why `public readonly` properties:** The handler and logger need access to context data. Public readonly properties are accessible and immutable.

## Architecture Guidelines

- Name exceptions clearly: `PaymentFailedException` not `PaymentException` (too vague)
- Include relevant context in the constructor: user ID, amount, SKU, etc.
- Keep the message user-friendly if displayed to end users
- Create a base exception per domain for grouping (`BillingException`, `InventoryException`)
- Namespace by domain for larger apps: `App\Exceptions\Billing\PaymentFailedException`

## Performance

Exception creation and catching has the same cost regardless of how many custom properties are added. The overhead is in the stack trace generation, not the object itself. No performance concern for custom exceptions.

## Security

- Never include sensitive data (passwords, tokens, full credit card numbers) in exception properties
- Exception messages may be displayed to end users — keep them user-friendly and safe
- Use `context()` method for data that should only go to logs, not to users

## Common Mistakes

1. **Exceptions Without Context:** `throw new PaymentFailedException('Payment failed for user 123')` — no structured context. Handler must parse the message string.

2. **Catching Too Broad:** Catching `Exception` instead of the specific custom exception type. Catches unrelated errors and hides bugs.

3. **Exception Class in Wrong Namespace:** A `PaymentFailedException` in `App\Exceptions\` is fine for small apps. For larger apps, namespace by domain: `App\Exceptions\Billing\PaymentFailedException`.

4. **Exception Never Caught:** A custom exception is thrown but no `renderable()` callback is registered in the handler, and no try/catch exists. Falls through to generic 500.

## Anti-Patterns

- **The Stringly-Typed Exception:** Using a generic exception class with a string code/type field instead of a typed exception class. Forces the handler to parse strings instead of matching types.
- **The Context-Free Exception:** A custom exception class that adds no properties beyond the inherited `$message`. It's a typed name without structured data — better to use a generic exception.
- **The God Exception:** A single custom exception class used for all domain errors with a string `type` field to distinguish them. Defeats the purpose of typed exceptions.

## Examples

### Custom Exception with Context
```php
namespace App\Exceptions\Billing;

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
        return back()->withErrors(['inventory' => "Only {$this->available} units available."]);
    }
}
```

### Domain Base Exception
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
```

## Related Topics

- **Exception Handler Configuration** — base exception handling concepts
- **HTTP Exception Rendering** — HTTP-specific exception types
- **JSON Error Formatting** — rendering custom exceptions as JSON
- **Production vs Debug Display** — environment-specific display

## AI Agent Notes

- Extend `\Exception` with a domain-specific name
- Add `public readonly` properties for structured context data
- Keep the message user-friendly if it will be displayed to end users
- Use a base exception per domain for handler-level grouping
- Register `renderable()` callbacks in the handler for each custom exception
- For exceptions with render logic, implement `render()` on the exception class

## Verification

- [ ] Exception class name clearly describes the error condition
- [ ] Exception carries structured context data as typed properties
- [ ] Exception is either registered in handler with `renderable()` or has a `render()` method
- [ ] Exception is namespace-appropriate (domain subdirectory for larger apps)
- [ ] No sensitive data (passwords, tokens) in exception properties
- [ ] Exception message is user-friendly if user-facing
- [ ] A base exception exists per domain for grouping (if applicable)
- [ ] Non-HTTP entry points have a `report()` path for the exception
