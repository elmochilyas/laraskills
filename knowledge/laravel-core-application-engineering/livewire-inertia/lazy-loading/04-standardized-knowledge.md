# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Lazy Loading |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

Livewire's lazy loading defers component initialization until the component enters the browser viewport or when explicitly triggered. Using `#[Lazy]` attribute on a component class, the initial render returns placeholder HTML (usually a loading skeleton). When the placeholder becomes visible (Intersection Observer), Livewire makes an AJAX request to fully initialize and render the component. The engineering value is initial page load performance — heavy components with expensive queries are not loaded until needed.

---

## Core Concepts

- **`#[Lazy]` attribute**: Marks a component for deferred initialization
- **`placeholder()` method**: Returns the HTML shown before the component fully loads
- **Intersection Observer**: Browser API detects when placeholder enters viewport
- **`mount()` deferral**: `mount()` is NOT called during initial render — only after lazy load trigger
- **Placeholder rendering**: Runs in initial page render with only constructor dependencies — `mount()` hasn't run yet

---

## When To Use

- Heavy components with expensive database queries in `mount()`
- Components below the fold that aren't visible on initial page load
- Dashboard widgets that load data from external APIs
- Tab panels where content is loaded only when the tab is active
- Modals that load data only when opened

## When NOT To Use

- Components above the fold that are immediately visible
- Lightweight components with trivial mount() methods
- Components that need to be interactive immediately on page load
- Components whose data is needed for initial page layout (content shift would be disruptive)

---

## Best Practices

- **Always provide a `placeholder()` method** — shows a loading skeleton matching the component's dimensions
- **Use placeholder that matches final component height** — prevents layout shift when the real component loads
- **Place lazy-loaded components below the fold** — above-the-fold content should load immediately
- **Use `#[Lazy]` on dashboard widgets** — each widget loads independently, reducing initial page weight
- **Consider nested lazy loading** — parent lazy component can contain child lazy components
- **Test with slow network** — verify placeholders render correctly and components load in expected order

---

## Architecture Guidelines

- `#[Lazy]` attribute on component class
- `placeholder()` method returns a View or string — runs during initial page render
- Intersection Observer triggers AJAX request when placeholder enters viewport
- On lazy load: `boot()` → `mount()` → `booted()` → `rendering()` → render → `rendered()`
- Placeholder has access to component's constructor dependencies but NOT to mount() data
- Lazy components can receive props from parent: `<livewire:heavy :post="$post" />`

---

## Performance

Lazy loading significantly improves initial page load performance by deferring expensive component initialization. Each lazy component makes a separate AJAX request when it becomes visible. The total page weight is reduced because expensive queries and heavy templates are deferred. For pages with many lazy components, they load in parallel as they enter the viewport.

---

## Security

Lazy-loaded components go through the same Livewire lifecycle as normal components — checksum verification, authorization, and validation all apply. Props passed to lazy components are serialized and sent to the frontend as part of the initial page snapshot. Avoid passing sensitive data as props to lazy components.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No placeholder method | Forgetting to define it | Blank space until component loads | Always provide a placeholder |
| Placeholder different height than component | Mismatched dimensions | Layout shift when component loads | Match placeholder to final component size |
| Lazy loading above-the-fold content | Over-optimizing | Flash of placeholder in viewport | Only lazy-load below-the-fold |
| Expensive queries in placeholder() | Misunderstanding lifecycle | Slow initial page render | Keep placeholder lightweight |
| Props with large data to lazy component | Passing heavy data via props | Large initial snapshot | Pass IDs, fetch data in mount() |

---

## Anti-Patterns

- **Above-the-fold lazy loading**: Users see placeholders instead of content
- **Placeholder without styling**: Raw text or unstyled elements during loading
- **Lazy component that never triggers**: No Intersection Observer fallback for non-supporting browsers
- **All components lazy**: Adds unnecessary AJAX requests for lightweight components

---

## Examples

**Lazy component declaration:**
```php
use Livewire\Attributes\Lazy;

#[Lazy]
class HeavyDashboard extends Component
{
    public function mount(): void
    {
        $this->stats = $this->computeExpensiveStats();
    }

    public function placeholder(): View
    {
        return view('livewire.placeholders.dashboard');
    }
}
```

**Placeholder template:**
```blade
{{-- resources/views/livewire/placeholders/dashboard.blade.php --}}
<div class="animate-pulse">
    <div class="h-32 bg-gray-200 rounded"></div>
    <div class="h-64 bg-gray-200 rounded mt-4"></div>
</div>
```

**Usage in Blade:**
```blade
{{-- This component loads immediately --}}
<livewire:header />

{{-- This component loads lazily when scrolled into view --}}
<div class="mt-8">
    <livewire:heavy-dashboard :user="$user" :key="'dashboard-'.$user->id" />
</div>
```

---

## Related Topics

- livewire/component-architecture — Component fundamentals
- livewire/lifecycle-hooks — mount() deferral behavior
- livewire/islands-pattern — Lazy islands in static pages
- livewire/loading-states — Placeholder loading indicators

---

## AI Agent Notes

- `#[Lazy]` attribute defers component initialization until viewport visibility
- `placeholder()` returns the HTML shown before the component fully loads
- `mount()` is NOT called during initial render — only during lazy load
- Intersection Observer API triggers the lazy load
- Placeholder has access to constructor dependencies but not mount() results
- Lazy components can receive props from parent components
- Multiple lazy components load in parallel as they enter viewport

---

## Verification

- [ ] Heavy components use `#[Lazy]` attribute
- [ ] Placeholder method returns meaningful loading skeleton
- [ ] Placeholder dimensions match final component height
- [ ] Above-the-fold content loads immediately (not lazy)
- [ ] Props to lazy components are lightweight (IDs, not full models)
- [ ] No expensive operations in placeholder()
- [ ] Layout shift minimized when lazy components load
- [ ] Lazy loading works on slow network
