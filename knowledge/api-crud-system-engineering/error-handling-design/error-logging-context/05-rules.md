# Phase 5: Rules — Error Logging Context

## Rule: Always Set Trace ID Context at Middleware Level
---
## Category
Maintainability | Reliability
---
## Rule
Always set a trace ID via `Log::withContext()` at the start of each request in middleware; never rely on each handler or service to generate its own correlation ID.
---
## Reason
A trace ID from middleware ensures every log entry for a request shares a single correlation ID, enabling end-to-end debugging across services and handlers.
---
## Bad Example
```php
// Each handler generates its own ID — no correlation
Log::error('Something failed', [
    'correlation_id' => Str::uuid(),
]);
```
---
## Good Example
```php
// Middleware sets context once for the entire request
class TraceIdMiddleware
{
    public function handle(Request $request, Closure $next): Response
    {
        $traceId = $request->header('X-Trace-ID') ?? Str::uuid()->toString();
        Log::withContext(['trace_id' => $traceId]);
        return $next($request);
    }
}
```
---
## Exceptions
Queue jobs; reset and set context at the start of each job instead (see Rule 7).
---
## Consequences Of Violation
Cannot correlate log entries for a single request; debugging production issues requires manual cross-referencing; distributed tracing breaks.

---

## Rule: Override Handler::context() for System-Level Enrichment
---
## Category
Code Organization | Maintainability
---
## Rule
Always override `Handler::context()` to automatically enrich all error logs with trace_id, user_id, request_id, URL, method, and IP; never add these fields manually in each catch block.
---
## Reason
Manual context in every catch block is inconsistent and fragile — new catch blocks inevitably omit context. Centralized enrichment guarantees every error log has the same baseline fields.
---
## Bad Example
```php
// Manual context in every catch block — easy to miss
try { /* ... */ } catch (Throwable $e) {
    Log::error('Failed', ['user_id' => auth()->id()]);
    // Forget to add URL, method, IP, trace_id
}
```
---
## Good Example
```php
class Handler extends ExceptionHandler
{
    public function context(): array
    {
        $request = request();
        return [
            'trace_id' => $request->header('X-Trace-ID') ?? Str::uuid(),
            'user_id' => $request->user()?->id,
            'url' => $request->fullUrl(),
            'method' => $request->method(),
            'ip' => $request->ip(),
        ];
    }
}
// Every error log automatically has all fields
```
---
## Exceptions
Stateless endpoints (webhooks, health checks) where request-specific context is not applicable; provide empty context in those cases.
---
## Consequences Of Violation
Inconsistent log context across error types; missing fields make debugging impossible; new developers forget to add context in new catch blocks.

---

## Rule: Never Include $request->all() or Full Request Bodies in Context
---
## Category
Security
---
## Rule
Always use explicit field selection when adding request data to log context; never include `$request->all()`, `$request->input()`, or raw request bodies.
---
## Reason
`$request->all()` includes passwords, tokens, API keys, and PII submitted in the request body. Logging this data is the most common source of credential leaks via logs.
---
## Bad Example
```php
Log::error('Order failed', [
    'request' => $request->all(), // Contains passwords, tokens, PII
]);
```
---
## Good Example
```php
Log::error('Order failed', [
    'order_id' => $request->input('order_id'),
    'user_id' => $request->user()?->id,
    'payment_method' => $request->input('payment_method', 'unknown'),
    // Never include password, token, or secret fields
]);
```
---
## Exceptions
No common exceptions — full request data must never appear in log context.
---
## Consequences Of Violation
Credential leak via log access; compliance violation (PCI DSS, GDPR); credentials stored in logs long after password reset.

---

## Rule: Add Business Context at Throw Site via Exception $context
---
## Category
Maintainability | Design
---
## Rule
Always add domain-specific business context through the custom exception's `$context` parameter at the throw site; never add it via separate `Log::` calls after the throw.
---
## Reason
Business context in the exception ensures it is captured in logs, error tracking, and the response detail consistently. Separate `Log::` calls may be missed or duplicated.
---
## Bad Example
```php
throw new OrderNotFoundException($orderId);
// Business context added separately — may be forgotten
Log::withContext(['order_id' => $orderId]);
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
            context: ['order_id' => $orderId, 'resource_type' => 'Order'],
        );
    }
}
throw new OrderNotFoundException($orderId);
// Context is automatically in logs, tracking, and response
```
---
## Exceptions
Context that is only relevant for log enrichment and must not appear in the response; add via `Log::withContext()` before throwing.
---
## Consequences Of Violation
Business context missing from logs and error tracking; debugging without domain data is ineffective; context scattered across throw sites and catch blocks.

---

## Rule: Use Structured Log Driver for JSON Output
---
## Category
Maintainability | Reliability
---
## Rule
Always configure a structured log driver (`daily`, `syslog`, `stderr`, `cloudwatch`) that outputs JSON-formatted log entries; never use the `single` driver for production.
---
## Reason
JSON-structured logs are parseable by log aggregation tools (ELK, CloudWatch, DataDog, Splunk) without custom parsing rules. The `single` driver writes plain text that requires regex extraction.
---
## Bad Example
```php
// config/logging.php
'default' => 'single',
// Plain text — unparseable by aggregation tools
```
---
## Good Example
```php
// config/logging.php
'default' => 'daily',
'channels' => [
    'daily' => [
        'driver' => 'daily',
        'path' => storage_path('logs/laravel.log'),
        'days' => 14,
        'formatter' => Monolog\Formatter\JsonFormatter::class,
    ],
],
```
---
## Exceptions
Local development where human-readable console output is preferred; use `stderr` with text formatter in dev.
---
## Consequences Of Violation
Log aggregation requires custom parsers; structured fields (trace_id, user_id) are not indexed; debugging production issues is slower.

