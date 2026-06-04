# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Component Architecture |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

A Livewire component pairs a PHP class (component logic, state, actions) with a Blade template (HTML rendering). The component class defines public properties (reactive state), methods (actions triggered by the frontend), and lifecycle hooks. Livewire's JavaScript layer synchronizes component state with the server via AJAX, re-rendering the component's HTML when state changes. The engineering value is building dynamic, interactive UIs without writing JavaScript.

---

## Core Concepts

- **Component class**: Extends `Livewire\Component`, defines public properties and action methods
- **Component template**: Blade view rendered by the `render()` method
- **Hydration/Dehydration**: Component state serialized between requests — sent to browser, deserialized on server, re-rendered
- **Component ID**: Each instance receives a unique `$__id` for tracking multiple instances on the same page
- **Auto-discovery**: Components in `app/Livewire/` auto-registered; manual registration via `Livewire::component()`

---

## When To Use

- Dynamic, interactive UI elements that require server-side logic
- Forms with real-time validation, search-as-you-type, live updates
- Admin panels, dashboards, and CRUD interfaces
- Any page where you want interactivity without writing JavaScript

## When NOT To Use

- Completely static content (use plain Blade)
- Highly interactive UIs with drag-drop, canvas, or complex client state
- Pages where SEO is critical (initial HTML is JS-dependent for rendering)

---

## Best Practices

- **One component per concern** — a component should represent one UI widget or page section
- **Keep public properties typed** — use PHP 8+ type declarations for all public properties
- **Use `#[Computed]` for derived properties** — cache expensive computed values within a request
- **Separate presentation from logic** — keep Blade templates focused on HTML, not complex logic
- **Use `render()` to return a view** — the render method can pass additional data to the template
- **Name components consistently** — kebab-case for Blade tags: `<livewire:user-profile />`

---

## Architecture Guidelines

- Components in `app/Livewire/` (default) or `app/Http/Livewire/` (Legacy)
- Template in `resources/views/livewire/` matching component name
- Component registration: auto-discovered or `Livewire::component('name', Class::class)`
- Full-page components: Route returns component class directly: `Route::get('/counter', Counter::class)`
- Inline components: `render()` returns a string (no separate template file)
- Nested components: Embed `<livewire:child-component>` in parent's template

---

## Performance

Livewire uses AJAX for every interaction — each `wire:click` or `wire:model` update sends a request. Minimize component size to reduce payload. Use `#[Lazy]` for expensive components. Use `wire:model.defer` to batch updates. The hydration/dehydration cycle adds ~5-50ms per interaction depending on component complexity.

---

## Security

Livewire uses checksum verification to prevent tampered component state. Public properties with `#[Rule]` attributes are validated before updates. Never store sensitive data (passwords, tokens, API keys) in public properties without `#[Volatile]`. CSRF protection applies to all Livewire requests.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Large component with many properties | Monolithic component | Slow hydration, large payloads | Split into smaller components |
| Not using type hints | PHP 7-style properties | Runtime type errors | Always declare typed properties |
| Sensitive data in public properties | Storing tokens in public | Sent to frontend in snapshot | Use `#[Volatile]` for sensitive data |
| Too many nested components | Deep component hierarchy | Performance overhead | Flatten where possible |
| No `#[Computed]` for expensive getters | Recomputing on every render | Slow renders | Cache with `#[Computed]` |

---

## Anti-Patterns

- **Controller logic in Livewire**: 500-line component class — extract services/actions
- **God component**: A single component handling the entire page — split into widgets
- **Sensitive state not marked volatile**: API keys, tokens exposed in the HTML snapshot
- **No separation of concerns**: Database queries mixed with rendering logic

---

## Examples

**Basic component:**
```php
class Counter extends Component
{
    public int $count = 0;

    public function increment(): void
    {
        $this->count++;
    }

    public function render(): View
    {
        return view('livewire.counter');
    }
}
```

**Blade template:**
```blade
<div>
    <h1>{{ $count }}</h1>
    <button wire:click="increment">+</button>
</div>
```

**Full-page component route:**
```php
Route::get('/counter', App\Livewire\Counter::class);
```

**Component with computed property:**
```php
class UserDashboard extends Component
{
    public User $user;

    #[Computed]
    public function recentOrders()
    {
        return Order::where('user_id', $this->user->id)
            ->latest()
            ->take(5)
            ->get();
    }
}
```

---

## Related Topics

- livewire/data-binding — Property synchronization with wire:model
- livewire/actions-events — Triggering server methods
- livewire/lifecycle-hooks — Component lifecycle interception
- livewire/loading-states — Visual feedback during interactions
- livewire/testing — Testing Livewire components

---

## AI Agent Notes

- Components auto-discovered in `app/Livewire/` — no manual registration needed
- Each component instance has a unique `$__id` for tracking
- Hydration: deserializes component state from the frontend snapshot
- Dehydration: serializes component state before sending to frontend
- Full-page components return the component class directly from routes
- The `#[Computed]` attribute caches derived data within a single request

---

## Verification

- [ ] Components in `app/Livewire/` directory
- [ ] Templates in `resources/views/livewire/`
- [ ] Public properties have PHP type declarations
- [ ] Sensitive data marked `#[Volatile]`
- [ ] Component split at appropriate granularity
- [ ] `render()` returns a View instance
- [ ] No controller logic in component class
- [ ] `#[Computed]` used for expensive derived properties
