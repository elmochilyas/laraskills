# Rules for Gracefully Handling Errors

---

## Rule: Catch at the Layer That Can Recover

---

## Category

Architecture

---

## Rule

Always catch exceptions at the layer that has the context to handle them. Service layer catches recoverable failures. Controller catches HTTP-specific errors. Global handler catches everything else.

---

## Reason

The service layer knows how to recover (fall back, retry, degrade). The controller knows about HTTP (redirect, flash, status code). The global handler knows about the request type (HTML vs JSON). Catching at the wrong layer couples concerns across boundaries.

---

## Bad Example

```php
// Service layer returning HTTP response — couples to web
class OrderService
{
    public function placeOrder(array $data): RedirectResponse
    {
        // ... business logic ...
        return redirect()->back()->with('success', 'Order placed');
    }
}
```

---

## Good Example

```php
// Service layer throws — controller handles HTTP
class OrderService
{
    public function placeOrder(array $data): Order
    {
        // ... business logic ...
        if (!$available) {
            throw new InsufficientInventoryException();
        }
        return $order;
    }
}

class OrderController
{
    public function store(OrderRequest $request)
    {
        try {
            $this->orderService->placeOrder($request->validated());
        } catch (InsufficientInventoryException $e) {
            return redirect()->back()->withErrors(['inventory' => 'Not available.']);
        }
    }
}
```

---

## Exceptions

Domain-level recovery logic that doesn't need HTTP context can stay in the service layer.

---

## Consequences Of Violation

Service coupled to HTTP — can't be reused in queue jobs or CLI. Controller contains business logic — violates single responsibility.

---

## Rule: Return Null for Expected Absences, Throw for Unexpected Failures

---

## Category

Design

---

## Rule

Always return null (or use Maybe/Option pattern) for expected possible absences (user not found, search returns nothing). Throw exceptions for unexpected failures (database down, payment gateway timeout).

---

## Reason

Exceptions are for exceptional situations — things that shouldn't happen during normal operation. Expected absences are part of normal flow. Using exceptions for expected absences is expensive and obscures control flow.

---

## Bad Example

```php
public function findUser(int $id): User
{
    $user = User::find($id);
    if (!$user) {
        throw new UserNotFoundException();
    }
    return $user;
}
```

---

## Good Example

```php
public function findUser(int $id): ?User
{
    return User::find($id); // null is a valid return value
}
```

---

## Exceptions

Methods that must return a value (findOrFail pattern) should throw. External APIs that should always return a result should throw on failure.

---

## Consequences Of Violation

Expensive control flow. Callers must catch instead of check. Stack traces generated for normal behavior.

---

## Rule: Never Expose Internal Details in User-Facing Messages

---

## Category

Security

---

## Rule

Never include stack traces, file paths, SQL queries, or internal error details in user-facing error messages or responses.

---

## Reason

Internal details reveal application structure, file paths, and framework versions that attackers can exploit. Users cannot act on this information.

---

## Bad Example

```php
return response()->json([
    'error' => $e->getMessage() . ' in ' . $e->getFile() . ':' . $e->getLine(),
], 500);
```

---

## Good Example

```php
$ref = Str::uuid();
Log::error('Payment failed', ['reference' => $ref, 'exception' => $e]);

return response()->json([
    'error' => ['message' => "Something went wrong. Reference: {$ref}"],
], 500);
```

---

## Exceptions

Local development environment where APP_DEBUG=true.

---

## Consequences Of Violation

Security vulnerability — attackers learn internal paths, class names, and framework details.

---

## Rule: Always Log or Re-throw in Catch Blocks — Never Silently Swallow

---

## Category

Reliability

---

## Rule

Never write an empty catch block. Always log the exception, perform recovery, or re-throw — never silently ignore.

---

## Reason

A silently swallowed exception is invisible — no log, no alert, no recovery. Users may see apparent success while data is lost or operations fail.

---

## Bad Example

```php
try {
    $this->processPayment($order);
} catch (PaymentFailedException $e) {
    // Silent — error is invisible
}
```

---

## Good Example

```php
try {
    $this->processPayment($order);
} catch (PaymentFailedException $e) {
    Log::channel('billing')->error('Payment failed', [
        'order_id' => $order->id,
        'reason' => $e->getMessage(),
    ]);
    throw $e; // Or handle gracefully
}
```

---

## Exceptions

Deliberate suppression for known noisy operations (cache stampede protection, health check failures).

---

## Consequences Of Violation

Errors are invisible until users report them. No debugging path exists.
