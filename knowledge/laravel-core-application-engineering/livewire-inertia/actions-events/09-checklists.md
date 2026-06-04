# Livewire Actions and Events — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Actions and Events
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed
- [ ] Component class extends `Livewire\Component`
- [ ] Component template exists with `wire:*` directives

## Implementation Checklist
- [ ] All callable actions are public methods
- [ ] Validation called before data mutations in actions
- [ ] Authorization checked before sensitive actions
- [ ] Events dispatched for cross-component communication
- [ ] Event listeners registered in `getListeners()`
- [ ] Error handling for DB/API operations
- [ ] Loading states shown during long-running actions
- [ ] Actions are focused and delegate complex logic to services
- [ ] Action names clearly describe the operation (`save`, `deleteUser`, `toggleActive`)

## Verification Checklist
- [ ] Actions trigger via `wire:click`, `wire:submit`, `wire:keydown` correctly
- [ ] Parameters passed to actions work correctly (`wire:click="remove({{ $index }})"`)
- [ ] `$dispatch('event-name', data: [...])` sends events to listening components
- [ ] `getListeners()` returns correct `['event-name' => 'methodName']` map
- [ ] `$dispatch('event')->to('other-component')` scopes events correctly
- [ ] `$refresh` re-renders without state changes
- [ ] Checksum verification works (prevents tampered state)

## Security Checklist
- [ ] Sensitive actions check authorization via `authorize()` or Gate
- [ ] Non-public methods are NOT callable from frontend
- [ ] CSRF protection applies to all Livewire action requests
- [ ] Checksum validation prevents tampered component state
- [ ] Actions have access to all public properties — authorized access only
- [ ] `#[Volatile]` used for sensitive data in actions

## Performance Checklist
- [ ] Long-running actions use queueable jobs (don't block UI)
- [ ] Events don't have too many listeners (sequential processing)
- [ ] No 500-line action methods — extracted to services
- [ ] Action execution is synchronous — blocking time is acceptable
- [ ] Event dispatching is cheap (~0.1ms) — no optimization needed

## Production Readiness Checklist
- [ ] Loading states (`wire:loading`) shown during action execution
- [ ] Submit buttons disabled during processing (`wire:loading.attr="disabled"`)
- [ ] Error handling for failed actions (try/catch with user feedback)
- [ ] Meaningful responses after action (`dispatch('saved')` or flash message)
- [ ] Cross-component events are documented and consistent
- [ ] Event listener name typos avoided (use constants for event names)

## Common Mistakes to Avoid
- [ ] Non-public action methods — frontend gets 404 error
- [ ] No validation in save actions — invalid data saved
- [ ] Long-running actions without feedback — UI freezes
- [ ] Event listener name mismatch — listener never fires
- [ ] Direct model access without authorization check
- [ ] 500-line action methods — extract complex logic to services
- [ ] Events with too many listeners (10+) — consider splitting
- [ ] No error handling — silent failures on DB operations