---

## Rule: Limit Context Size to 50 Fields and 100KB
---
## Category
Performance | Reliability
---
## Rule
Always limit log context arrays to 50 fields and 100KB maximum serialized size; never include large objects, collections, or file contents in context.
---
## Reason
Large context causes memory pressure during log serialization, slows down log ingestion, and significantly increases storage costs — especially at high throughput.
---
## Bad Example
```php
Log::error('Order failed', [
    'order' => $order->toArray(), // Full model with relations — MBs
    'related_orders' => Order::all()->toArray(), // Entire table!
]);
```
---
## Good Example
```php
Log::error('Order failed', [
    'order_id' => $order->id,
    'order_status' => $order->status,
    'order_total' => $order->total,
    'item_count' => $order->items->count(),
    'payment_method' => $order->payment_method,
]);
// Small, focused, and useful
```
---
## Exceptions
Security audit logs that require full request/response capture; use a separate audit log channel with retention limits.
---
## Consequences Of Violation
Memory exhaustion during error bursts; slow log ingestion causes backup; excessive cloud log storage costs; log rotation fails on oversized files.

---

## Rule: Redact Sensitive Data Before Logging
---
## Category
Security
---
## Rule
Always apply a global log processor that redacts sensitive key patterns (`password`, `token`, `secret`, `credit_card`, `authorization`) from all log context; never rely on manual redaction at each log call.
---
## Reason
One missed manual redaction can leak credentials. Global processor ensures no sensitive key pattern reaches the log storage regardless of the developer's intent.
---
## Bad Example
```php
// Manual redaction — easy to miss a field
Log::info('User registered', [
    'email' => $request->email,
    'password_raw' => $request->password, // Forgot to redact!
]);
```
---
## Good Example
```php
// config/logging.php — global processor
'processor' => [
    function ($record) {
        $redactKeys = ['password', 'password_confirmation', 'secret', 'token', 'credit_card', 'authorization'];
        array_walk_recursive($record['context'], function (&$value, $key) use ($redactKeys) {
            if (in_array(strtolower($key), $redactKeys)) {
                $value = '[REDACTED]';
            }
        });
        return $record;
    },
],
```
---
## Exceptions
No common exceptions — redaction must always be applied globally.
---
## Consequences Of Violation
Credential leak via log access; compliance violations; sensitive data indexed in log aggregation tools — becomes a data breach.

---

## Rule: Reset Log Context in Queue Workers Between Jobs
---
## Category
Reliability | Security
---
## Rule
Always reset `Log::context()` at the start of each queue job to prevent cross-job context contamination; never assume context from a previous job is cleared.
---
## Reason
Queue workers reuse processes across multiple jobs without resetting Log context automatically. Context from a previous job (user_id, trace_id) leaks into the next job's logs, causing false correlations and potential data leaks.
---
## Bad Example
```php
class ProcessOrder implements ShouldQueue
{
    public function handle(): void
    {
        // No context reset — previous job's context leaks in
        Log::info('Processing order');
        // Log shows wrong user_id from previous job
    }
}
```
---
## Good Example
```php
class ProcessOrder implements ShouldQueue
{
    public function handle(): void
    {
        Log::flushSharedContext(); // Laravel 10+ resets context
        Log::withContext([
            'trace_id' => Str::uuid()->toString(),
            'job_id' => $this->job?->getJobId(),
        ]);
        Log::info('Processing order');
    }
}
```
---
## Exceptions
Laravel 11+ with `log_context_on_job` middleware registered globally handles this automatically.
---
## Consequences Of Violation
Cross-job context contamination; wrong user IDs in logs; security audit trails attribute actions to wrong users; debugging is impossible.

---

## Rule: Never Log in Exception Constructors
---
## Category
Design | Reliability
---
## Rule
Never call `Log::`, `logger()`, or any logging function inside an exception constructor or any code path that constructs an exception.
---
## Reason
Exceptions may be constructed but never thrown (e.g., during serialization, reflection, or caching). Logging during construction produces log entries for non-errors, polluting logs and misleading monitoring.
---
## Bad Example
```php
class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        Log::warning('User not found', ['user_id' => $userId]); // WRONG
        parent::__construct(...);
    }
}
// Exception constructed but never thrown → misleading log entry
```
---
## Good Example
```php
class UserNotFoundException extends OperationalException
{
    public function __construct(int $userId)
    {
        parent::__construct(
            errorCode: ErrorCodes::USER_NOT_FOUND,
            statusCode: 404,
            message: 'User not found.',
            context: ['user_id' => $userId],
        );
        // No logging — handler logs if exception is actually thrown
    }
}
```
---
## Exceptions
No common exceptions — exception constructors must be side-effect free.
---
## Consequences Of Violation
Log entries for exceptions that were never thrown; misleading log volume; false-positive monitoring alerts; serialization errors when exceptions are serialized.
