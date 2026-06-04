# Livewire Validation — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Validation
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed
- [ ] Component has data-bound properties via `wire:model`
- [ ] Understanding of `#[Rule]` attribute syntax (Livewire v3+)

## Implementation Checklist
- [ ] `#[Rule]` attributes used for property-level rules
- [ ] `validate()` called at start of submit actions
- [ ] `validateOnly()` in `updated()` for real-time feedback
- [ ] `.debounce` on `wire:model` to reduce validation frequency
- [ ] Error messages displayed via `@error` Blade directives
- [ ] Cross-field validation uses `$this->addError()`
- [ ] No sensitive logic exposed in validation rules
- [ ] Tests cover both validation success and failure paths
- [ ] Custom error messages configured via `$messages` or `#[Rule(..., message: '...')]`

## Verification Checklist
- [ ] `#[Rule('required|min:3')]` on public properties validates correctly
- [ ] `validateOnly($property)` validates single property — clears error on success
- [ ] `validate()` validates all properties — throws `ValidationException` on failure
- [ ] `$this->addError('field', 'message')` adds errors programmatically
- [ ] `$this->resetValidation()` clears all validation errors
- [ ] `@error('title')` Blade directive displays errors correctly
- [ ] Real-time validation fires on every keystroke via `validateOnly()`
- [ ] Both real-time and deferred validation paths work

## Security Checklist
- [ ] Validation is server-side — rules defined in PHP, never exposed to client
- [ ] Same rules execute regardless of how data arrives
- [ ] Never trust client-provided data — `#[Rule]` ensures server validation
- [ ] `validate()` called before using data for business operations
- [ ] Validation rules don't leak sensitive application logic
- [ ] `validateOnly()` doesn't expose validation bypass opportunities

## Performance Checklist
- [ ] `.debounce` on `wire:model` reduces validation frequency for real-time fields
- [ ] Complex validation rules with DB queries use `.lazy` or `.defer`
- [ ] `validateOnly()` in `updated()` doesn't cause per-keystroke DB hits without debounce
- [ ] No excessive validation requests for fast typists
- [ ] Real-time validation is scoped to important fields only

## Production Readiness Checklist
- [ ] `#[Rule]` is preferred over `$rules` array for co-location
- [ ] `validate()` is called before any data mutation in action methods
- [ ] Cross-field validation handled via `$this->addError()` (not rules array)
- [ ] Validation is tested for both success and failure paths
- [ ] Error messages are user-friendly, not technical

## Common Mistakes to Avoid
- [ ] Not calling `validate()` in submit action — assuming data is valid
- [ ] No real-time validation — user doesn't see errors until submit
- [ ] Using `$rules` instead of `#[Rule]` in Livewire v3+
- [ ] Not debouncing real-time validation — excessive requests
- [ ] Cross-field validation in rules array — can't access other field values
- [ ] Processing data before calling `$this->validate()`
- [ ] Real-time validation without debounce — expensive on every keystroke
