# Skill: Create a Typed Custom Exception Class

## Purpose

Build a domain-specific exception class with structured context data, typed public readonly properties, and a user-friendly message that enables catch-by-type handling in the exception handler.

## When To Use

- A distinct error condition requires different handling, logging, or feedback than other errors
- The error carries structured data (user ID, amount, SKU, reason) beyond a message string
- You need to catch specific error types at different layers of the application
- You have 3+ related error conditions in the same domain (create a domain base exception)

## When NOT To Use

- Generic errors needing no special handling — a generic `Exception` or `RuntimeException` suffices
- Errors always handled identically regardless of type — a single class with a message parameter is simpler
- Exception classes with no structured context beyond a message — a framework exception or `abort()` is sufficient

## Prerequisites

- Laravel 11+ with `withExceptions()` in `bootstrap/app.php`, or Laravel 10- with `App\Exceptions\Handler`
- Understanding of PHP exception inheritance and constructor promotion

## Inputs

- Domain name (e.g. `Billing`, `Inventory`) for namespace and base class
- Error condition name (e.g. `PaymentFailed`, `InsufficientInventory`)
- Contextual data types (e.g. `string $paymentMethod`, `float $amount`)

## Workflow

1. Determine the domain namespace. For applications with 10+ total custom exceptions, use a subdirectory per domain:
   - Small app: `App\Exceptions\PaymentFailedException`
   - Larger app: `App\Exceptions\Billing\PaymentFailedException`

2. For domains with 3+ related exception types, create an abstract base exception:
   ```php
   namespace App\Exceptions\Billing;

   abstract class BillingException extends \Exception
   {
       abstract public function getUserMessage(): string;
   }
   ```

3. Create the concrete exception class extending the base (or `\Exception` for standalone):
   ```php
   class PaymentFailedException extends BillingException
   {
       public function __construct(
           public readonly string $paymentMethod,
           public readonly float $amount,
           public readonly string $failureReason,
           string $message = 'Your payment could not be processed. Please try again.',
           int $code = 422,
           ?\Throwable $previous = null,
       ) {
           parent::__construct($message, $code, $previous);
       }

       public function getUserMessage(): string
       {
           return $this->message;
       }
   }
   ```

4. Follow these naming and property rules:
   - Name by what went wrong: `PaymentFailedException`, not `BillingControllerException`
   - Use promoted `public readonly` properties for all context data
   - Keep `$message` user-friendly if end-users will see it
   - Never include passwords, tokens, full credit card numbers, or PII as properties

5. Verify the exception is either registered with a `renderable()` callback or implements its own `render()` method (required for HTTP-rendered exceptions).

6. For service-layer exceptions not rendered to HTTP, ensure they have a `report()` path in the handler so they are logged.

## Validation Checklist

- [ ] Exception class name describes what went wrong (PaymentFailedException, not UserServiceException)
- [ ] Properties are `public readonly` and typed (no private getters, no stringly-typed context)
- [ ] Message is user-friendly if user-facing; technical details are in structured properties
- [ ] No sensitive data (passwords, tokens, PII) in properties or message
- [ ] Domain base exception exists when 3+ related types are present
- [ ] Namespace is domain-appropriate for the application size
- [ ] `renderable()` callback or `render()` method exists (for HTTP-rendered exceptions)
- [ ] A `report()` or `reportable()` path exists for logging

## Common Failures

1. **Context-free exception**: A custom class adds no properties — just a typed name with no structured data. Use a generic `Exception` instead.

2. **Sensitive data in properties**: Passwords or tokens stored in exception properties get logged to error trackers.

3. **No renderable callback**: The exception is thrown but no `renderable()` exists and no `render()` method — falls through to generic 500.

4. **Stringly-typed discrimination**: A single `DomainException` class with a `string $type` field instead of distinct typed classes, forcing handler to parse strings.

5. **Location-based naming**: `UserControllerException` instead of `UserNotFoundException` — doesn't communicate the error condition.

## Decision Points

- **Base exception vs standalone**: Add a domain base exception when you have 3+ related types. For 1-2 exceptions, extend `\Exception` directly.
- **Flat vs domain namespace**: Use flat `App\Exceptions` for apps with fewer than 5 custom exceptions. Use domain subdirectories for larger apps.
- **User message vs debug message**: Set `$message` to a user-friendly string. Put technical details (like SQL error) into a typed property like `failureReason`.

## Performance Considerations

- Exception creation cost is identical regardless of the number of custom properties
- The overhead is in stack trace generation, not the object itself
- No performance concern for custom exceptions

## Security Considerations

- Never include passwords, API tokens, full credit card numbers, or PII in exception properties
- Exception messages may appear in user-facing error responses — keep them generic and safe
- Use typed properties for data that should go to logs; keep the `$message` parameter user-friendly
- Consider hashing/anonymizing identifiers (e.g. email `md5()`) if they must be in the exception

## Related Rules

- Use Typed Exception Classes Instead of Generic Exceptions with String Codes
- Always Include Structured Context Data as Public Readonly Properties
- Create a Domain Base Exception for Grouping Related Errors
- Use Public Readonly Properties, Never Getters for Context Data
- Name Exceptions Descriptively — What Failed, Not Where
- Never Include Sensitive Data in Exception Properties
- Register a renderable() or Implement render() for Every Custom Exception
- Keep Exception Messages User-Friendly When User-Facing

## Related Skills

- Configure the Exception Handler (exception-fundamentals)

## Success Criteria

