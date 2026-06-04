# ECC Anti-Patterns — Lifecycle Events and Hooks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Request Lifecycle |
| **Knowledge Unit** | Lifecycle Events and Hooks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using RequestHandled for Post-Response Cleanup
2. Heavy Computation in RequestHandled Listeners
3. Registering booting() in Provider boot() Method
4. Nested Lifecycle Hook Registration
5. Container Resolution in booting() Callbacks

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — lifecycle hooks orchestrate observation, not data access
- Premature Caching — hooks are about execution timing, not caching

---

## Anti-Pattern 1: Using RequestHandled for Post-Response Cleanup

### Category
Performance

### Description
Logging metrics, flushing state, or performing cleanup in `RequestHandled` listeners — delays TTFB because `RequestHandled` fires before `$response->send()`.

### Why It Happens
Developers see "request handled" and assume it's the last hook. They don't realize `Terminating` runs after the response is sent.

### Warning Signs
- Logging/cleanup logic in `RequestHandled` listener
- High TTFB with many `RequestHandled` listeners
- Client waiting for cleanup to complete

### Why It Is Harmful
`RequestHandled` fires inside `Kernel::handle()`, before `$response->send()`. Every millisecond spent in `RequestHandled` listeners adds directly to client-visible latency. A logging listener that takes 20ms adds 20ms to P95 response times. Under load, this compounds — 5 listeners each taking 5ms adds 25ms to every response, reducing server throughput.

### Preferred Alternative
Use `Terminating` event or `$app->terminating()` callbacks for post-response cleanup. Use `RequestHandled` only for response modification.

### Detection Checklist
- [ ] Logging in `RequestHandled` listener
- [ ] State flushing in `RequestHandled` listener
- [ ] High TTFB with no controller slowdown

### Related Rules
Always Prefer Terminating Over RequestHandled For Cleanup (05-rules.md)

---

## Anti-Pattern 2: Heavy Computation in RequestHandled Listeners

### Category
Performance

### Description
Database queries, cache writes, or external API calls in `RequestHandled` listeners — blocks response send.

### Preferred Alternative
Keep `RequestHandled` listeners sub-millisecond. Move I/O to `Terminating` or queue jobs.

### Detection Checklist
- [ ] DB queries in `RequestHandled`
- [ ] API calls in `RequestHandled`
- [ ] Response modification only, no I/O

---

## Anti-Pattern 3: Registering booting() in Provider boot() Method

### Category
Framework Usage

### Description
Calling `$app->booting()` inside a provider's `boot()` method — callback fires immediately during boot, not at the intended booting phase boundary.

### Preferred Alternative
Register `booting()` callbacks only in provider `register()` methods.

### Detection Checklist
- [ ] `booting()` registered in `boot()`
- [ ] Callbacks fire at wrong time
- [ ] Services unavailable when callback runs

---

## Anti-Pattern 4: Nested Lifecycle Hook Registration

### Category
Reliability

### Description
Registering a lifecycle callback inside another callback of the same type — can cause infinite loops or non-deterministic execution.

### Preferred Alternative
Register all lifecycle hooks at a single, stable point (in provider `register()` or `boot()`).

### Detection Checklist
- [ ] Listener registered inside listener of same type
- [ ] Infinite callback chains
- [ ] Stack overflow exceptions

---

## Anti-Pattern 5: Container Resolution in booting() Callbacks

### Category
Reliability

### Description
Resolving services from the container inside `$app->booting()` callbacks — many services are not yet fully initialized (providers haven't booted).

### Preferred Alternative
Use `$app->booted()` callbacks for container resolution. Only resolve framework-level services documented as available during booting.

### Detection Checklist
- [ ] `$this->app->make()` in `booting()` callback
- [ ] Uninitialized service errors
- [ ] Timing-dependent failures
