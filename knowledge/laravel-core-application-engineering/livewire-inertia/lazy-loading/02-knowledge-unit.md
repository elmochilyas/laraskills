# Livewire Lazy Loading

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Lazy Loading
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Livewire's lazy loading defers component initialization until the component enters the browser viewport or when explicitly triggered. Using `#[Lazy]` attribute on a component class, the initial render returns placeholder HTML (usually a loading skeleton). When the placeholder becomes visible (Intersection Observer), Livewire makes an AJAX request to fully initialize and render the component.

The engineering value is initial page load performance. Heavy components with expensive queries are not loaded until needed. The page's initial render is fast because it only includes the lightweight placeholder. Components below the fold (or in tabs/modals) are loaded lazily without JavaScript Intersection Observer code.

---

## Core Concepts

### Lazy Component Declaration

```php
use Livewire\Attributes\Lazy;

#[Lazy]
class HeavyDashboard extends Component
{
    public array $stats = [];

    public function mount(): void
    {
        $this->stats = $this->computeExpensiveStats();
    }
}
```

### Placeholder Template

The `placeholder()` method returns the HTML shown before the component loads:

```php
#[Lazy]
class HeavyDashboard extends Component
{
    public function placeholder(): View
    {
        return view('livewire.placeholders.dashboard');
    }
}
```

```blade
{{-- livewire/placeholders/dashboard.blade.php --}}
<div class="animate-pulse">
    <div class="h-32 bg-gray-200 rounded"></div>
    <div class="h-64 bg-gray-200 rounded mt-4"></div>
</div>
```

---

## Mental Models

### The Above-the-Fold Priority

Lazy loading prioritizes what the user can see. The initial page load renders only the content visible in the viewport. Components below the fold load after the initial render, when the user scrolls to them.

### The Postpone Button

Think of `#[Lazy]` as a "postpone" sign on a component. The component says "I'll load later, when you need me." The placeholder is a simple sign until the real component arrives.

---

## Internal Mechanics

### Intersection Observer

Livewire uses the browser's Intersection Observer API to detect when the placeholder element enters the viewport. When it does:

1. Placeholder is visible
2. Livewire JavaScript sends an AJAX request to initialize the component
3. Component's `mount()` method runs
4. Full component HTML is rendered
5. Placeholder is replaced with the full component

### Placeholder Rendering

The `placeholder()` method is called on the initial page render. It runs in the context of the component class but has access only to the component's constructor dependencies — `mount()` has NOT been called yet.

---

## Patterns

### Loading Skeleton

```php
#[Lazy]
class UserList extends Component
{
    public array $users = [];

    public function mount(): void
    {
        // Expensive query
        $this->users = User::with('orders.profile')->latest()->take(100)->get()->toArray();
    }

    public function placeholder(): View
    {
        return view('livewire.placeholders.user-list');
    }
}
```

```blade
{{-- Placeholder --}}
<div class="space-y-4 animate-pulse">
    @for ($i = 0; $i < 5; $i++)
        <div class="h-16 bg-gray-200 rounded"></div>
    @endfor
</div>
```

### Tab-Based Lazy Loading

Load component content only when tab is active:

```blade
<div x-data="{ tab: 'profile' }">
    <button @click="tab = 'profile'">Profile</button>
    <button @click="tab = 'orders'">Orders</button>

    <div x-show="tab === 'profile'">
        <livewire:user-profile :user="$user" />
    </div>

    <div x-show="tab === 'orders'">
        {{-- This lazy component loads only when the tab becomes visible --}}
        <livewire:user-orders :user="$user" wire:key="orders-{{ $user->id }}" />
    </div>
</div>
```

### Modal Lazy Loading

Load component inside a modal only when modal opens:

```blade
<div x-data="{ open: false }">
    <button @click="open = true">Edit User</button>

    <div x-show="open" @click.away="open = false">
        {{-- This component loads only when modal opens --}}
        @if ($open)
            <livewire:edit-user :user="$user" wire:key="edit-{{ $user->id }}" />
        @endif
    </div>
</div>
```

