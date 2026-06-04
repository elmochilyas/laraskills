# Anti-Patterns — Server Error Responses

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Server Error Responses |
| Difficulty | Intermediate |
| Category | Implementation Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Returning Different 500 Shapes Per Endpoint | High | Medium | Code review: inconsistent 500 response structures |
| Including Exception Class Name in Response | Critical | Medium | Code review: `error.code` contains class names like `QueryException` |
| Logging After Sending the Response | High | Medium | Code review: `Log::error` called after `response()->json()` |
| Reusing X-Request-ID as Trace ID | Medium | High | Code review: 500 `detail` uses `request_id` instead of dedicated `trace_id` |
| Detailed Error Messages in Staging | High | Medium | Code review: staging environment shows different 500 detail than production |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Returning HTML Error Pages for 500s | API routes returning Whoops/Symfony debug pages for internal errors | Client cannot parse HTML; structure leaks file paths and stack traces |
| Catching and Ignoring Server Errors | `catch (Throwable $e) { return; }` silently swallows errors | No log, no response — client times out and incident goes undetected |
| Hardcoding Sensitive Values in Error Messages | Database names, file paths, IP addresses embedded in 500 responses | Information disclosure; maps internal infrastructure topology |

---

## Anti-Pattern Details

### AP-SER-01: Returning Different 500 Shapes Per Endpoint

**Description**: Each controller or service renders its own 500 response structure — some return `{ error: "message" }`, others return `{ message: "error" }`, and some return Laravel's default HTML debug page. Clients must write endpoint-specific error parsers, defeating the purpose of a standardized error envelope.

**Root Cause**: No centralized error handling. Each developer implemented their own catch block with ad-hoc formatting.

**Impact**:
- Client code must branch on endpoint to parse errors
- Integration tests must assert against multiple shapes
- New endpoints easily introduce yet another shape
- Error monitoring tools cannot extract structured data from inconsistent responses

**Detection**:
- Code review: `catch` blocks in individual controllers with `response()->json()`
- Code review: no single `render()` method in the exception handler for `Throwable`
- Integration tests: different 500 responses across endpoints

**Solution**:
- Register a single `render()` callback for `Throwable` in the exception handler
- Use the same `ErrorEnvelope` class for every 500 response
- Remove all ad-hoc `catch` blocks that format 500 responses in controllers

**Example**:
```php
// BEFORE: Per-endpoint 500 formatting
class UserController
{
    public function show(int $id): JsonResponse
    {
        try {
            return response()->json(User::findOrFail($id));
        } catch (Throwable $e) {
            return response()->json(['error' => 'Failed'], 500); // ❌ ad-hoc shape
        }
    }
}

// AFTER: Centralized 500 rendering in exception handler
public function render(Throwable $e, Request $request): JsonResponse
{
    if ($request->expectsJson()) {
        $traceId = Str::uuid()->toString();
        Log::error('Internal server error', ['trace_id' => $traceId, 'exception' => $e]);
        return response()->json(
            new ErrorEnvelope(SYSTEM_INTERNAL_ERROR, 'An internal server error occurred.', 500, ['trace_id' => $traceId]),
            500,
        );
    }
    return parent::render($e, $request);
}
```

---

### AP-SER-02: Including Exception Class Name in Response

**Description**: The `code` or `message` field of the 500 response contains the PHP exception class name — `QueryException`, `PDOException`, `HttpClientException`. This reveals internal framework and infrastructure details to API consumers, enabling attackers to tailor exploits to the specific database driver or HTTP client library in use.

**Root Cause**: Convenience — the developer uses `get_class($e)` or `$e->getMessage()` directly in the response without sanitization.

**Impact**:
- Attackers learn the database driver (MySQL vs PostgreSQL vs SQLite)
- Attackers learn the HTTP client library (Guzzle vs cURL)
- Internal class names leak package versions and framework internals
- PCI DSS Section 6.5.5 violation (sensitive data in responses)

**Detection**:
- Code review: `'code' => get_class($e)` or `'code' => class_basename($e)` in error rendering
- Code review: error code map that uses class names as codes without mapping
- Penetration testing: 500 response includes `"code": "QueryException"`

**Solution**:
- Map exception types to opaque infrastructure codes (`SYSTEM.DATABASE_ERROR`, `SYSTEM.THIRD_PARTY_TIMEOUT`)
- Never use `get_class()` or `class_basename()` in error response generation
- Use the exception type only internally for code resolution, never for output

**Example**:
```php
// BEFORE: Exception class name in response
'code' => class_basename($e), // ❌ "QueryException"

// AFTER: Mapped infrastructure code
protected function resolveInfrastructureCode(Throwable $e): string
{
    return match (true) {
        $e instanceof QueryException => 'SYSTEM.DATABASE_ERROR',
        $e instanceof PDOException => 'SYSTEM.DATABASE_ERROR',
        $e instanceof HttpTimeoutException => 'SYSTEM.THIRD_PARTY_TIMEOUT',
        $e instanceof QueueException => 'SYSTEM.QUEUE_ERROR',
        default => 'SYSTEM.INTERNAL_ERROR',
    };
}
```

---

### AP-SER-03: Logging After Sending the Response

**Description**: The 500 response is sent to the client before the error is logged. If the logging system fails (disk full, queue backpressure, network timeout), the error log is lost even though the response was already sent. The trace_id in the response becomes useless — there is no matching log entry to correlate against.

