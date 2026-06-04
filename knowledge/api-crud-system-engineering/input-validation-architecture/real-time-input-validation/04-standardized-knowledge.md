# Real Time Input Validation — Standardized Knowledge

## Overview
Real-time input validation provides immediate feedback to users as they type or interact with input fields, without requiring a full form submission. Laravel 13 supports this through Livewire's real-time validation (server round-trip with debounce) for database-backed checks, and client-side JavaScript for instant format validation. The key architectural decision is choosing the right validation layer for each check: simple format rules run client-side, uniqueness and existence checks require a server round-trip.

## Key Concepts
- **Client-Side Validation**: Instant feedback using JavaScript/Livewire AlpineJS. Validates format, length, required fields. Bypassable — never rely on it alone.
- **Server-Side Real-Time**: Livewire dispatches validation to the server. Handles DB-dependent rules like `unique:users,email`. Requires debounce to control request volume.
- **Debounce Strategy**: The delay between the user stopping typing and the validation request firing. Shorter for simple checks (150-300ms), longer for DB queries (500-750ms).
- **Submit-Time Validation**: Standard HTTP POST with full validation on form submission. The authoritative validation layer.

## Implementation
Livewire component with real-time validation:

```php
use Livewire\Component;
use Illuminate\Support\Facades\Validator;

class RegisterForm extends Component
{
    public string $email = '';
    public string $name = '';

    // Real-time validation on blur or debounced input
    public function updated($propertyName): void
    {
        $rules = match ($propertyName) {
            'email' => ['email' => ['required', 'email', 'unique:users,email']],
            'name' => ['name' => ['required', 'string', 'max:255']],
            default => [],
        };

        if ($rules) {
            $this->validate($rules);
        }
    }

    public function render(): View
    {
        return view('livewire.register-form');
    }
}
```

AlpineJS debounce in Blade:
```blade
<input wire:model.debounce.500ms="email" type="email">
```

## Best Practices
- Always validate server-side on submit — never trust client-side validation alone
- Use debounce: 500-750ms for fields requiring database queries
- Use debounce: 150-300ms for format-only checks (email format, min length)
- Return field-level errors so the UI can highlight the specific input
- Use `updated` hook in Livewire for per-field real-time validation
