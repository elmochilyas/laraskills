# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Lifecycle Hooks |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire's lifecycle hooks are methods that execute at specific points during a component's lifecycle: initialization (`mount`, `boot`), property updates (`updating`, `updated`), action execution (`before`, `after`), rendering (`rendering`, `rendered`), and dehydration (`dehydrate`). Each hook provides an interception point for cross-cutting concerns. The engineering value is fine-grained control over component behavior.

---

## Core Concepts

| Category | Hooks | Purpose |
|----------|-------|---------|
| Initialization | `boot`, `mount`, `booted` | Setup, data loading |
| Hydration | `hydrate`, `hydrate*` | Post-serialization setup |
| Property update | `updating`, `updating*`, `updated`, `updated*` | Validation, transformation |
| Action | `callBefore`, `callAfter` | Action interception |
| Rendering | `rendering`, `rendered` | View data preparation |
| Dehydration | `dehydrate`, `dehydrate*` | Serialization customization |

**Execution order:**
`boot()` → `mount()` (initial only) → `hydrate()` → `booted()` → `updating*()` → `updated*()` → `callBefore()` → action → `callAfter()` → `rendering()` → render → `rendered()` → `dehydrate()`

---

## When To Use

- `mount()`: Loading initial data, setting up component state on first render
- `boot()`: Per-request setup, shared dependency initialization
- `updating[Property]()`: Validating or transforming property values before they're set
- `updated[Property]()`: Reacting to property changes (search, dependent dropdowns)
- `hydrate()`: Restoring non-serializable dependencies after hydration

## When NOT To Use

- Simple property initialization (use property defaults)
- Business logic that belongs in action methods or services
- Side effects in `rendering()`/`rendered()` (use action methods instead)

---

## Best Practices

- **Use `mount()` for one-time initialization** — loading data that only needs to happen on first render
- **Use `boot()` for per-request setup** — things that need to run on every request (initial + subsequent)
- **Use `updating[Property]()` for validation** — reject invalid values before they're set
- **Use `updated[Property]()` for reactive side effects** — refresh dependent data when a property changes
- **Don't rely on `mount()` for data that must be fresh on every request** — use `boot()` instead
- **Keep hooks lightweight** — expensive operations in hooks slow every component interaction

---

## Architecture Guidelines

- `boot()` runs on every request (initial render AND subsequent AJAX updates)
- `mount()` runs only on the initial render — not on subsequent AJAX updates
- `hydrate()` runs after component is deserialized from the frontend snapshot
- `updating[Property]($value)` — receives the new value before it's set; can modify or reject
- `updated[Property]($value)` — fires after the property has been updated
- `dehydrate()` runs before component state is serialized for the response

---

## Performance

`mount()` runs once per component lifetime — lightweight by default. `boot()` runs on every request — keep it sub-millisecond. `hydrate()` runs on every AJAX update — avoid database queries here. `updating`/`updated` hooks fire for every property change — use debounced properties to reduce frequency.

---

## Security

`hydrate()` can restore non-serializable dependencies — ensure restored services don't trust user-controlled data. `updating()` can reject invalid values before they're set — use for validation rules that can't be expressed in `$rules` or `#[Rule]`. Never perform authorization in lifecycle hooks — use action methods or middleware.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using `mount()` for per-request data | Not understanding boot vs mount | Data stale on subsequent updates | Use `boot()` for per-request data |
| Heavy queries in `boot()` | Loading unrelated data | Slow every component interaction | Load lazily in actions or with `#[Lazy]` |
| Side effects in `rendering()` | Preparing data in render | Hard to debug, unexpected behavior | Use `mount()` or actions |
| Mutating properties in `updated()` | Creating infinite loops | Stack overflow crash | Guard against re-entrancy |
| DB queries in `hydrate()` | Restoring complex state | Expensive on every AJAX update | Cache or defer to actions |

---

## Anti-Patterns

- **Business logic in hooks**: Creating records, sending emails in lifecycle hooks
- **Infinite update loops**: `updated[Property]()` that changes the same property
- **Heavy database queries in boot()**: Loading unrelated data on every request
- **Authorization in hooks**: Access control logic that belongs in actions or middleware

---

## Examples

**mount() for initial data:**
```php
public function mount(): void
{
    $this->user = Auth::user();
    $this->posts = Post::where('user_id', $this->user->id)->get();
}
```

**updating[Property] for validation:**
```php
public function updatingSearch(string $value): void
{
    $this->search = strip_tags($value); // Sanitize before setting
}
```

**updated[Property] for reactive query:**
```php
public function updatedCountryId($value): void
{
    $this->cities = City::where('country_id', $value)->get()->toArray();
}
```

**Hydration flow comparison:**
```
Initial render: boot() → mount() → booted() → rendering() → render() → rendered() → dehydrate()
Subsequent update: boot() → hydrate() → booted() → updating*() → updated*() → action → rendering() → render() → rendered() → dehydrate()
```

---

## Related Topics

- livewire/component-architecture — Component fundamentals
- livewire/data-binding — Property updates triggering hooks
- livewire/actions-events — Action lifecycle
- livewire/loading-states — Visual feedback during hooks
- livewire/testing — Testing lifecycle behavior

---

## AI Agent Notes

- `boot()` runs on every request; `mount()` runs only on initial render
- `hydrate()` runs after component is deserialized from frontend snapshot
- `updating[Property]()` receives the new value before it's set
- `updated[Property]()` fires after the property has been updated
- `dehydrate()` runs before component state is serialized for response
- The `#[Computed]` attribute caches values within a single request lifecycle

---

## Verification

- [ ] `mount()` used only for one-time initialization
- [ ] `boot()` used for per-request setup
- [ ] No heavy queries in `boot()` or `hydrate()`
- [ ] `updating[Property]()` used for validation/transformation
- [ ] `updated[Property]()` used for reactive side effects
- [ ] No infinite update loops in hooks
- [ ] No business logic in lifecycle hooks
- [ ] Authorization handled in actions, not hooks