- Each domain error condition has its own typed exception class
- Exception properties contain all structured data needed for handling and logging
- Exceptions can be caught by type in handlers and service layers
- No sensitive data is exposed through exception properties or messages
- User-facing messages are safe and helpful

---

# Skill: Register Custom Exception Rendering and Reporting

## Purpose

Register `renderable()` and `reportable()` callbacks in the exception handler for each custom exception class, ensuring every thrown exception produces the correct HTTP response and is logged with appropriate severity.

## When To Use

- After creating a new custom exception class (see "Create a Typed Custom Exception Class")
- When changing how a custom exception is rendered or reported
- When adding domain-specific logging channels for error tracking

## When NOT To Use

- Exceptions caught and handled at the service layer that never propagate to HTTP — these need no rendering
- Framework-provided exceptions like `ValidationException` or `NotFoundHttpException` — already handled

## Prerequisites

- One or more custom exception classes (e.g. `PaymentFailedException`, `InsufficientInventoryException`)
- Access to the exception handler (`bootstrap/app.php` for Laravel 11+, `App\Exceptions\Handler` for Laravel 10-)
- Familiarity with the report and render pipeline separation

## Inputs

- Custom exception class name (e.g. `PaymentFailedException::class`)
- Desired HTTP status code and response format
- Desired log channel and severity level
- Context data to include in logs

## Workflow

1. Open the exception handler for editing (`bootstrap/app.php` withExceptions closure, or `Handler::register()` method).

2. Add a `renderable()` callback for the custom exception. Choose one of two approaches:
   - **Option A — Handler-based (recommended for simple cases):**
     ```php
     $exceptions->renderable(function (PaymentFailedException $e, Request $request) {
         $response = ['error' => $e->getMessage(), 'amount' => $e->amount];

         if ($request->expectsJson()) {
             return response()->json($response, $e->getCode());
         }

         return back()->withErrors(['payment' => $e->getMessage()]);
     });
     ```

   - **Option B — Self-rendering (when exception carries render logic):**
     Implement `render()` on the exception class:
     ```php
     class InsufficientInventoryException extends Exception
     {
         public function render(Request $request): JsonResponse|RedirectResponse
         {
             if ($request->expectsJson()) {
                 return response()->json([
                     'error' => $this->getMessage(),
                     'sku' => $this->sku,
                     'requested' => $this->requested,
                     'available' => $this->available,
                 ], $this->getCode());
             }
             return back()->withErrors(['inventory' => "Only {$this->available} units available."]);
         }
     }
     ```

3. Add a `reportable()` callback if the exception needs custom logging:
   ```php
   $exceptions->reportable(function (PaymentFailedException $e) {
       Log::channel('billing')->error('Payment failed', [
           'payment_method' => $e->paymentMethod,
           'amount' => $e->amount,
           'failure_reason' => $e->failureReason,
       ]);
   });
   ```

4. Set the appropriate log level in the `$levels` property (Handler class) or via `reportable()`:
   ```php
   protected $levels = [
       PaymentFailedException::class => LogLevel::ERROR,
   ];
   ```

5. Order callbacks from most specific to most general. The catch-all `Throwable` callback should be registered after all specific callbacks.

6. Verify the exception is handled correctly by testing both the HTTP response and the log output.

## Validation Checklist

- [ ] `renderable()` callback exists for every HTTP-propagated custom exception
- [ ] `reportable()` callback exists (or default logging is sufficient) for every custom exception
- [ ] Render callback performs content negotiation (JSON for API, redirect/HTML for web)
- [ ] Log level is appropriate per exception type (ERROR for failures, INFO for recoverable)
- [ ] Callbacks are ordered from specific types to general (catch-all last)
- [ ] Render callbacks return a response object (never void — void falls through to default)
- [ ] Self-rendering exceptions (Option B) implement the `render()` method

## Common Failures

1. **renderable returns null/void**: The callback logs the error but doesn't return a `Response` object — handler falls through to default rendering.

2. **No content negotiation**: The callback always returns JSON even for web requests, or always returns HTML even for API clients.

3. **Too-broad catch-all before specific**: A general `Throwable` callback is registered before `PaymentFailedException` — the specific callback never fires.

4. **Unregistered exception**: A new custom exception is created but no `renderable()` is registered — falls through to generic 500.

## Decision Points

- **Handler-based vs self-rendering**: Use handler-based `renderable()` when the rendering logic is simple and doesn't belong on the exception class. Use self-rendering when the exception has complex context data that shapes the response.
- **Single `renderable()` for base class**: For a domain base exception (e.g. `BillingException`), register one `renderable()` that catches all subtypes.

## Performance Considerations

- Callback registration is O(n) over the number of registered callbacks
- Keep total callbacks under 20–30 for negligible impact
- Exception creation cost is unaffected by callback registration

## Security Considerations

- Ensure `render()` callbacks do not expose internal properties (file paths, query details)
- Wrap sensitive context: use user ID, not email; use last-four of card, not full number
- Self-rendering exceptions must still follow all security rules for API responses

## Related Rules

- Register a renderable() or Implement render() for Every Custom Exception
- Always Include Structured Context Data as Public Readonly Properties
- Never Include Sensitive Data in Exception Properties
- Separate Report and Render Pipelines — Never Couple Logging to Response Generation

## Related Skills

- Create a Typed Custom Exception Class (this file, above)
- Configure the Exception Handler (exception-fundamentals)
- Configure Global API Error Handler (api-exception-handling)

## Success Criteria

- Every custom exception has a defined rendering path
- API and web requests receive appropriate error formats
- Exception context data is logged to the correct channel
- No custom exception falls through to a generic 500 response
