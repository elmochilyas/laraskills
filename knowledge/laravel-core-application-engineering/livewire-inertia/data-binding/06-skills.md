# Skill: Implement Efficient Data Binding with Correct Modifiers

## Purpose

Use `wire:model` with appropriate modifiers (`.defer`, `.debounce`, `.number`, `.boolean`, `.lazy`) to bind form inputs to Livewire component properties efficiently.

## When To Use

Any form input in a Livewire component that needs server-side state synchronization.

## When NOT To Use

- Static display values (use Blade `{{ }}`)
- Read-only data that never changes from the client
- Computed properties marked `#[Computed]` (they are read-only)

## Prerequisites

- Livewire component with public properties declared
- Understanding of each `wire:model` modifier's behavior

## Inputs

- Form fields and their PHP property types
- Real-time feedback requirements per field
- Performance constraints (expected field count, typing frequency)

## Workflow

1. For most form fields in a form, use `wire:model.defer` to batch updates until action submission
2. For search-as-you-type or fields with real-time server feedback, use `wire:model.debounce.300ms`:
   ```blade
   <input wire:model.debounce.300ms="search">
   ```
3. For numeric inputs, always add `.number` modifier:
   ```blade
   <input type="number" wire:model.number="age">
   ```
4. For checkbox inputs, always add `.boolean` modifier:
   ```blade
   <input type="checkbox" wire:model.boolean="is_active">
   ```
5. For fields where real-time feedback isn't needed until the field loses focus, use `.lazy`
6. Add `updated[Property]()` hooks for side effects that should react to property changes (e.g., dependent dropdowns)
7. Keep `updated` hooks lightweight — debounce the input if the hook performs DB queries or API calls
8. Never bind `wire:model` to a `#[Computed]` property

## Validation Checklist

- [ ] Form fields use `wire:model.defer` except where real-time feedback is needed
- [ ] Search/auto-complete fields have `.debounce` (300ms or longer)
- [ ] Numeric fields use `.number` modifier
- [ ] Checkbox fields use `.boolean` modifier
- [ ] `updated` hooks are lightweight — no expensive queries without debounce
- [ ] Computed properties not bound with `wire:model`
- [ ] Validation applied before using bound data for business logic

## Common Failures

- Not using `.defer` for forms — N+1 AJAX requests per form (one per field per keystroke)
- No debounce on search — database query on every keystroke, 5-10 requests/second
- Missing `.number` on numeric inputs — string "25" sent to `int` property, type error
- Missing `.boolean` on checkboxes — property set to string "on" instead of `true`
- Binding to computed properties — silently fails, property never updates on server

## Decision Points

- Use `.defer` for form fields that only need server sync on submit. Use live binding (no modifier) only when real-time server feedback is needed
- Use `.debounce.300ms` for search fields. Use `.lazy` for fields that validate on blur
- Add `updated` hooks for reactive side effects like dependent dropdowns. Skip them if no server reaction is needed on field change

## Performance Considerations

Each `wire:model` update (without `.defer` or `.debounce`) sends an AJAX request. A fast typist triggers 5-10 requests/second. `.defer` reduces AJAX traffic by up to 90% by batching all field updates into a single action request.

## Security Considerations

Data binding does not bypass validation. Properties updated via `wire:model` are still subject to `#[Rule]` attributes. Never trust user input — always validate before using data for business operations.

## Related Rules

- Use defer for Most Form Fields (05-rules.md)
- Debounce Search and Real-Time Fields (05-rules.md)
- Use number for Numeric Inputs (05-rules.md)
- Use boolean for Checkboxes (05-rules.md)
- Never Bind wire:model to Computed Properties (05-rules.md)
- Keep updated Hooks Lightweight (05-rules.md)

## Related Skills

- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Implement Real-Time Server-Side Validation (livewire/validation)
- Use Lifecycle Hooks Effectively in Livewire Components (livewire/lifecycle-hooks)

## Success Criteria

- Form fields use correct modifiers: `.defer` for most, `.debounce` for search, `.number` for numbers, `.boolean` for checkboxes
- No excessive AJAX requests — only necessary network calls are made
- No type errors from string-to-int or string-to-bool mismatches
- `updated` hooks execute only when needed and are lightweight
- Computed properties are not used with `wire:model`
