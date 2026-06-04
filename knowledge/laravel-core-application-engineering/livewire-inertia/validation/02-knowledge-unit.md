# Livewire Validation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Validation
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire provides real-time and deferred validation through the `$rules` property or `#[Rule]` attributes. Validation runs on the server during property updates (real-time) or on action execution (deferred). Errors are automatically displayed in the view via `$errors` (shared with Blade's standard error bag).

The engineering value is server-side validation with real-time feedback. The user sees validation errors as they type (if `wire:model` is used) or on form submission (if `wire:model.defer` is used). The validation rules are defined in PHP, not JavaScript, ensuring consistency between client and server validation.

---

## Core Concepts

### Rules Definition

```php
class CreatePost extends Component
{
    public string $title = '';
    public string $body = '';

    protected $rules = [
        'title' => 'required|min:5|max:255',
        'body' => 'required|min:20',
    ];
}
```

Or using PHP 8 attributes (Livewire v3+):

```php
class CreatePost extends Component
{
    #[Rule('required|min:5|max:255')]
    public string $title = '';

    #[Rule('required|min:20')]
    public string $body = '';
}
```

### Real-Time Validation

Validates on every property update:

```php
public function updated(string $propertyName): void
{
    $this->validateOnly($propertyName);
}
```

### Deferred Validation (Form Submit)

```php
public function save(): void
{
    $this->validate(); // Validates all properties
    Post::create($this->only(['title', 'body']));
}
```

### Error Display

```blade
@error('title')
    <div class="error">{{ $message }}</div>
@enderror
```

---

## Mental Models

### The Server-Side Validator

Livewire validation is server-side only. Every validation check requires a round-trip to the server. The user feels this as a slight delay between typing and seeing validation feedback. This is the opposite of client-side validation (instant feedback, but potentially inconsistent with server rules).

### The Inline Inspector

`$this->validateOnly('title')` after typing in the title field is like having an inspector watch over each field individually. The inspector checks that field and reports errors immediately, without checking other fields.

---

## Internal Mechanics

### validateOnly() Behavior

`$this->validateOnly($propertyName)` validates a single property against the `$rules` array. If validation fails, the error is added to the component's error bag. If it passes, any existing error for that property is cleared.

### Real-Time Validation via updated() Hook

```php
public function updated(string $propertyName): void
{
    $this->validateOnly($propertyName);
}
```

This calls `validateOnly` on EVERY property update. For fields with many keystroke events, this means many server-side validation calls.

---

## Patterns

### Real-Time with Debounce

Validate on blur, not on every keystroke:

```blade
<input wire:model.lazy="email">
```

The `lazy` modifier syncs on blur/change, reducing validation requests.

### Custom Error Messages

```php
protected $messages = [
    'title.required' => 'Please enter a post title.',
    'title.min' => 'The title must be at least :min characters.',
    'body.min' => 'Your post body is too short.',
];
```

### Validation with Custom Rules

```php
use Illuminate\Validation\Rule;

protected $rules = [
    'email' => ['required', 'email', Rule::unique('users')],
];
```

### Conditional Validation

```php
protected function rules(): array
{
    return [
        'password' => $this->isUpdate
            ? ['required', 'min:8', 'confirmed']
            : ['required', 'min:8'],
        'password_confirmation' => $this->isUpdate ? ['required'] : [],
    ];
}
```

### Reset Validation on Input

Clear errors when the user starts typing again:

```php
public function updatedTitle(): void
{
    $this->resetValidation('title');
}
```

---

## Architectural Decisions

### Real-Time vs Deferred Validation

| Concern | Real-Time (updated) | Deferred (validate on submit) |
|---|---|---|
| Server requests | Many (per keystroke) | Few (on submit) |
| User feedback | Instant (after round-trip) | After submit |
| Server load | Higher | Lower |
| UX quality | Higher (immediate correction) | Good (single pass) |

Use real-time for critical fields (email uniqueness, password strength). Use deferred for simple forms where submission-time validation is sufficient.

### validateOnly vs full validate

`validateOnly` checks one field. `validate()` checks all. After calling `validateOnly`, do NOT call `validate()` later unless you want to re-validate all fields.

---

## Tradeoffs

| Concern | Livewire Validation | FormRequest Validation | Client-Side (Alpine) |
|---|---|---|---|
| Server dependency | Always | Always | Never |
| Real-time feedback | Yes (round-trip delay) | No (on submit) | Instant |
| Rule consistency | Server only | Server only | Must duplicate |
| Offline support | No | No | Yes |

---

## Performance Considerations

Each `validateOnly` call runs the Validator on a single field. Rule complexity affects speed — `unique:users,email` requires a database query. For real-time validation of `unique` rules, cache or debounce heavily.

---

## Production Considerations

### Always Validate on Save

Even with real-time validation, always call `$this->validate()` before persisting data. Real-time validation may have gaps (deferred properties, skipped fields).

### Use Real-Time Only for Critical Fields

Apply real-time validation sparingly — only for fields where immediate feedback significantly improves UX (email uniqueness, password strength, username availability).

### Custom Error Bag

Livewire uses the default `default` error bag. To use a custom bag:

```php
$this->addError('custom_field', 'Custom error message.');
```

---

## Common Mistakes

### Forgetting validate() on Save

Real-time validation does not guarantee valid data at submission. Always call `$this->validate()` in the save action.

### Too Many Real-Time Validations

10 fields with real-time validation send 10 AJAX requests per keystroke ebb. This overwhelms the server. Limit real-time validation to 2-3 critical fields.

### Using validateOnly After Full Validation

Calling `validateOnly` after `validate` passed does not add errors. But calling `validate` after `validateOnly` failed re-validates all fields, potentially clearing per-field errors.

---

## Failure Modes

### Race Conditions

If a user types quickly, multiple `validateOnly` requests may arrive out of order. The last response wins, potentially overwriting earlier validation results.

### Inconsistent Error State

Real-time validation passes, but deferred validation fails on submit. The user sees validation passing per-field but failing on submit, causing confusion. Document that real-time validation is best-effort; final validation is on submit.

---

## Ecosystem Usage

Livewire validation uses Laravel's Validator class and supports all built-in Laravel validation rules (required, unique, min, max, etc.), custom rule objects, and FormRequest-style `$rules` arrays. The `#[Rule]` attribute was introduced in Livewire v3 for per-property declarations. Errors display using Blade's `@error` directive.

## Related Knowledge Units

- **Data Binding** (this workspace) — wire:model interaction with validation
- **Actions and Events** (this workspace) — validate on action
- **Lifecycle Hooks** (this workspace) — updated() hook for validation

---

## Research Notes

- Livewire uses Laravel's `Validator` class under the hood — same as FormRequest validation
- The `#[Rule]` attribute was introduced in Livewire v3 for per-property rule declarations
- `validateOnly()` returns the validated value if validation passes
- Livewire's error bag is compatible with Blade's `@error` directive
