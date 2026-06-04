# Anti-Patterns: Gracefully Handling Errors

## 1. The Catch-All Controller

Every controller method wrapped in try/catch that returns generic error responses.

```php
class UserController
{
    public function show($id)
    {
        try {
            $user = User::findOrFail($id);
            return view('users.show', compact('user'));
        } catch (Throwable $e) {
            return redirect()->back()->with('error', 'Something went wrong.');
        }
    }
}
```

This bypasses the handler's custom rendering for specific exception types. A ModelNotFoundException should return 404, but this returns a redirect with a generic message. Let the global handler manage HTTP responses for system exceptions.

## 2. The HTTP-Coupled Service

A service method that returns redirect responses or calls `abort()`.

```php
class OrderService
{
    public function placeOrder(array $data): RedirectResponse
    {
        try {
            $order = Order::create($data);
            return redirect()->route('orders.show', $order);
        } catch (Throwable $e) {
            abort(500);
        }
    }
}
```

This service can only be used from HTTP controllers. Queue jobs, CLI commands, and tests that call this method will fail or behave incorrectly. Services should throw exceptions; controllers handle HTTP.

## 3. The Exposed Trace

Showing stack traces, file paths, or internal IDs in user-facing error messages.

```php
return response()->json([
    'error' => $e->getTraceAsString(),
    'file' => $e->getFile(),
    'line' => $e->getLine(),
], 500);
```

This reveals internal application structure to attackers. Log full details internally; show generic messages to users.

## 4. The Silent Failure

A caught exception that is neither logged nor recovered from.

```php
try {
    $this->processPayment($order);
} catch (PaymentFailedException $e) {
    // Nothing — no log, no recovery, no user notification
}
```

The user sees a success message, but the payment wasn't processed. Always log and either recover or notify the user.

## 5. The Exception for Control Flow

Throwing and catching exceptions for expected conditions.

```php
try {
    return User::findOrFail($id);
} catch (ModelNotFoundException $e) {
    return null; // Expected condition handled via exception
}
```

Expected absences should return null, not throw an exception. The stack trace generation and catch overhead are wasted for a normal condition.
