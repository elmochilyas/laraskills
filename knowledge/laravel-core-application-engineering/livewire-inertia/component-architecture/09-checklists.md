# Livewire Component Architecture — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Component Architecture
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed
- [ ] Component auto-discovery enabled (default `app/Livewire/`)
- [ ] Blade templating engine available

## Implementation Checklist
- [ ] Components are in `app/Livewire/` directory
- [ ] Templates are in `resources/views/livewire/` matching component name
- [ ] Public properties have PHP type declarations
- [ ] Sensitive data marked `#[Volatile]`
- [ ] Component split at appropriate granularity (one concern per component)
- [ ] `render()` returns a View instance
- [ ] No controller logic in component class
- [ ] `#[Computed]` used for expensive derived properties
- [ ] `#[Lazy]` considered for expensive components below the fold

## Verification Checklist
- [ ] Component auto-discovered (no manual registration needed)
- [ ] Each instance has a unique `$__id` for tracking
- [ ] Hydration/Dehydration cycle works correctly
- [ ] Blade template receives component properties correctly
- [ ] Full-page components work via `Route::get('/path', Component::class)`
- [ ] Nested components embed correctly via `<livewire:child-component>`
- [ ] Inline components return string from `render()`

## Security Checklist
- [ ] Checksum verification prevents tampered component state
- [ ] `#[Rule]` attributes validate properties before updates
- [ ] Sensitive data never stored in public properties without `#[Volatile]`
- [ ] CSRF protection applies to all Livewire requests
- [ ] No sensitive data in component snapshot visible in HTML source
- [ ] Authorization checks in actions for protected operations

## Performance Checklist
- [ ] Component size is minimized to reduce AJAX payload
- [ ] `#[Lazy]` used for expensive components below the fold
- [ ] `wire:model.defer` used to batch updates
- [ ] Hydration/dehydration cycle time is acceptable (5-50ms per interaction)
- [ ] No monolithic components with many properties
- [ ] `#[Computed]` caches expensive derived data within a request
- [ ] Deep nested component hierarchy avoided

## Production Readiness Checklist
- [ ] Component naming is consistent (kebab-case for Blade tags)
- [ ] Team understands component lifecycle (hydration/dehydration)
- [ ] `render()` method passes additional data to template as needed
- [ ] Components follow single responsibility principle
- [ ] No god components handling entire page — split into widgets
- [ ] Database queries not mixed with rendering logic

## Common Mistakes to Avoid
- [ ] Large component with many properties — slow hydration, large payloads
- [ ] Not using type hints — runtime type errors
- [ ] Sensitive data in public properties without `#[Volatile]`
- [ ] Too many nested components — performance overhead
- [ ] No `#[Computed]` for expensive getters — slow renders
- [ ] Controller logic in Livewire component — extract services/actions
- [ ] God component handling entire page — split into widgets
