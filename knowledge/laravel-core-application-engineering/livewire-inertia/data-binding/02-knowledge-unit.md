# Livewire Data Binding

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Data Binding
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire data binding connects public PHP properties to HTML form inputs via `wire:model`. When the user updates the input, the PHP property updates automatically. When the PHP property changes, the input value updates. This is bidirectional, server-driven data binding — the source of truth is the PHP property on the server.

The engineering value is real-time synchronization without client-side JavaScript. Form inputs, checkboxes, selects, and textareas automatically stay in sync with the server. The developer writes PHP code to handle state changes, not JavaScript event listeners.

---

## Core Concepts

### Basic Binding

```php
class SearchUsers extends Component
{
    public string $search = '';
    public array $results = [];

    public function updatedSearch(): void
    {
        $this->results = User::where('name', 'like', "%{$this->search}%")->take(10)->get()->toArray();
    }
}
```

```blade
<input wire:model="search" placeholder="Search users...">
```

### Modifiers

| Modifier | Behavior |
|---|---|
| `wire:model.debounce.500ms` | Wait 500ms after last keystroke before syncing |
| `wire:model.lazy` | Sync on change/blur, not on every keystroke |
| `wire:model.defer` | Sync only on component action (submit, click) |
| `wire:model.number` | Cast value to number |
| `wire:model.boolean` | Cast value to boolean |

### Supported Input Types

All standard HTML inputs: text, textarea, select, checkbox, radio, file.

---

## Mental Models

### The Server-Side Ref

Think of `wire:model="property"` as a remote reference to the server-side property. Changes in the input update the reference remotely. Reads from the reference return the latest server value. The developer never touches JavaScript — they just read/write PHP properties.

### The Auto-Submit Form

`wire:model` is like a form that auto-submits on every keystroke (with debounce). Behind the scenes, Livewire sends the updated value to the server, updates the property, and re-renders the component.

---

## Internal Mechanics

### Value Synchronization

When `wire:model` input changes:

1. Livewire JavaScript captures the input event
2. After debounce (if configured), sends AJAX request with `{ property: value, componentId, checksum }`
3. Server calls `$component->$property = $value`
4. If `updated<PropertyName>()` hook exists, it executes
5. Component re-renders
6. HTML diff is sent back; DOM is updated

### The deferred Property

`wire:model.defer` does NOT sync until a component action (click, submit) triggers it. The value is collected and sent with the action request. This reduces AJAX requests for forms where real-time feedback is not needed.

---

## Patterns

### Search-as-You-Type

Real-time search with debounce:

```php
class SearchUsers extends Component
{
    public string $search = '';
    public array $results = [];

    public function updatedSearch(): void
    {
        $this->results = User::search($this->search)->take(10)->get()->toArray();
    }

    public function render(): View
    {
        return view('livewire.search-users');
    }
}
```

```blade
<input wire:model.debounce.300ms="search" placeholder="Search...">

<ul>
    @foreach ($results as $user)
        <li>{{ $user['name'] }}</li>
    @endforeach
</ul>
```

### Form with Deferred Binding

Collect all values before submitting:

```php
class CreateUser extends Component
{
    public string $name = '';
    public string $email = '';
    public string $password = '';

    protected $rules = [
        'name' => 'required|string|min:3',
        'email' => 'required|email|unique:users',
        'password' => 'required|min:8',
    ];

    public function save(): void
    {
        $this->validate();
        User::create($this->only(['name', 'email', 'password']));
        $this->redirect('/users');
    }
}
```

```blade
<form wire:submit="save">
    <input wire:model.defer="name">
    <input wire:model.defer="email">
    <input wire:model.defer="password" type="password">
    <button type="submit">Create</button>
</form>
```

### Computed Properties via Method Binding

Display computed values without JavaScript:

```php
public function getTotalProperty(): float
{
    return array_sum(array_column($this->items, 'price'));
}
```

```blade
<p>Total: ${{ $this->total }}</p>
```

---

## Architectural Decisions

### wire:model.lazy vs wire:model.debounce

| Concern | lazy | debounce |
|---|---|---|
| Sync trigger | Blur/change | Last keystroke + delay |
| Use case | Select menus, checkboxes | Text search input |
| Server requests | 1 per interaction | 1 per typing pause |

### wire:model vs wire:model.defer

Use `wire:model.defer` for all form fields that don't need real-time feedback. Use `wire:model` only for fields that trigger immediate responses (search, dependent selects, live preview).

---

## Tradeoffs

| Concern | wire:model (realtime) | wire:model.defer | Plain HTML form |
|---|---|---|---|
| Server requests | Many (per keystroke/change) | Few (on action) | 1 (on submit) |
| Client feedback | Real-time | After submit | After submit |
| Validation | Real-time (updated hook) | Batch (on submit) | Batch (on submit) |
| Complexity | Low | Low | Lowest |

---

## Performance Considerations

Each `wire:model` sync triggers a full component re-render. For forms with 10+ realtime bindings, throttle or debounce aggressively. Use `wire:model.defer` for most fields to reduce requests.

---

## Production Considerations

### Always Cast Boolean

Checkboxes with `wire:model` require explicit boolean casting:

```php
public bool $agreeToTerms = false;
```

```blade
<input type="checkbox" wire:model="agreeToTerms">
```

### Validate on Deferred Submit

When using `wire:model.defer`, validate in the action method:

```php
public function save(): void
{
    $this->validate(); // Runs validation on all deferred properties
    // ... persist
}
```

---

## Failure Modes

### Rapid Input Flood

Multiple rapid keystrokes on a `wire:model` input without debounce can trigger a flood of AJAX requests, overwhelming the server. Always use `.debounce` for text inputs or `.lazy` for blur-triggered sync.

### Property Type Mismatch

A bound property is declared as `string` but receives a numeric value from the input. Livewire may coerce the type inconsistently. Use explicit type declarations and the `.number` or `.boolean` modifier for accurate type handling.

---

## Common Mistakes

### Forgetting to Initialize Properties

Uninitialized public properties are null. Initialize all bound properties:

```php
public string $name = '';   // Empty string, not null
public int $age = 0;        // Number, not null
public bool $active = false; // Boolean, not null
```

### Binding to Non-Public Properties

Livewire only binds to `public` properties. Protected or private properties are not serialized and will not update.

---

## Ecosystem Usage

Data binding in Livewire integrates with Blade templates, Alpine.js, and all standard HTML input types. The `wire:model` directive works with Livewire's component lifecycle and validation system. Modifiers like `.debounce`, `.lazy`, `.defer`, `.number`, and `.boolean` provide fine-grained control over sync behavior.

## Related Knowledge Units

- **Component Architecture** (this workspace) — component structure
- **Validation** (this workspace) — real-time and deferred validation
- **Actions and Events** (this workspace) — wire:click and wire:submit
- **Volatile Properties** (this workspace) — non-persistent state

---

## Research Notes

- Livewire v3 changed `wire:model` to be lazy by default for most inputs
- The `updated<PropertyName>()` hook is called AFTER the property is set
- The number modifier (`wire:model.number`) casts to JavaScript's number type before sending
- Boolean modifier (`wire:model.boolean`) is essential for checkbox handling in Livewire v3
