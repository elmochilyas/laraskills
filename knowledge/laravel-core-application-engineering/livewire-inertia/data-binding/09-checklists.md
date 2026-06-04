# Livewire Data Binding — Checklist

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire
- **Knowledge Unit:** Livewire Data Binding
- **Last Updated:** 2026-06-04

---

## Prerequisites Checklist
- [ ] Livewire v3 installed
- [ ] Component extends `Livewire\Component`
- [ ] Blade template uses `wire:model` directives
- [ ] Properties bound to inputs are declared as public on component class

## Implementation Checklist
- [ ] Form fields use appropriate `wire:model` modifiers
- [ ] Search/auto-complete fields have `.debounce`
- [ ] Form fields use `.defer` except where real-time feedback is needed
- [ ] Numeric fields use `.number` modifier
- [ ] Checkbox fields use `.boolean` modifier
- [ ] `updated` hooks not performing expensive operations without debounce
- [ ] Computed properties not bound with `wire:model` (read-only)
- [ ] Validation applied before using bound data for business logic
- [ ] All HTML input types supported (text, textarea, select, checkbox, radio, file)

## Verification Checklist
- [ ] `wire:model="property"` binds to a public property on component class
- [ ] On input change: JS captures event → AJAX → Server updates → `updated*()` hook → Re-render
- [ ] `.defer` bypasses per-key AJAX — value sent with next action request
- [ ] `.debounce` parameter works correctly (ms: `wire:model.debounce.300ms`)
- [ ] Multiple properties have independent debounce settings
- [ ] `#[Computed]` properties cannot use `wire:model` (read-only)

## Security Checklist
- [ ] Data binding does not bypass validation
- [ ] Properties updated via `wire:model` are subject to `#[Rule]` validation
- [ ] Never trust user input — validate before using for business operations
- [ ] `validate()` or `validateOnly()` called before processing bound data
- [ ] Bound data is sanitized appropriately

## Performance Checklist
- [ ] `.debounce` used for rapid-fire inputs (sliders, search, range inputs)
- [ ] `.defer` used for most form fields to batch updates
- [ ] `.lazy` used when real-time feedback is not needed
- [ ] `updated` hooks don't contain expensive queries on frequent updates
- [ ] Default `wire:model` (no modifier) only used when real-time sync is needed
- [ ] Fast typist on search field doesn't trigger 5-10 requests/second
- [ ] N+1 AJAX requests avoided by using `.defer` on all form fields

## Production Readiness Checklist
- [ ] All bound properties have appropriate modifiers for the use case
- [ ] `updated` hooks are documented and intentional
- [ ] Dependent dropdowns use `updated` hooks correctly
- [ ] Validation is tested for both real-time and deferred paths
- [ ] Form UX is smooth (no excessive network requests visible to user)

## Common Mistakes to Avoid
- [ ] Not using `.defer` for forms — N+1 AJAX requests per form
- [ ] No debounce on search — server overload on fast typing
- [ ] Missing `.number` on numeric inputs — type errors in PHP
- [ ] Binding to computed properties — read-only, never updates
- [ ] Side effects in `updated` without debounce — slow responses
- [ ] All fields with live binding — each sends separate AJAX
- [ ] No debounce on rapid-fire inputs (sliders, range inputs)