**Root Cause**: Intuitive ordering — write output first, then clean up. The developer places `Log::error()` after `response()->json()` because it reads naturally as "send response, then log what happened."

**Impact**:
- Silent log loss: response sent but log entry never persisted
- Orphaned trace IDs: clients report trace IDs that yield no log results
- Incident response delays: cannot debug production 500s without log context
- False confidence: monitoring shows 500s but logs show nothing

**Detection**:
- Code review: `Log::error()` or `logger()->error()` called after `response()->json()` or `return response()->json()`
- Code review: logging in a finally block after the response is returned
- Operational review: trace IDs in client reports not found in log aggregation tool

**Solution**:
- Log before generating the response
- Generate trace_id first, log with it, then construct and return the response
- Ensure the log write is synchronous or acknowledged before the response is sent

**Example**:
```php
// BEFORE: Log after response
public function render(Throwable $e, Request $request): JsonResponse
{
    $response = response()->json(['error' => 'Server error'], 500);
    Log::error('Error occurred', ['exception' => $e]); // ❌ too late
    return $response;
}

// AFTER: Log before response
public function render(Throwable $e, Request $request): JsonResponse
{
    $traceId = Str::uuid()->toString();
    Log::error('Internal server error', [
        'trace_id' => $traceId,
        'exception' => $e,
        'url' => $request->fullUrl(),
        'method' => $request->method(),
    ]);
    return response()->json(
        new ErrorEnvelope(SYSTEM_INTERNAL_ERROR, 'An internal server error occurred.', 500, ['trace_id' => $traceId]),
        500,
    );
}
```

---

### AP-SER-04: Reusing X-Request-ID as Trace ID

**Description**: The request's `X-Request-ID` header (or Laravel's request ID) is used as the error trace_id. This conflates two distinct concepts: the request identifier (logs every request lifecycle) and the error trace identifier (specifically correlates error events). A single request may trigger multiple 500 responses (retries), and reusing the same request ID makes them indistinguishable.

**Root Cause**: Convenience — the request ID is already available and unique per request, so it seems sufficient for error correlation.

**Impact**:
- Cannot distinguish multiple errors within the same request
- Request ID may be client-controlled (spoofed), reducing trust in trace correlation
- Request ID typically lacks error-specific context in log aggregators
- Rate-limited error bursts collapse into one identifier

**Detection**:
- Code review: `'trace_id' => $request->header('X-Request-ID')` or `'trace_id' => request()->id()`
- Code review: trace_id reused from middleware-generated request ID without UUID generation
- Log review: multiple distinct errors all sharing the same trace_id value

**Solution**:
- Generate a dedicated UUID v4 trace_id per 500 response
- Include the request ID alongside the trace_id for cross-referencing
- Never accept or reuse client-supplied trace IDs

**Example**:
```php
// BEFORE: Reusing request ID
$traceId = $request->header('X-Request-ID'); // ❌ client-controlled, shared across errors

// AFTER: Dedicated UUID trace ID
$traceId = Str::uuid()->toString();
// Also include request_id for cross-reference
Log::error('Internal server error', [
    'trace_id' => $traceId,
    'request_id' => $request->header('X-Request-ID'), // for correlation, not as trace_id
    'exception' => $e,
]);
```

---

### AP-SER-05: Detailed Error Messages in Staging

**Description**: The staging environment returns detailed 500 response messages — stack traces, SQL queries, file paths, or full exception messages — while production returns generic messages. Staging should mirror production error handling exactly so that error-related bugs are caught before deployment, not discovered when the generic message hides the detail.

**Root Cause**: Misconception that staging is a "debug environment." The developer uses `APP_ENV=staging` checks to conditionally include details, reasoning that staging is internal so the risk is low.

**Impact**:
- Error response bugs (wrong shape, missing fields, incorrect codes) pass staging QA
- Developers rely on detailed staging errors and ship broken production error handling
- Staging data may contain production-like PII in anonymized datasets
- Environmental drift: staging and production error handling diverge over time

**Detection**:
- Code review: `if (app()->environment('staging'))` or `if (config('app.debug'))` gates around error detail
- Code review: different ErrorEnvelope construction path per environment
- CI pipeline review: tests run with `APP_ENV=testing`, not `APP_ENV=production`

**Solution**:
- Make staging error responses identical to production
- Use a separate `debug` key on the response for dev-local detail (never in staging or production)
- Run integration tests with `APP_DEBUG=false` and `APP_ENV=production` to catch shape issues

**Example**:
```php
// BEFORE: Staging gets detailed errors
public function render(Throwable $e, Request $request): JsonResponse
{
    if (app()->environment('staging')) {
        return response()->json([
            'error' => ['code' => 'SERVER_ERROR', 'message' => $e->getMessage()], // ❌ detailed in staging
        ], 500);
    }
    // production path...
}

// AFTER: Same shape everywhere, debug key only in dev
$envelope = new ErrorEnvelope(SYSTEM_INTERNAL_ERROR, 'An internal server error occurred.', 500, ['trace_id' => $traceId]);

if (app()->environment('local')) {
    $envelope->detail['debug'] = [
        'exception' => get_class($e),
        'message' => $e->getMessage(),
        'file' => $e->getFile(),
        'line' => $e->getLine(),
    ];
}

return response()->json($envelope, 500);
```
