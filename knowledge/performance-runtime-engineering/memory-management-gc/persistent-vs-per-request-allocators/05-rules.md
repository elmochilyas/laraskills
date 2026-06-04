---
## Rule Name

Use Per-Request Allocator for Request-Scoped Data

## Category

Architecture

## Rule

Always store request-scoped data in the per-request allocator. Never store it in persistent memory (shared memory, interned strings, static variables).

## Reason

The per-request allocator frees all memory at request end in O(1) — just resetting the chunk pointer. Persistent allocations survive across requests and accumulate, causing memory leaks in long-running workers.

## Bad Example

```php
// Persistent storage — data survives across requests
public static array $requestData = [];
```

## Good Example

```php
// Per-request storage — freed automatically at request end
public function handle(Request $request): Response {
    $requestData = [];  // Local scope — per-request allocator
}
```

## Exceptions

Data that genuinely spans requests (cached configuration, class metadata, connection pools).

## Consequences Of Violation

Memory accumulation across requests in Octane/Swoole, state leaks between requests, eventual OOM.

---

## Rule Name

Monitor Interned Strings Buffer Utilization

## Category

Performance

## Rule

Monitor `opcache_get_status()['interned_strings_usage']` and increase `opcache.interned_strings_buffer` if utilization exceeds 70%.

## Reason

When the interned strings buffer is full, new string literals cannot be interned. Each occurrence of the same string literal allocates separate heap memory, wasting memory and reducing cache efficiency.

## Bad Example

```ini
; Default 8MB — may be too small for large applications
opcache.interned_strings_buffer=8
```

## Good Example

```ini
; Sized based on monitoring data — 16-32MB for Laravel/Symfony
opcache.interned_strings_buffer=32
```

## Exceptions

Applications with low string literal usage (minimal framework, few classes).

## Consequences Of Violation

Unnecessary memory duplication from uninterned strings, wasted interned string buffer capacity, reduced performance from uncached string lookups.

---

## Rule Name

Do Not Intern Dynamic or Sensitive Strings

## Category

Security

## Rule

Never intern strings that are dynamically generated or contain sensitive data (API keys, passwords, PII).

## Reason

Interned strings are stored in shared memory across all requests and are never freed during the process lifetime. Sensitive data in interned strings persists in memory and could be exposed through memory inspection.

## Bad Example

```php
// Dynamic string — not interned but if done via string interning function
$userInput = $_POST['data'];
```

## Good Example

```php
// String literals are safely interned — dynamic data is not
$className = User::class;  // Interned — safe, static
$userSecret = decrypt($encryptedValue);  // Not interned — per-request
```

## Exceptions

No common exceptions. Never intern sensitive data.

## Consequences Of Violation

Sensitive data persisting in shared memory across requests, potential exposure through memory inspection, compliance violations.

---

## Rule Name

Clean Up Persistent Resources in Octane Boot Callbacks

## Category

Architecture

## Rule

Implement cleanup of persistent resources (database transactions, open files, network connections) at request boundaries in Octane workers.

## Reason

Persistent allocations survive across requests. If a database transaction is left open in one request, the same connection in the next request may operate within an unexpected transaction context, causing data corruption or deadlocks.

## Bad Example

```php
Octane::booted(function () {
    DB::beginTransaction();  // Transaction opened once — persists forever
});
```

## Good Example

```php
Octane::booted(function () {
    // One-time connection setup
    DB::listen(function ($query) {
        // Log queries during request
    });
});
// Transactions are per-request in Octane's sandbox
```

## Exceptions

No common exceptions. Persistent resources must be cleaned up at request boundaries.

## Consequences Of Violation

Cross-request transaction state leaks, database deadlocks, stale connection state, data corruption.

---

## Rule Name

Account for Persistent Memory in Capacity Planning

## Category

Scalability

## Rule

Always include both per-request peak memory AND persistent baseline memory (interned strings, OpCache, loaded classes) when calculating total worker RSS for capacity planning.

## Reason

Persistent memory does not reset per-request. A worker that appears to use 50MB after the first request may grow to 80MB over 1000 requests as persistent structures accumulate. Capacity planning based only on per-request peak under-provisions.

## Bad Example

```bash
# Only monitoring per-request memory_get_usage peak (30MB)
# Actual worker RSS after 12 hours: 80MB — server runs out of memory
```

## Good Example

```bash
# Monitor both: memory_get_usage(true) AND /proc/pid/status (VmRSS)
# VmRSS includes persistent memory — plan capacity based on this
```

## Exceptions

PHP-FPM environments where the entire process is destroyed per request.

## Consequences Of Violation

Under-provisioned server memory, OOM kills under sustained load, unexpected capacity exhaustion.
