# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Data Binding |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire data binding connects public PHP properties to HTML form inputs via `wire:model`. When the user updates the input, the PHP property updates automatically. When the PHP property changes, the input value updates. This is bidirectional, server-driven data binding — the source of truth is the PHP property on the server. The engineering value is real-time synchronization without client-side JavaScript.

---

## Core Concepts

- **`wire:model` directive**: Two-way binding between input and PHP property
- **Modifiers**: `.debounce.500ms` (delay sync), `.lazy` (sync on blur), `.defer` (sync on action), `.number` (cast to number), `.boolean` (cast to boolean)
- **updated hook**: `updatedPropertyName()` fires after a specific property is updated
- **Deferred binding**: `wire:model.defer` does NOT sync until a component action triggers it — reduces AJAX requests
- **All HTML input types supported**: text, textarea, select, checkbox, radio, file

---

## When To Use

- Any form input that needs server-side processing on change
- Search-as-you-type fields with live results
- Real-time validation feedback as users type
- Forms where data needs to be available on the server before submission

## When NOT To Use

- Static display values (use Blade `{{ }}`)
- Read-only data that never changes from the client
- Forms where all validation happens on submit (use `wire:model.defer` instead)

---

## Best Practices

- **Use `.debounce` for search fields** — prevents excessive AJAX requests on every keystroke
- **Use `.defer` for most form fields** — syncs data only on action, reducing AJAX overhead
- **Use `.lazy` for fields where real-time feedback isn't needed** — syncs on blur/change
- **Always use `.number` for numeric inputs** — prevents string type issues
- **Use `.boolean` for checkboxes** — ensures proper boolean type in PHP
- **Use `updated` hooks for side effects** — react to property changes (search, dependent dropdowns)

---

## Architecture Guidelines

- `wire:model="property"` binds to a public property on the component class
- On input change: JS captures event → AJAX sends value → Server updates property → `updated*()` hook fires → Re-render
- `.defer` bypasses per-key AJAX — value sent with the next action request
- `.debounce` parameter in milliseconds: `wire:model.debounce.300ms`
- Multiple properties can have independent debounce settings
- Computed properties (with `#[Computed]`) cannot use `wire:model` — they're read-only

---

## Performance

Each `wire:model` update (without `.defer` or `.debounce`) sends an AJAX request per change. A fast typist can trigger 5-10 requests per second on a single field. Use `.debounce.300ms` to rate-limit. Use `.defer` to batch all field updates into a single action request. The server-side `updated` hook adds additional processing time.

---

## Security

Data binding does not bypass validation. Properties updated via `wire:model` are still subject to `#[Rule]` attributes or `$rules` validation when `validate()` or `validateOnly()` is called. Never trust user input — always validate before using data for business operations.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Not using `.defer` for forms | Default wire:model behavior | N+1 AJAX requests per form | Use `.defer` on all form fields |
| No debounce on search | Real-time without throttling | Server overload on fast typing | Use `.debounce.300ms` |
| Missing `.number` on numeric inputs | String input by default | Type errors in PHP | Always use `.number` for numbers |
| Binding to computed properties | Confusing computed with public | Read-only → never updates | Use public properties for binding |
| Side effects in `updated` without debounce | Expensive query on every keystroke | Slow responses | Debounce or defer |

---

## Anti-Patterns

- **All fields with live binding**: Every input sends separate AJAX requests — use `.defer` for forms
- **No debounce on rapid-fire inputs**: Sliders, range inputs, search without debounce
- **Binding to non-public properties**: `wire:model` requires public properties
- **Side effects in every `updated`**: Expensive queries in `updated()` for frequently-changing fields

---

## Examples

**Basic binding:**
```blade
<input wire:model="search" placeholder="Search users...">
```

**With modifiers:**
```blade
<input wire:model.debounce.300ms="search">
<input wire:model.lazy="name">
<input wire:model.defer="email">
<input wire:model.number="age">
<input wire:model.boolean="is_active">
```

**Search-as-you-type with debounce:**
```php
class SearchUsers extends Component
{
    public string $search = '';
    public array $results = [];

    public function updatedSearch(): void
    {
        $this->results = User::where('name', 'like', "%{$this->search}%")
            ->take(10)->get()->toArray();
    }
}
```

**Dependent dropdown:**
```php
public $countryId;
public $cities = [];

public function updatedCountryId($value): void
{
    $this->cities = City::where('country_id', $value)->get()->toArray();
}
```

---

## Related Topics

- livewire/component-architecture — Component fundamentals
- livewire/actions-events — Triggering server methods
- livewire/validation — Validating bound properties
- livewire/loading-states — Loading indicators with data binding

---

## AI Agent Notes

- `wire:model.defer` does NOT sync until a component action triggers it
- The `updated[Property]` hook fires after the property value changes on the server
- `.number` casts the incoming value to a PHP number using `+$value`
- `.boolean` casts using `filter_var($value, FILTER_VALIDATE_BOOLEAN)`
- Livewire's JavaScript captures input events and sends them via AJAX to the server

---

## Verification

- [ ] Form fields use appropriate `wire:model` modifiers
- [ ] Search/auto-complete fields have `.debounce`
- [ ] Form fields use `.defer` except where real-time feedback is needed
- [ ] Numeric fields use `.number` modifier
- [ ] Checkbox fields use `.boolean` modifier
- [ ] `updated` hooks not performing expensive operations without debounce
- [ ] Computed properties not bound with `wire:model`
- [ ] Validation applied before using bound data for business logic
