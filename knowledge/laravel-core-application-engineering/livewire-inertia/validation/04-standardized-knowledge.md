# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Validation |
| Difficulty Level | Intermediate |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire provides real-time and deferred validation through the `$rules` property or `#[Rule]` attributes. Validation runs on the server during property updates (real-time) or on action execution (deferred). Errors are automatically displayed in the view via `$errors` (shared with Blade's standard error bag). The engineering value is server-side validation with real-time feedback.

---

## Core Concepts

- **Rules definition**: `protected $rules = [...]` (array) or `#[Rule('...')]` (PHP 8 attribute syntax)
- **Real-time validation**: `$this->validateOnly($propertyName)` in `updated()` hook — validates on each keystroke
- **Deferred validation**: `$this->validate()` in submit action — validates all properties at once
- **Error display**: `@error('field')` Blade directive — same as standard Laravel validation errors
- **`$this->addError()`**: Programmatically add errors for custom validation scenarios

---

## When To Use

- Forms with real-time validation feedback as users type
- Inline validation that doesn't require a separate FormRequest class
- Scenarios where validation is part of the component, not a separate HTTP layer

## When NOT To Use

- Complex validation shared across multiple components (extract to custom rule classes)
- Validation that needs to be reused in non-Livewire contexts (use FormRequests instead)
- Authorization logic (use `authorize()` in FormRequests or Gate checks)

---

## Best Practices

- **Use `#[Rule]` attributes** over `$rules` array — cleaner, co-located with properties (Livewire v3+)
- **Use `validateOnly()` in `updated()` for real-time feedback** — validates the changed field immediately
- **Use `validate()` in submit actions** — validates all rules before processing
- **Call `validate()` at the START of action methods** — fail fast before any business logic
- **Use `$this->addError()` for cross-field validation** — when field-level rules aren't sufficient
- **Customize error messages** via `$messages` property or `#[Rule(..., message: '...')]`

---

## Architecture Guidelines

- `#[Rule('required|min:3')]` attribute on public properties (Livewire v3+)
- `$rules` array as alternative: `protected $rules = ['title' => 'required|min:3']`
- `validateOnly($property)` validates a single property — clears error for that field on success
- `validate()` validates all properties — throws `ValidationException` on failure
- `$this->resetValidation()` clears all validation errors
- `$this->addError('field', 'message')` for programmatic error addition

---

## Performance

Real-time validation via `validateOnly()` fires on every property update (every keystroke). Use `.debounce` on `wire:model` to reduce validation frequency. Complex validation rules with database queries should use `.lazy` or `.defer` to avoid per-keystroke database hits.

---

## Security

Livewire validation is server-side — rules are defined in PHP, never exposed to the client. The same rules execute regardless of how the data arrives. Never trust client-provided data — `#[Rule]` attributes ensure validation on the server before the data is used.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not calling validate() in submit action | Assuming data is valid | Invalid data saved | Always call `$this->validate()` |
| No real-time validation | Only validating on submit | User doesn't see errors until submit | Add `validateOnly()` in `updated()` |
| Using `$rules` instead of `#[Rule]` | Older syntax preference | Rules separated from properties | Use `#[Rule]` for co-location |
| Not debouncing real-time validation | No `.debounce` on wire:model | Excessive validation requests | Add `.debounce.300ms` |
| Cross-field validation in rules array | Trying to validate multiple fields in one rule | Can't access other field values | Use `$this->addError()` in `updated()` |

---

## Anti-Patterns

- **Validation in action without validate()**: Processing data before calling `$this->validate()`
- **All rules in one giant `$rules` array**: Not using `#[Rule]` attributes for co-location
- **Real-time validation without debounce**: Expensive validation on every keystroke
- **No real-time validation for important fields**: User types entire form, submits, gets all errors at once

---

## Examples

**Rules with #[Rule] attributes:**
```php
class CreatePost extends Component
{
    #[Rule('required|min:5|max:255')]
    public string $title = '';

    #[Rule('required|min:20')]
    public string $body = '';
}
```

**Real-time validation in updated:**
```php
public function updated(string $propertyName): void
{
    $this->validateOnly($propertyName);
}
```

**Deferred validation on submit:**
```php
public function save(): void
{
    $this->validate();
    Post::create($this->only(['title', 'body']));
    session()->flash('success', 'Post created!');
}
```

**Error display in Blade:**
```blade
<input wire:model="title">
@error('title')
    <div class="error">{{ $message }}</div>
@enderror
```

**Custom error messages:**
```php
#[Rule('required', message: 'Please provide a title')]
#[Rule('min:5', message: 'Title must be at least 5 characters')]
public string $title = '';
```

---

## Related Topics

- livewire/component-architecture — Component fundamentals
- livewire/data-binding — wire:model with validation
- livewire/actions-events — Action validation flow
- livewire/loading-states — Loading during validation
- livewire/testing — Testing validation behavior

---

## AI Agent Notes

- `#[Rule]` attributes were introduced in Livewire v3 — preferred over `$rules` array
- `validateOnly($property)` validates a single property against the rules
- `validate()` validates ALL properties and throws `ValidationException` on failure
- `$this->addError('field', 'message')` adds custom errors programmatically
- Error messages use the same `@error` Blade directive as standard Laravel validation
- Real-time validation via `validateOnly()` in `updated()` fires on every property update

---

## Verification

- [ ] `#[Rule]` attributes used for property-level rules
- [ ] `validate()` called at start of submit actions
- [ ] `validateOnly()` in `updated()` for real-time feedback
- [ ] `.debounce` on wire:model to reduce validation frequency
- [ ] Error messages displayed via `@error` Blade directives
- [ ] Cross-field validation uses `$this->addError()`
- [ ] No sensitive logic exposed in validation rules
- [ ] Tests cover both validation success and failure paths
