# ECC Anti-Patterns — Scoped Instance Management

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Scoped Instance Management |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using singleton() for Per-Request State Under Octane
2. Using scoped() for Stateless Services
3. Holding onto Scoped Instances Outside Their Scope
4. Not Booting Octane-Scoped Service Correctly
5. Scoped Service Leaking to Parent Process

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — scoping controls lifecycle, not queries
- Premature Caching — scoping manages instances, not cached data

---

## Anti-Pattern 1: Using singleton() for Per-Request State Under Octane

### Category
Security

### Description
Registering services that hold per-request state (auth user, locale, tenant) as `singleton()` instead of `scoped()` under Octane — data leaks between concurrent requests.

### Why It Happens
Developers unfamiliar with Octane's shared-memory model register services the traditional way without considering request isolation.

### Warning Signs
- Singleton holding auth user or tenant context
- User A sees User B's data under Octane
- Intermittent data contamination under load

### Why It Is Harmful
Under Octane, the application container persists across requests. A singleton resolved in Request A retains its state. When Request B resolves the same singleton, it gets the same instance — including state set by Request A. If the singleton holds `$this->user = auth()->user()`, Request B inadvertently sees Request A's user. This can lead to authorization bypass, data leakage, and hard-to-reproduce session contamination.

### Preferred Alternative
Use `scoped()` for any service that holds per-request mutable state. Audit all singletons for request-scoped state before deploying Octane.

### Detection Checklist
- [ ] Singleton with per-request state
- [ ] Octane deployment without singleton audit
- [ ] Cross-request data contamination

### Related Rules
Use scoped() for Per-Request State Under Octane (05-rules.md)

---

## Anti-Pattern 2: Using scoped() for Stateless Services

### Category
Performance

### Description
Registering stateless, immutable services as `scoped()` — unnecessary per-request instantiation overhead.

### Preferred Alternative
Use `singleton()` for immutable, stateless services.

### Detection Checklist
- [ ] Stateless service as scoped()
- [ ] Unnecessary per-request construction
- [ ] singleton() more appropriate

---

## Anti-Pattern 3: Holding onto Scoped Instances Outside Their Scope

### Category
Reliability

### Description
Storing a scoped service instance in a class property or closure that outlives the request — stale reference.

### Preferred Alternative
Do not cache scoped instances. Resolve them fresh within each scope.

### Detection Checklist
- [ ] Scoped instance stored in long-lived property
- [ ] Stale data from previous scope
- [ ] Instance outlives its request

---

## Anti-Pattern 4: Not Booting Octane-Scoped Service Correctly

### Category
Reliability

### Description
Scoped service requires initialization per-request but the logic runs in `register()` (once) instead of a scoped boot hook.

### Preferred Alternative
Use `$app->scoped()->afterResolving()` or Octane events to reinitialize per request.

### Detection Checklist
- [ ] Initialization runs once only
- [ ] Scoped service stale after first request
- [ ] Octane-specific initializer needed

---

## Anti-Pattern 5: Scoped Service Leaking to Parent Process

### Category
Security

### Description
Scoped service modifies parent process state (e.g., sets global config) during its scope — persists beyond the scope.

### Preferred Alternative
Use `$app->instance()` for cloning. Reset any global state at scope boundaries.
