# Skill: Use Lifecycle Hooks Effectively in Livewire Components

## Purpose

Apply Livewire lifecycle hooks (`mount`, `boot`, `updating`, `updated`, `hydrate`) correctly — using each hook for its intended purpose while avoiding performance pitfalls and infinite loops.

## When To Use

- Loading initial data in `mount()` (one-time)
- Setting up per-request data in `boot()` (fresh on every request)
- Validating or transforming values in `updating[Property]()` (before set)
- Reacting to property changes in `updated[Property]()` (after set)

## When NOT To Use

- Simple property initialization (use property defaults)
- Business logic that belongs in action methods (creating records, sending emails)
- Side effects in `rendering()`/`rendered()` (use action methods)

## Prerequisites

- Understanding of mount vs boot lifecycle differences
- Component with properties that need reactive handling

## Inputs

- Initial data sources (mount vs boot decision)
- Properties requiring validation/transformation on update
- Side effects tied to property changes

## Workflow

1. Place one-time initialization (data that never changes during component lifetime) in `mount()`
2. Place per-request setup (fresh data needed on every AJAX interaction) in `boot()`
3. Keep `boot()`, `hydrate()`, `updating()`, and `updated()` hooks lightweight — under 5ms
4. Use `updating[Property]()` to intercept and transform values before they're set:
   ```php
   public function updatingSearch(): void { $this->search = strip_tags($this->search); }
   ```
5. Use `updated[Property]()` for reactive side effects after property change:
   ```php
   public function updatedCountryId($value): void { $this->cities = City::where(...)->get(); }
   ```
6. Guard against infinite update loops when modifying a property inside its own `updated` hook
7. Never put business logic (creating records, sending emails, payment processing) in lifecycle hooks
8. For validation/transformation that can be expressed in `#[Rule]` attributes, use `validateOnly()` in `updated()` instead of manual checks in `updating()`

## Validation Checklist

- [ ] `mount()` used only for one-time initialization (not per-request data)
- [ ] `boot()` used for per-request setup that must be fresh
- [ ] No heavy queries in `boot()` or `hydrate()` (keep under 5ms)
- [ ] `updating[Property]()` used for validation/transformation before set
- [ ] `updated[Property]()` used for reactive side effects after set
- [ ] No infinite update loops in hooks
- [ ] No business logic (create records, send emails, pay) in lifecycle hooks
- [ ] Authorization handled in actions, not hooks

## Common Failures

- Using `mount()` for per-request data — data stale on subsequent AJAX updates
- Heavy queries in `boot()` — slow every component interaction
- Side effects in `rendering()` — hard to debug, unexpected execution
- Mutating a property inside its own `updated()` hook — infinite loop, stack overflow
- DB queries in `hydrate()` — expensive on every AJAX update

## Decision Points

- `mount()`: data fetched once (user object, post by ID). `boot()`: data that must be fresh on every request (notifications, unread counts)
- Use `updating` for sanitization/transformation before the value is set. Use `updated` for side effects after the value is set
- Use `#[Computed]` for derived data instead of computing in hooks

## Performance Considerations

`mount()` runs once — lightweight by default. `boot()` runs on every request — keep sub-millisecond. `hydrate()` runs on every AJAX update — avoid DB queries. `updated` hooks fire for every property change — use debounced properties to reduce frequency.

## Security Considerations

`hydrate()` restores non-serializable dependencies — ensure restored services don't trust user-controlled data. `updating()` can reject invalid values before they're set. Never perform authorization in lifecycle hooks — use action methods.

## Related Rules

- Use mount for One-Time Initialization (05-rules.md)
- Keep Lifecycle Hooks Lightweight (05-rules.md)
- Use updating Property for Validation and Transformation (05-rules.md)
- Prevent Infinite Update Loops (05-rules.md)
- No Business Logic in Hooks (05-rules.md)

## Related Skills

- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Implement Efficient Data Binding with Correct Modifiers (livewire/data-binding)
- Implement and Test Livewire Actions with Events (livewire/actions-events)

## Success Criteria

- `mount()` contains only one-time initialization; `boot()` contains per-request setup
- No lifecycle hook performs a database query or expensive computation directly
- `updating` hooks catch and transform invalid values before they're set
- No infinite loops from properties modified inside their own `updated` hooks
- Business logic resides in action methods, not lifecycle hooks
