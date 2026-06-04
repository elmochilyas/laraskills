# ECC Anti-Patterns — Terminable Middleware

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Middleware Pipeline |
| **Knowledge Unit** | Terminable Middleware |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Heavy Synchronous Work in terminate()
2. No Try-Catch in terminate() — Silent Worker Crashes
3. Route-Level Registation — terminate() Never Called
4. Modifying Response in terminate()
5. Expecting Async Behavior from terminate()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — terminate runs after response sent; DB queries here block the worker
- Premature Caching — terminable behavior is runtime and SAPI-dependent

---

## Anti-Pattern 1: Heavy Synchronous Work in terminate()

### Category
Performance

### Description
Running long operations (email sending, API calls, report generation) synchronously in `terminate()` — blocks the PHP worker.

### Why It Happens
Developers assume terminate is "free" because the client already received the response.

### Warning Signs
- `Mail::send()` in `terminate()`
- `Http::post()` in `terminate()`
- Sleep or long file operations in `terminate()`
- PHP-FPM worker pool exhaustion after traffic spikes

### Why It Is Harmful
Although the response is sent, the PHP worker remains occupied until all `terminate()` methods complete. A 5-second `terminate()` blocks that worker for 5 seconds. With 10 workers, throughput drops from 100 to ~20 requests per second. In Octane, it delays the next request's sandbox creation.

### Preferred Alternative
Dispatch queue jobs from `terminate()` for any operation taking longer than ~10ms.

### Detection Checklist
- [ ] Heavy synchronous operations in `terminate()`
- [ ] Worker processes busy long after response sent
- [ ] Throughput degradation under load

### Related Rules
Keep `terminate()` Lightweight for Minimal Process Blocking (05-rules.md)

---

## Anti-Pattern 2: No Try-Catch in terminate() — Silent Worker Crashes

### Category
Reliability

### Description
Uncaught exception in `terminate()` crashes the PHP process — and the response was already sent.

### Preferred Alternative
Always wrap `terminate()` logic in `try {} catch (\Throwable $e) {}`.

### Detection Checklist
- [ ] `terminate()` without try-catch
- [ ] Intermittent worker crashes
- [ ] 500 errors on subsequent requests

---

## Anti-Pattern 3: Route-Level Registration — terminate() Never Called

### Category
Reliability

### Description
Registering terminable middleware as route-level middleware — `terminate()` is never executed because only global/group middleware is tracked.

### Preferred Alternative
Register terminable middleware in global or group stacks.

### Detection Checklist
- [ ] Terminable middleware as route-level only
- [ ] `terminate()` never runs
- [ ] Session data not persisted

---

## Anti-Pattern 4: Modifying Response in terminate()

### Category
Reliability

### Description
Setting headers or modifying response content in `terminate()` — response is already sent, modifications have no effect.

### Preferred Alternative
Use post-middleware code for response modifications. Use `terminate()` only for read-only cleanup.

### Detection Checklist
- [ ] `$response->headers->set()` in `terminate()`
- [ ] `$response->setContent()` in `terminate()`
- [ ] Misleading code with no effect

---

## Anti-Pattern 5: Expecting Async Behavior from terminate()

### Category
Architecture

### Description
Treating `terminate()` as an asynchronous handler — it's synchronous but post-response.

### Preferred Alternative
Use queues for truly asynchronous work. Treat `terminate()` as synchronous cleanup.

### Detection Checklist
- [ ] `terminate()` treated as async
- [ ] Heavy work blocking worker pool
- [ ] Queue not used for async operations
