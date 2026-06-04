# Anti-Patterns — Error Logging Context

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | Error Handling Design |
| Knowledge Unit | Error Logging Context |
| Difficulty | Intermediate |
| Category | Configuration Pattern |
| Author | ECC AI Agent |
| Last Updated | 2026-06-02 |

---

## Anti-Pattern Inventory

| Anti-Pattern | Severity | Frequency | Detection |
|--------------|----------|-----------|----------|
| Logging Same Data in Multiple Places | Medium | High | Code review: context repeated in every catch block |
| Unstructured Log Messages | Medium | High | Code review: `"User $id error"` — can't be parsed |
| Logging Sensitive Data | Critical | Medium | Code review: `$request->all()` in context |
| Logging in Exception Constructors | Medium | Low | Code review: Log::error() in exception constructor |
| No Context Reset in Queue Workers | High | Medium | Bug reports: cross-job context contamination |

---

## Repository-Wide Anti-Patterns

| Anti-Pattern | Description | Effect |
|--------------|-------------|--------|
| Missing Trace ID | No correlation ID between client error and server log | Can't debug request chains |
| Infinite Context | Logging entire request object, session, or response | Log bloat, storage cost, data breach risk |
| Context Only at Error Time | Context from earlier in the request lifecycle missing | Can't trace what led to the error |

---

## Anti-Pattern Details

### AP-ELC-01: Logging Same Data in Multiple Places

**Description**: The same context data (user ID, request ID, URL) is manually logged in every catch block throughout the application instead of being added once globally. `Log::error('Failed', ['user_id' => auth()->id()])` appears in 20+ catch blocks. When a new context field is needed, all 20+ locations must be updated.

**Root Cause**: The developer doesn't know about `Handler::context()` or `Log::withContext()`. They add context manually at each error site because that's how they learned to log.

**Impact**:
- Context is inconsistent: some catch blocks log 3 fields, others log 5
- Adding a new context field requires updating every catch block
- No context is logged for uncaught exceptions (handler-level context is missing)
- Code duplication: the same 3 lines of context setup appear in 20+ files

**Detection**:
- Code review: repeated `Log::error()` calls with the same context keys in different catch blocks
- Code review: no `Handler::context()` override exists
- Metrics: grep for `Log::error` returns 50+ results, most with duplicated context setup

**Solution**:
- Override `Handler::context()` to add system-level context for all log entries
- Use `Log::withContext()` in middleware for request-scoped context (trace ID, user ID)
- Catch blocks should only add business-specific context, not system context
- System context is added once, automatically, in the handler

**Example**:
```php
// BEFORE: Duplicated context in every catch block
class OrderService
{
    public function place(OrderDto $dto): Order
    {
        try {
            // ...
        } catch (Throwable $e) {
            Log::error('Order placement failed', [
                'user_id' => auth()->id(),    // ❌ duplicated
                'url' => request()->fullUrl(), // ❌ duplicated
                'method' => request()->method(), // ❌ duplicated
                'order_data' => $dto,
            ]);
            throw $e;
        }
    }
}

// AFTER: System context in Handler, business context only at throw site
class Handler extends ExceptionHandler
{
    public function context(): array
    {
        return [
            'user_id' => request()->user()?->id,
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'trace_id' => request()->header('X-Trace-ID'),
        ];
    }
}

// Business context added via exception only
throw new OrderPlacementFailedException(message: $e->getMessage(), context: ['order_data' => $dto]);
```

---

### AP-ELC-02: Logging Sensitive Data

**Description**: Sensitive data — passwords, auth tokens, credit card numbers, PII — is included in log context. The most common source is `$request->all()` which captures all submitted form data including passwords. Logs become a data breach vector.

**Root Cause**: Convenience. The developer uses `$request->all()` or `$request->except()` to "capture everything" for debugging without filtering sensitive fields.

**Impact**:
- Credential leak: passwords, tokens in plaintext in log files
- PII violation: emails, phone numbers, names in logs subject to GDPR
- PCI DSS violation: credit card data in logs
- Legal liability: logs are the #1 target in data breaches

**Detection**:
- Code review: `$request->all()` anywhere in log context
- Code review: `Log::context()` includes request body or session data
- Security audit: log files scanned for password/token patterns
- Incident analysis: data breach traced to accessible log files

**Solution**:
- Never include `$request->all()` in log context
- Explicitly specify which fields to include
- Implement a log sanitisation processor that redacts known sensitive keys
- Use `Log::withContext()` with explicit field lists, never the full request

**Example**:
```php
// BEFORE: Logging sensitive data
class Handler extends ExceptionHandler
{
    public function context(): array
    {
        return [
            'request_data' => request()->all(), // ❌ includes password, token, credit_card
        ];
    }
}

// AFTER: Explicit, safe context
class Handler extends ExceptionHandler
{
    public function context(): array
    {
        return [
            'user_id' => request()->user()?->id,
            'trace_id' => request()->header('X-Trace-ID') ?? Str::uuid(),
            'url' => request()->fullUrl(),
            'method' => request()->method(),
            'ip' => request()->ip(),
        ]; // ✅ No request body, no session, no sensitive data
    }
}
```

---

### AP-ELC-03: No Context Reset in Queue Workers

**Description**: Log context set by one queued job persists to the next job processed by the same worker. `Log::withContext()` is called at the start of a job but never cleared. The second job's log entries include context from the first job — leading to incorrect trace IDs, user IDs, and other request-specific data in logs.

**Root Cause**: The developer sets context at the start of a job but doesn't reset it at the end. In traditional web requests, context is naturally request-scoped. Queue workers reuse the same process for multiple jobs.

**Impact**:
- Log correlation is broken: trace IDs from job A appear in job B's logs
- User identification is wrong: logs for job B reference job A's user
- Debugging is impossible: you can't trust any context field in queue logs
- Security audit: cross-job data contamination in logs

**Detection**:
- Bug reports: "logs show wrong user ID for queued job"
- Code review: jobs call `Log::withContext()` but never `Log::withoutContext()`
- Log inspection: same trace ID appearing across unrelated job executions

**Solution**:
- Call `Log::flushContext()` at the start/end of each queue job
- Create a base job class that handles context lifecycle
- Use middleware on the queue for automatic context management
- Never assume context is clean at job start

**Example**:
```php
// BEFORE: Context leaks between jobs
class SendWelcomeEmailJob implements ShouldQueue
{
    public function handle(): void
    {
        Log::withContext(['user_id' => $this->userId]); // set but never reset
        // ... job logic ...
    }
}
// Next job on the same worker inherits the previous user_id

// AFTER: Context reset
class SendWelcomeEmailJob implements ShouldQueue
{
    public function handle(): void
    {
        Log::withContext(['user_id' => $this->userId]);
        try {
            // ... job logic ...
        } finally {
            Log::flushContext(); // ✅ always reset after job
        }
    }
}
```