---

## Architectural Decisions

### Lazy vs Eager Components

| Concern | Lazy | Eager |
|---|---|---|
| Initial page load | Fast (placeholder only) | Full component included |
| Subsequent load | AJAX round-trip delay | None (already rendered) |
| Server load | Staggered (spread across requests) | All at once |
| UX | Placeholder → content transition | Content immediately |
| Use case | Below-fold, heavy components | Above-fold, lightweight |

### When to Use Lazy

- Components with expensive queries (dashboards, reports)
- Components below the fold (long pages)
- Tab/modal content (not immediately visible)
- Heavy third-party integrations (charts, maps)

---

## Tradeoffs

| Concern | Lazy | Non-Lazy | Paginated |
|---|---|---|---|
| Initial HTML size | Small (placeholder) | Large (full content) | Medium |
| Perceived load time | Fast (above-fold renders first) | Slow (everything loads at once) | Medium |
| Server capacity | Staggered requests | Concurrent | Sequential |
| UX smoothness | Placeholder flicker | No flicker | Page navigation |

---

## Performance Considerations

Lazy loading reduces initial page size and server load. The tradeoff is additional HTTP requests. For a page with 5 lazy components, the initial request is fast but 5 subsequent requests are made as the components load.

### Network Impact

```
Without lazy:  1 request, 500KB HTML, 200ms server time
With lazy:     1 request, 50KB HTML (placeholders), 20ms server time
               + 5 requests, 100KB each, 100ms each = 500ms total
```

Lazy loading is beneficial when the total server time is spread across requests and the user sees the above-fold content sooner.

---

## Production Considerations

### Always Provide a Placeholder

A component without a `placeholder()` method uses a default blank placeholder. Always define a loading skeleton that matches the component's layout to prevent layout shift.

### Use wire:key for Lazy Components

When lazy components are rendered in loops or conditionally, provide a stable `wire:key`:

```blade
<livewire:heavy-card :post="$post" wire:key="card-{{ $post->id }}" />
```

### Test Lazy Components

```php
public function test_lazy_component_loads()
{
    Livewire::test(HeavyDashboard::class)
        ->assertSee('placeholder'); // Placeholder shown initially

    // Trigger lazy load
    Livewire::test(HeavyDashboard::class)
        ->call('loadLazy') // Or wait for Intersection Observer
        ->assertSee('stats');
}
```

---

## Common Mistakes

### Mount-Side Effects in Lazy Components

The `mount()` method runs when the component actually loads (not at page render). Side effects in `mount()` (dispatching events, modifying session) occur at load time, which may be minutes after the page renders.

### Lazy Components Without Keys

Lazy components in loops without `wire:key` cause state tracking issues. Always provide unique keys.

---

## Failure Modes

### Layout Shift

Without a properly sized placeholder, lazy components cause layout shift when they load. The placeholder should match the component's likely dimensions.

### Slow Placeholder Load

If the placeholder itself is slow to render (database query, complex logic), the benefit of lazy loading is reduced. Keep placeholder rendering fast.

---

## Ecosystem Usage

Lazy loading in Livewire uses the `#[Lazy]` attribute and Alpine.js's `x-intersect` under the hood via Intersection Observer. It integrates with Livewire's component system, placeholder views, and the broader ecosystem of performance optimization tools like Lighthouse and Web Vitals.

## Related Knowledge Units

- **Component Architecture** (this workspace) — component initialization
- **Islands Pattern** (this workspace) — lazy loading for islands
- **Lifecycle Hooks** (this workspace) — mount() in lazy context

---

## Research Notes

- `#[Lazy]` attribute was introduced in Livewire v3
- The Intersection Observer-based detection is automatic — no configuration needed
- Lazy components use Alpine.js's `x-intersect` under the hood
- The `placeholder()` method returns a view or HTML string; no component state is available
