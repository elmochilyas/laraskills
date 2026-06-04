# ECC Anti-Patterns — Binding Resolution

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Execution Lifecycle & Framework Internals |
| **Subdomain** | Service Container |
| **Knowledge Unit** | Binding Resolution |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Using build() in Application Code
2. Calling make() Inside Business Logic (Service Locator)
3. Passing Positional Arrays to makeWith()
4. Not Catching BindingResolutionException at Kernel Level
5. Expecting New Instance After singleton()

---

## Repository-Wide Anti-Patterns

- Hidden Database Queries — resolution builds objects, not queries
- Premature Caching — resolution caching is for singleton lifecycle

---

## Anti-Pattern 1: Using build() in Application Code

### Category
Reliability

### Description
Calling `$app->build()` instead of `$app->make()` — bypasses extenders, resolution callbacks, and caching.

### Why It Happens
Developers discover `build()` as a faster resolution path and use it without understanding what it skips.

### Warning Signs
- `$this->app->build(Service::class)` in provider or middleware
- Service missing decoration
- Resolution callbacks not applying

### Why It Is Harmful
`build()` skips the entire resolution chain: no alias normalization, no instances cache check, no binding lookup, and critically — no extenders and no resolution callbacks. If another package registered an `extend()` on the same abstract, that extender silently never runs. If a `resolving()` callback configures the service, that configuration is lost. The returned instance is raw, unconfigured, and uncached.

### Preferred Alternative
Always use `$app->make()` for resolution in application code. `build()` is a container internal.

### Detection Checklist
- [ ] `build()` called outside container internals
- [ ] Missing decorations
- [ ] Resolution callbacks not applied

### Related Rules
Use make() for All Application-Level Resolution (05-rules.md)

---

## Anti-Pattern 2: Calling make() Inside Business Logic (Service Locator)

### Category
Architecture

### Description
Using `resolve()` or `$this->app->make()` inside controllers, jobs, or services instead of constructor injection.

### Preferred Alternative
Declare dependencies in the constructor. Reserve `make()` for the composition root.

### Detection Checklist
- [ ] `resolve()` in methods
- [ ] Hidden dependencies
- [ ] Container bootstrapping required for tests

---

## Anti-Pattern 3: Passing Positional Arrays to makeWith()

### Category
Reliability

### Description
Using `makeWith(Class::class, ['value1', 'value2'])` — container matches by parameter name, not position.

### Preferred Alternative
Always use named associative arrays: `makeWith(Class::class, ['param' => 'value'])`.

### Detection Checklist
- [ ] Positional array in `makeWith()`
- [ ] Parameters silently ignored
- [ ] Default values used instead of intended values

---

## Anti-Pattern 4: Not Catching BindingResolutionException at Kernel Level

### Category
Reliability

### Description
Resolution failures propagate unhandled — exposes container internals in error responses.

### Preferred Alternative
Catch `BindingResolutionException` in the exception handler. Log the abstract name and return a safe response.

### Detection Checklist
- [ ] Unhandled `BindingResolutionException`
- [ ] Internal service names in error output
- [ ] No centralized resolution error handling

---

## Anti-Pattern 5: Expecting New Instance After singleton()

### Category
Framework Usage

### Description
Calling `make()` twice on a singleton and expecting different instances.

### Preferred Alternative
Use `bind()` for transient instances. Use `forgetInstance()` + `make()` to force fresh singleton resolution.

### Detection Checklist
- [ ] Expecting new instance from singleton
- [ ] Mutation affecting all consumers
- [ ] `forgetInstance()` needed
