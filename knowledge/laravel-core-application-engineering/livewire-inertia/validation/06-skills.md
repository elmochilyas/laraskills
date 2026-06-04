# Skill: Implement Real-Time Server-Side Validation

## Purpose

Define validation rules using `#[Rule]` attributes with real-time feedback via `validateOnly()` in `updated()` hooks, deferred validation in action methods, and cross-field validation using `$this->addError()`.

## When To Use

- Forms with real-time validation feedback as users type
- Inline validation that doesn't require a separate FormRequest class
- Scenarios where validation is part of the component, not a separate HTTP layer

## When NOT To Use

- Complex validation shared across multiple components (extract to custom rule classes)
- Validation that needs to be reused in non-Livewire contexts (use FormRequests instead)
- Authorization logic (use `authorize()` in FormRequests or Gate checks)

## Prerequisites

- Livewire component with public properties
- Understanding of Laravel validation rules

## Inputs

- Form fields and their validation rules
- Real-time vs deferred validation requirements
- Cross-field validation logic (if any)

## Workflow

1. Apply `#[Rule]` attributes directly on public properties (preferred over `$rules` array):
   ```php
   #[Rule('required|min:5|max:255')]
   public string $title = '';
   ```
2. Add `updated(string $propertyName)` hook that calls `$this->validateOnly($propertyName)` for real-time feedback
3. In submit action methods, call `$this->validate()` as the first statement before any business logic
4. Use `$this->addError('field', 'message')` for cross-field validation that involves multiple properties:
   ```php
   if ($this->endDate && $this->startDate && $this->endDate <= $this->startDate) {
       $this->addError('endDate', 'End date must be after start date.');
       return;
   }
   ```
5. Add `.debounce.300ms` on `wire:model` for fields triggering expensive validation rules
6. Display errors in the Blade template using `@error('field')` directive
7. Customize error messages via `#[Rule(..., message: '...')]` for important fields

## Validation Checklist

- [ ] `#[Rule]` attributes used for property-level rules (preferred over `$rules` array)
- [ ] `$this->validate()` called at start of every mutating action
- [ ] `$this->validateOnly()` in `updated()` for real-time feedback
- [ ] `.debounce` on `wire:model` for fields triggering expensive validation
- [ ] Error messages displayed via `@error` Blade directives
- [ ] Cross-field validation uses `$this->addError()`
- [ ] Custom error messages added where default messages would confuse users

## Common Failures

- Not calling `$this->validate()` in submit action — invalid data saved
- No real-time validation — user fills entire form, submits, sees all errors at once
- Using `$rules` array instead of `#[Rule]` — property renames orphan validation rules
- No debounce on real-time validation — excessive validation requests per keystroke
- Cross-field validation in a single `#[Rule]` — can't access other field values

## Decision Points

- Use `#[Rule]` attributes for static rules; use `$rules` as a computed property only when rules depend on runtime values
- Use `validateOnly()` in `updated()` for real-time feedback on every keystroke; use no real-time validation for simple forms where submit-time validation is sufficient
- Use `$this->addError()` for cross-field validation; use custom rule objects for reusable multi-field logic

## Performance Considerations

Real-time validation via `validateOnly()` fires on every property update. Add `.debounce` on `wire:model` to reduce validation frequency. Complex rules with DB queries should use `.lazy` or `.defer`.

## Security Considerations

Livewire validation is server-side — rules are defined in PHP, never exposed to the client. Never trust client-provided data — `#[Rule]` attributes ensure validation on the server before data is used.

## Related Rules

- Prefer Rule Attributes Over Rules Array (05-rules.md)
- Validate at the Start of Every Action (05-rules.md)
- Provide Real-Time Validation Feedback (05-rules.md)
- Debounce Real-Time Validation (05-rules.md)
- Use addError for Cross-Field Validation (05-rules.md)
- Customize Error Messages (05-rules.md)

## Related Skills

- Implement Efficient Data Binding with Correct Modifiers (livewire/data-binding)
- Implement and Test Livewire Actions with Events (livewire/actions-events)
- Write Comprehensive Livewire Component Tests (livewire/testing)

## Success Criteria

- `#[Rule]` attributes present on all validated properties
- Real-time validation provides immediate per-field error feedback
- Submit actions validate before any business logic executes
- Cross-field validation correctly catches inter-field rule violations
- Error messages are clear and user-friendly
- Validation rules are tested (both pass and fail paths)
