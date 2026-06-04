# Livewire Lifecycle Hooks — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Lifecycle Hooks
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed
- [ ] Component extends `Livewire\Component`
- [ ] Understanding of hook execution order

## Implementation Checklist
- [ ] `mount()` used only for one-time initialization
- [ ] `boot()` used for per-request setup
- [ ] No heavy queries in `boot()` or `hydrate()`
- [ ] `updating[Property]()` used for validation/transformation
- [ ] `updated[Property]()` used for reactive side effects
- [ ] No infinite update loops in hooks
- [ ] No business logic in lifecycle hooks
- [ ] Authorization handled in actions, not hooks
- [ ] Side effects belong in action methods, not `rendering()`/`rendered()`

## Verification Checklist
- [ ] `boot()` runs on every request (initial render AND subsequent AJAX updates)
- [ ] `mount()` runs only on initial render — NOT on subsequent AJAX updates
- [ ] `hydrate()` runs after component is deserialized from frontend snapshot
- [ ] `updating[Property]($value)` receives new value before it's set
- [ ] `updated[Property]($value)` fires after property has been updated
- [ ] `dehydrate()` runs before component state is serialized for response
- [ ] Execution order: `boot()` → `mount()` (initial) → `hydrate()` → `booted()` → `updating*()` → `updated*()` → `callBefore()` → action → `callAfter()` → `rendering()` → render → `rendered()` → `dehydrate()`
- [ ] Per-request data is in `boot()`, not `mount()`

## Security Checklist
- [ ] `hydrate()` doesn't trust user-controlled data when restoring dependencies
- [ ] `updating()` can reject invalid values before they're set
- [ ] Authorization is NOT performed in lifecycle hooks (use actions or middleware)
- [ ] Sensitive operations are gated by action-level checks
- [ ] No authorization logic that could be bypassed in hooks

## Performance Checklist
- [ ] `mount()` is lightweight (runs once per component lifetime)
- [ ] `boot()` is sub-millisecond (runs on every request)
- [ ] `hydrate()` avoids database queries (runs on every AJAX update)
- [ ] `updating`/`updated` hooks are efficient — debounced properties reduce frequency
- [ ] No infinite loops in `updated[Property]()` — guarded against re-entrancy
- [ ] No heavy database queries in `boot()` — loads unrelated data on every request

## Production Readiness Checklist
- [ ] Team understands `boot()` vs `mount()` distinction
- [ ] No side effects in `rendering()`/`rendered()` that cause unexpected behavior
- [ ] `#[Computed]` attribute used for caching expensive derived values
- [ ] Lifecycle hooks are documented and intentional
- [ ] Tests cover lifecycle behavior (mount, updated, hydrate)

## Common Mistakes to Avoid
- [ ] Using `mount()` for per-request data — data stale on subsequent updates
- [ ] Heavy queries in `boot()` — slow every component interaction
- [ ] Side effects in `rendering()` — hard to debug, unexpected behavior
- [ ] Mutating properties in `updated()` — creates infinite update loops
- [ ] DB queries in `hydrate()` — expensive on every AJAX update
- [ ] Business logic in hooks (creating records, sending emails)
- [ ] Authorization in lifecycle hooks — belongs in actions or middleware
