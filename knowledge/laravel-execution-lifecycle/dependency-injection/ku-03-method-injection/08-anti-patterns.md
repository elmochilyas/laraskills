# ECC Anti-Patterns — Method Injection (ku-03)

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Dependency Injection |
| **Knowledge Unit** | Method Injection |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Blind Method Injection (Same Dep Repeated)
2. Method Injection in Middleware
3. Method Injection in Hot Paths
4. Overriding Resolved Params with User Input
5. Method Injection in Queued Listeners

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — method injection is about dependency resolution, not database
- Premature Caching — method injection Reflection cannot be cached effectively

---

## Anti-Pattern 1: Blind Method Injection (Same Dep Repeated)

### Category
Architecture

### Description
Using method injection in every method that needs the same dependency, instead of constructor injection.

### Why It Happens
Developers use method injection as convenience without considering that the same dependency appears in 3+ methods.

### Warning Signs
- Same type-hinted parameter in 3+ methods of the same class
- Constructor is empty despite many dependencies used across methods
- Method signatures are long due to repeated injection

### Why It Is Harmful
ku-03 advises: "When the same dependency is used across multiple methods — use constructor injection." Blind method injection repeats the same parameter across methods, making signatures verbose and refactoring harder. It also pays Reflection cost on every method call instead of once at construction.

### Real-World Consequences
An `OrderController` injects `Logger $log` via method injection in `index()`, `show()`, `store()`, `update()`, and `delete()`. Each method has `Logger $log` in its signature. Refactoring to use constructor injection eliminates the 5 repetitions, shortens signatures, and pays Reflection cost once.

### Preferred Alternative
Use constructor injection for dependencies used in multiple methods. Reserve method injection for action-specific dependencies.

### Detection Checklist
- [ ] Same type-hint appears in 3+ method signatures
- [ ] Constructor empty despite many shared dependencies
- [ ] Long method signatures with repeated injection

### Related Rules
ku-03 (05-rules.md): N/A

### Related Skills
ku-03 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 2: Method Injection in Middleware

### Category
Architecture

### Description
Adding type-hinted dependencies to middleware `handle($request, $next)` method signature.

### Why It Happens
Developers see method injection works in controllers and assume it works identically in middleware.

### Warning Signs
- Middleware `handle()` has extra parameters beyond `$request` and `$next`
- `BindingResolutionException` from middleware
- Type-hints added to `handle()` signature

### Why It Is Harmful
ku-03 explicitly warns: "In middleware `handle()` methods — the signature is fixed (`$request, $next`), use constructor injection." The framework does not call middleware via `Container::call()` — the middleware pipeline dispatcher checks the fixed signature. Extra parameters cause type errors or `BindingResolutionException`.

### Preferred Alternative
Inject dependencies via constructor in middleware classes.

### Detection Checklist
- [ ] Extra parameters in `handle()` signature
- [ ] Middleware dependencies injected via method params
- [ ] `BindingResolutionException` from middleware

### Related Rules
ku-03 (05-rules.md): N/A

### Related Skills
ku-03 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 3: Method Injection in Hot Paths

### Category
Performance

### Description
Using method injection for dependencies resolved on every request in high-throughput endpoints.

### Why It Happens
Developers use method injection uniformly without profiling cost.

### Warning Signs
- High-traffic endpoints use method injection
- Profiling shows Reflection overhead from `Container::call()`
- Bootstrap or per-request time higher in production

### Why It Is Harmful
ku-03 notes: "`Container::call()` uses Reflection on every invocation — no built-in caching of parameter metadata." For high-throughput endpoints (APIs with 1000+ RPS), the 10-50µs per call adds up significantly.

### Preferred Alternative
Move frequently-resolved dependencies to constructor injection.

### Detection Checklist
- [ ] Method injection on high-traffic controller actions
- [ ] Reflection overhead visible in profiling

### Related Rules
ku-03 (05-rules.md): N/A

### Related Skills
ku-03 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 4: Overriding Resolved Params with User Input

### Category
Security

### Description
Passing untrusted user input in the `$parameters` array that overrides type-hinted container services.

### Preferred Alternative
Validate user input before passing to `call()`. Never allow user input to override container-resolved dependencies.

### Detection Checklist
- [ ] User input passed to `Container::call()` parameters
- [ ] Untrusted data overrides resolved services

### Related Rules
ku-03 (05-rules.md): N/A

### Related Skills
ku-03 (06-skills.md): N/A

### Related Decision Trees
N/A

---

## Anti-Pattern 5: Method Injection in Queued Listeners

### Category
Reliability

### Description
Using method injection in queued event listeners — dependencies may not be re-resolvable on the queue worker.

### Preferred Alternative
Use constructor injection for dependencies that must be available after deserialization.

### Detection Checklist
- [ ] Queued listener uses method injection
- [ ] Listeners fail silently on queue worker

### Related Rules
ku-03 (05-rules.md): N/A

### Related Skills
ku-03 (06-skills.md): N/A

### Related Decision Trees
N/A
