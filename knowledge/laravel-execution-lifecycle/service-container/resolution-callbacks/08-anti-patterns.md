# ECC Anti-Patterns — Resolution Callbacks

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Resolution Callbacks |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Mutating Global State Inside resolving() Callbacks
2. No Callback Scope Limitation (Callbacks Fire on All Resolutions)
3. Not Understanding afterResolving() vs. resolving() Timing
4. Modifying the Resolved Instance Interface in resolving()
5. Application Logic in resolving() Callbacks

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — callbacks configure instances, not queries
- Premature Caching — callbacks run on every resolution, not data caching

---

## Anti-Pattern 1: Mutating Global State Inside resolving() Callbacks

### Category
Reliability

### Description
Setting global state (auth user, request data, session values) inside a `resolving()` callback — leaks context between consumers.

### Why It Happens
Developers see `resolving()` as a convenient place to set up shared state for the resolved service.

### Warning Signs
- Global variable or static property set in resolving()
- Cross-request data contamination under Octane
- Test failures from shared state

### Why It Is Harmful
A `resolving()` callback fires for every single resolution of the matched abstract. If that callback sets `config()->set('current.report', $report)`, every consumer that resolves a different service after the callback fires gets the wrong configuration. The global state is set at resolution time, not at usage time, so the state persists until the next resolution overwrites it. Under Octane, this state leaks across requests.

### Preferred Alternative
Configure the resolved instance directly without touching global state. Use the resolve instance's own setter methods.

### Detection Checklist
- [ ] Global state mutation in resolving()
- [ ] Cross-consumer configuration contamination
- [ ] Octane request data leaking

### Related Rules
Do Not Mutate Global State in resolving() (05-rules.md)

---

## Anti-Pattern 2: No Callback Scope Limitation (Callbacks Fire on All Resolutions)

### Category
Performance

### Description
Registering `$app->resolving(AnyClass::class, fn($i, $app) => ...)` without abstract type — fires on every single container resolution.

### Preferred Alternative
Always specify an abstract type or interface for resolving() callbacks.

### Detection Checklist
- [ ] No abstract parameter in resolving()
- [ ] Callback fires for every resolution
- [ ] Performance overhead from unnecessary callbacks

---

## Anti-Pattern 3: Not Understanding afterResolving() vs. resolving() Timing

### Category
Reliability

### Description
Using `resolving()` for operations that should happen after the instance is fully configured.

### Preferred Alternative
Use `afterResolving()` for post-configuration operations. Use `resolving()` for pre-configuration.

### Detection Checklist
- [ ] Post-configuration logic in resolving()
- [ ] Order-dependent behavior
- [ ] afterResolving() would be more correct

---

## Anti-Pattern 4: Modifying the Resolved Instance Interface in resolving()

### Category
Framework Usage

### Description
Adding methods or changing the type of the resolved instance inside `resolving()` — breaks type contracts.

### Preferred Alternative
Use `extend()` for decoration. Use `resolving()` only for configuration, not modification of class capabilities.

### Detection Checklist
- [ ] Instance type changed in resolving()
- [ ] Contract violation at call site
- [ ] Use extend() instead

---

## Anti-Pattern 5: Application Logic in resolving() Callbacks

### Category
Architecture

### Description
Placing business logic (validations, database updates, notifications) inside resolving() callbacks.

### Preferred Alternative
Use Events or middleware. Keep resolving() focused on dependency configuration only.
