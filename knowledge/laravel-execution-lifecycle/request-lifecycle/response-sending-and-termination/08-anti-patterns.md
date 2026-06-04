# ECC Anti-Patterns — Response Sending and Termination

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Request Lifecycle |
| **Knowledge Unit** | Response Sending and Termination |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Synchronous API Calls or DB Queries in Termination
2. Modifying Response in Terminating Event or terminable Middleware
3. Not Wrapping Terminate Logic in Try-Catch
4. Closure Middleware with terminate() Behavior
5. Not Registering Terminable Middleware as Singleton

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — DB queries in termination block the worker
- Premature Caching — termination timing is runtime behavior

---

## Anti-Pattern 1: Synchronous API Calls or DB Queries in Termination

### Category
Performance

### Description
Making HTTP requests, database queries, or filesystem writes in `terminate()` — blocks the FPM worker for the entire duration.

### Why It Happens
Developers assume termination is "free" because the HTTP connection is already closed. They don't realize the FPM process remains blocked.

### Warning Signs
- `Http::post()` in `terminate()`
- DB queries in `terminate()`
- `sleep()` in `terminate()`
- FPM worker pool saturation under normal traffic

### Why It Is Harmful
`fastcgi_finish_request()` closes the HTTP connection, but the PHP process is still occupied until all termination handlers complete. A 200ms API call in termination blocks one FPM worker for 200ms. With 10 workers, the application can handle at most 50 requests/second, even if the controller logic takes only 10ms. The worker is unavailable for new requests during termination.

### Preferred Alternative
Dispatch queue jobs from termination for any operation exceeding 5ms.

### Detection Checklist
- [ ] HTTP calls in `terminate()`
- [ ] DB queries in `terminate()`
- [ ] FPM workers busy during termination
- [ ] Throughput degradation under moderate load

### Related Rules
Offload Heavy I/O From Termination To Queue (05-rules.md)

---

## Anti-Pattern 2: Modifying Response in Terminating Event or terminable Middleware

### Category
Reliability

### Description
Adding headers, setting cookies, or modifying response body in `Terminating` event listeners or `terminate()` methods — response is already sent.

### Preferred Alternative
Use `RequestHandled` event for response modification. Use `Terminating` only for read-only cleanup.

### Detection Checklist
- [ ] `$response->headers->set()` in termination
- [ ] Response modification silently ignored
- [ ] `Terminating` listener trying to add headers

---

## Anti-Pattern 3: Not Wrapping Terminate Logic in Try-Catch

### Category
Reliability

### Description
Uncaught exception in `terminate()` crashes the worker or process — the response was already sent, so the failure is invisible to the client.

### Preferred Alternative
Always wrap `terminate()` bodies in try-catch. Log and swallow all exceptions.

### Detection Checklist
- [ ] `terminate()` without try-catch
- [ ] Worker crashes after successful responses
- [ ] Intermittent 500 errors

---

## Anti-Pattern 4: Closure Middleware with terminate() Behavior

### Category
Reliability

### Description
Using closures for middleware that needs `terminate()` — the kernel cannot resolve closures by class-string for termination.

### Preferred Alternative
Use class-based middleware with explicit `terminate()` methods.

### Detection Checklist
- [ ] Closure middleware in global/group stack
- [ ] `terminate()` silently never called
- [ ] Post-response logic not executing

---

## Anti-Pattern 5: Not Registering Terminable Middleware as Singleton

### Category
Reliability

### Description
Terminable middleware registered as transient — `terminate()` receives a fresh instance with none of the pipeline instance's state.

### Preferred Alternative
Register terminable middleware as singletons. Use `spl_object_id($request)` for per-request data keying.

### Detection Checklist
- [ ] Terminable middleware with state not singleton
- [ ] Null/uninitialized properties in `terminate()`
- [ ] Missing data from handle phase
