# Livewire Component Architecture

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Component Architecture
- **Difficulty Level:** Foundation
- **Last Updated:** 2026-06-02

---

## Executive Summary

A Livewire component pairs a PHP class (component logic, state, actions) with a Blade template (HTML rendering). The component class defines public properties (reactive state), methods (actions triggered by the frontend), and lifecycle hooks. Livewire's JavaScript layer synchronizes component state with the server via AJAX, re-rendering the component's HTML when state changes.

The engineering value is building dynamic, interactive UIs without writing JavaScript. The component is a self-contained unit of server-state and rendered HTML. Changes to public properties trigger automatic re-rendering. This eliminates the need for separate API endpoints, client-side state management, and manual DOM updates.

---

## Core Concepts

### Component Definition

A Livewire component extends `Livewire\Component`:

```php
namespace App\Livewire;

use Livewire\Component;

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

### Component Template

The corresponding Blade template:

```blade
<div>
    <h1>{{ $count }}</h1>
    <button wire:click="increment">+</button>
</div>
```

### Component Registration

Components are auto-discovered in `app/Livewire/` and registered via `Livewire::component()`:

```php
// Auto-discovered: app/Livewire/Counter.php → livewire.counter
// Manual registration:
Livewire::component('counter', Counter::class);
```

---

## Mental Models

### The Server-Side Widget

A Livewire component is a server-rendered widget embedded in a Blade page. The widget maintains its own state on the server. When the user interacts with the widget (button click, input change), the interaction is sent to the server, the widget updates its state, and the server returns fresh HTML for the widget.

### The Autosyncing Form

Think of Livewire as a form that automatically synchronizes with the server. Each `wire:model` is a two-way binding: when the user types, the server property updates. When the server property changes, the input value updates.

---

## Internal Mechanics

### Hydration and Dehydration

Livewire serializes component state between requests:

```
Initial render: Component rendered with initial state → HTML sent to browser
    ↓
User interaction → AJAX request to server → Component dehydrated (serialized) → Sent to server
    ↓
Server hydrates (deserializes) component → Executes action → Re-renders → Dehydrates → Returns HTML
    ↓
Livewire JavaScript diffs the HTML and updates the DOM
```

### Component ID

Each component instance receives a unique `$__id` for tracking. Multiple instances of the same component on a page each have their own state.

### render() Method

The `render()` method returns the component's Blade view. Public properties of the component class are automatically available in the view as variables.

---

## Patterns

### Full-Page Components

Livewire components can serve as full-page controllers:

```php
class ShowUsers extends Component
{
    public function render(): View
    {
        return view('livewire.show-users')
            ->layout('layouts.app')
            ->title('Users');
    }
}

// Route: Route::get('/users', ShowUsers::class);
```

### Nested Components

Components can embed other components:

```blade
<div>
    <h1>User List</h1>
    @foreach ($users as $user)
        <livewire:user-card :user="$user" :key="$user->id" />
    @endforeach
</div>
```

Each nested component has its own state and lifecycle.

### Component with Dependency Injection

Components receive dependencies via constructor injection:

```php
class UserList extends Component
{
    public function __construct(
        private UserService $users,
    ) {
        // This is called on every request (hydration + initial render)
    }

    public function render(): View
    {
        return view('livewire.user-list', [
            'users' => $this->users->recent(),
        ]);
    }
}
```

---

## Architectural Decisions

### Livewire vs Full-Page Component vs Controller

| Concern | Livewire Component | Controller + View |
|---|---|---|
| Interactive state | Built-in (public properties) | Form submissions only |
| Real-time validation | Automatic (wire:model.lazy) | Manual validation |
| DOM updates | Automatic (diffs) | Full page reload |
| Complexity per page | Medium | Low |
| Reusability | High (components) | Medium (partials) |

Livewire adds interactivity. Use controllers for mostly static pages. Use Livewire for interactive sections.

### Component Size Threshold

| Component Size | Complexity | Recommendation |
|---|---|---|
| < 100 lines | Simple UI (counter, toggle) | Single component |
| 100-300 lines | Medium form or list | Single component |
| 300-500 lines | Complex UI | Consider splitting |
| > 500 lines | Overgrown component | Must split |

---

## Tradeoffs

| Concern | Livewire | Vue/React + API |
|---|---|---|
| JavaScript required | Minimal (Livewire.js) | Full JS framework |
| Server load | Higher (re-renders on interaction) | Lower (API-only) |
| Real-time feedback | Fast (AJAX round-trip) | Instant (client-side) |
| Development speed | Fast (all PHP) | Slower (two codebases) |
| Testing | PHPUnit integration | Jest/Cypress |

---

## Performance Considerations

Each Livewire interaction (click, input) sends an AJAX request and re-renders the component. Typical round-trip: 50-200ms for a simple component. Complex components with database queries can take 500ms+.

### Component Rendering Overhead

A single Livewire component renders in ~1-5ms (similar to a normal Blade view). The overhead is:
- Hydration: ~0.1ms
- Action execution: variable (user code)
- Re-rendering: ~1-5ms
- Dehydration: ~0.1ms
- Network: 20-100ms

---

## Production Considerations

### Use Key for Looped Components

When rendering components in a loop, provide a unique `:key`:

```blade
@foreach ($users as $user)
    <livewire:user-card :user="$user" :key="$user->id" />
@endforeach
```

The key allows Livewire to track individual component instances.

### Avoid Heavy Queries in render()

The `render()` method runs on every component update. Cache expensive queries:

```php
public function render(): View
{
    $users = cache()->remember('all_users', 300, fn() => User::all());
    return view('livewire.user-list', compact('users'));
}
```

---

## Failure Modes

### Component Not Found

If Livewire cannot resolve a component from a `<livewire:name>` tag or route, it throws a `ComponentNotFoundException`. Ensure the component class exists in `app/Livewire/` and is auto-discovered or manually registered.

### State Corruption from Missing Keys

Rendering the same component type in a loop without unique `:key` attributes causes state tracking issues. Livewire may reuse the incorrect component instance, leading to stale or corrupted state across iterations.

---

## Common Mistakes

### Modifying Public Properties Outside Actions

```php
// Bad — calling external service that modifies public property
public function save(): void
{
    $this->service->process($this); // External code modifies $this->count
}

// Good — action explicitly sets the property
public function save(): void
{
    $this->count = $this->service->calculate();
}
```

Livewire tracks changes via the component's action methods, not via external property modification.

---

## Ecosystem Usage

Livewire component architecture integrates with Laravel's service container for dependency injection, Blade for templating, and Alpine.js for client-side behavior. Components auto-discover from `app/Livewire/` and can use Laravel features like authorization gates, events, and caching.

## Related Knowledge Units

- **Data Binding** (this workspace) — wire:model mechanics
- **Actions and Events** (this workspace) — wire:click, wire:submit
- **Lifecycle Hooks** (this workspace) — mount, hydrate, boot, updating, updated
- **Testing** (this workspace) — component testing

---

## Research Notes

- Livewire v3 uses Alpine.js under the hood for DOM diffing and event handling
- Component auto-discovery scans `app/Livewire/` and maps directory structure to component names
- Each component instance is tracked by a unique `id` and a checksum for security
- The component's `$this->all()` returns all public properties for serialization
