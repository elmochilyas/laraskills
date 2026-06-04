# Anti-Patterns: Exception Logging Strategies

## 1. The Log Firehose

Logging every exception at ERROR level including expected 404s, validation errors, and auth failures.

```php
// No dontReport — every exception is ERROR
```

This buries real server errors in noise. Expected exceptions should be INFO or suppressed entirely via `dontReport`.

```php
$exceptions->dontReport([
    AuthenticationException::class,
    ValidationException::class,
    AuthorizationException::class,
    NotFoundHttpException::class,
]);
```

## 2. The Silent Swallow

A try/catch block that catches exceptions without logging, reporting, or recovery.

```php
try {
    $this->processPayment($order);
} catch (PaymentFailedException $e) {
    // Silent — no log, no recovery, no notification
}
```

The error is invisible until users report issues. Always log and handle or re-throw.

```php
try {
    $this->processPayment($order);
} catch (PaymentFailedException $e) {
    Log::channel('billing')->error('Payment failed', [
        'order_id' => $order->id,
        'reason' => $e->failureReason,
    ]);
    throw $e; // Or handle gracefully
}
```

## 3. The PII Leak

Logging full user data (email, phone, address, credit card) in exception context.

```php
Log::error('Registration failed', [
    'email' => $request->email,
    'phone' => $request->phone,
    'address' => $request->address,
]);
```

Log only what's needed for debugging — user ID, not user data. Store PII in secure audit trails.

```php
Log::error('Registration failed', [
    'user_id' => $user->id,
    'failure_reason' => 'email_taken',
]);
```

## 4. The Single File in Production

Using the `single` log driver in production without rotation.

The log file grows to gigabytes over time, slows down the server, and eventually fills the disk. Always use `daily` driver with appropriate retention.

## 5. The Wrong Level Assignment

Logging system failures (database down, queue failure) at WARNING and validation errors at ERROR.

This causes alert fatigue (too many ERRORs from validation) while system failures are missed. Map levels by actual severity.
