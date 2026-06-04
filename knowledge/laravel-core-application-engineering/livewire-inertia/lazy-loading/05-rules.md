## Rule: Always Provide a Placeholder Method

Every lazy-loaded component must define a `placeholder()` method that returns a meaningful loading UI.

---

## Category

Framework Usage

---

## Rule

Add a `public function placeholder(): View` method to every component marked with `#[Lazy]`. Return a Blade view that shows a loading skeleton matching the component's dimensions and layout.

---

## Reason

Without a `placeholder()` method, Livewire renders an empty `<div>` in place of the lazy component until it loads. The user sees an empty, zero-height blank space that provides no indication that content is loading. A proper placeholder with skeleton styles signals to the user that the page is still loading content and prevents layout shift when the real component arrives.

---

## Bad Example

```php
#[Lazy]
class HeavyDashboard extends Component
{
    // No placeholder method — empty div shown while loading
}
```

---

## Good Example

```php
#[Lazy]
class HeavyDashboard extends Component
{
    public function placeholder(): View
    {
        return view('livewire.placeholders.dashboard-stats');
    }
}
```

---

## Exceptions

If the lazy component is inside a loading container that already shows a skeleton (e.g., a parent component handles all loading states), the placeholder may return an empty string. Document this dependency.

---

## Consequences Of Violation

UX: blank empty space while component loads. Layout shift: content jumps when component finally renders.

---

## Rule: Match Placeholder Dimensions to Component

Design the placeholder with the same height and approximate layout as the fully loaded component.

---

## Category

UX

---

## Rule

Set explicit `height` and `width` CSS on placeholder elements that match the real component's dimensions. Use the same grid layout, padding, and alignment. Test across breakpoints to ensure alignment matches.

---

## Reason

A placeholder that is significantly shorter or taller than the real component causes layout shift when the component loads. The shift is jarring for the user, especially if they are reading or interacting with nearby content when the shift occurs. Matching dimensions eliminates this shift entirely.

---

## Bad Example

```blade
{{-- Placeholder: 50px height --}}
<div class="h-12 bg-gray-200 rounded"></div>

{{-- Real component: 400px height --}}
<div class="grid grid-cols-3 gap-4">
    @foreach ($stats as $stat)
        <div class="card">...</div>
    @endforeach
</div>
```

---

## Good Example

```blade
{{-- Placeholder matches real component's 400px height and 3-column grid --}}
<div class="grid grid-cols-3 gap-4">
    @foreach (range(1, 3) as $col)
        <div class="h-96 bg-gray-200 rounded animate-pulse"></div>
    @endforeach
</div>
```

---

## Exceptions

For components with variable-height content (e.g., a comments feed), use a minimum height that represents the typical loaded state and accept minor shifts as new comments are added.

---

## Consequences Of Violation

UX: jarring layout shift when component loads. Performance perception: page appears unstable.

---

## Rule: Only Lazy-Load Below-the-Fold Content

Components that are visible in the initial viewport must load eagerly, not lazily.

---

## Category

Performance

---

## Rule

Identify which components are visible without scrolling (above the fold). Do not apply `#[Lazy]` to these components. Reserve lazy loading for components below the fold, in accordions, in tabs, or inside modals.

---

## Reason

A lazy component above the fold shows a placeholder instead of content when the page loads. The user sees loading skeletons in the main content area immediately — this makes the page feel slow even if the total load time is lower. Above-the-fold content should render immediately to create the perception of a fast page.

---

## Bad Example

```blade
{{-- Header is above the fold — should not be lazy --}}
<livewire:header :user="$user" />

{{-- Hero section is above the fold — should not be lazy --}}
<livewire:hero-section />
```

---

## Good Example

```blade
{{-- Above the fold — eager --}}
<livewire:header :user="$user" />

{{-- Below the fold — lazy is appropriate --}}
<div class="mt-16">
    <livewire:heavy-dashboard :user="$user" />
</div>
```

---

## Exceptions

If an above-the-fold component is extremely expensive (multiple seconds to render) and its data is not critical for first paint, consider lazy loading but mitigate with an immediate prefetch trigger and a visible placeholder.

---

## Consequences Of Violation

UX: user sees loading placeholders in the main viewing area. Performance perception: page feels slow despite good technical metrics.

---

## Rule: Keep Placeholder Methods Lightweight

The `placeholder()` method must never perform expensive queries, API calls, or heavy computations.

---

## Category

Performance

---

## Rule

Restrict `placeholder()` to returning a static or nearly static view. Do not query the database, call external APIs, or perform any computation that takes more than 1ms. If you need dynamic placeholder text (e.g., the user's name), pass it as a prop from the parent.

---

## Reason

The `placeholder()` method is executed during the INITIAL page render, before the component is lazy-loaded. If `placeholder()` performs a database query, that query runs on every page load for every user, entirely defeating the purpose of lazy loading. The entire benefit of `#[Lazy]` is to defer expensive operations — if the placeholder is expensive, nothing is deferred.

---

## Bad Example

```php
#[Lazy]
class HeavyDashboard extends Component
{
    public function placeholder(): View
    {
        $count = Order::count(); // Expensive query on every page load!
        return view('livewire.placeholders.dashboard', ['count' => $count]);
    }
}
```

---

## Good Example

```php
#[Lazy]
class HeavyDashboard extends Component
{
    public function placeholder(): View
    {
        return view('livewire.placeholders.dashboard');
        // Static skeleton — no queries
    }
}
```

---

## Exceptions

If the placeholder must display the user's name or avatar (e.g., a personalized greeting skeleton), pass these as props to the lazy component: `<livewire:greeting :user-name="$user->name" />`. Access them in the placeholder via `$this->userName`.

---

## Consequences Of Violation

Performance risks: placeholder queries negate lazy loading benefits. Scalability risks: expensive queries on every page load.

---

## Rule: Pass Lightweight Props to Lazy Components

Pass only primitive values or IDs to lazy components. Fetch the full data inside `mount()`.

---

## Category

Performance

---

## Rule

When passing props to a lazy component, pass scalar values (IDs, strings, booleans) rather than full Eloquent models or large arrays. The lazy component fetches the associated data in its `mount()` method after the lazy load triggers.

---

## Reason

Props passed to lazy components are serialized in the initial page snapshot and sent to the frontend. Even though the component initializes lazily, the props are included in the initial payload. Passing a full `$post` model with all its relationships defeats the payload reduction benefit of lazy loading.

---

## Bad Example

```blade
{{-- Full post model serialized in initial page snapshot --}}
<livewire:comments :post="$post" :key="$post->id" />
```

---

## Good Example

```blade
{{-- Only the ID is in the initial snapshot --}}
<livewire:comments :post-id="$post->id" :key="$post->id" />
```

```php
#[Lazy]
class Comments extends Component
{
    public int $postId;

    public function mount(): void
    {
        $this->post = Post::findOrFail($this->postId); // Fetched on lazy load
    }
}
```

---

## Exceptions

If the parent view already needs the data for rendering and passing it to the lazy component is free (no additional serialization cost), passing the full data is acceptable.

---

## Consequences Of Violation

Performance risks: serialized model data inflates initial payload. Payload bloat: lazy component props included even before lazy load.

---

## Rule: Never Lazy All Components

Do not mark every component on a page as `#[Lazy]`. Reserve lazy loading for genuinely expensive below-the-fold components.

---

## Category

Performance

---

## Rule

Before applying `#[Lazy]`, measure the component's render time and payload size. Only lazy components whose initial render would add more than 100ms or 50KB to the page response. Lightweight components should load eagerly.

---

## Reason

Each lazy component adds an AJAX request overhead. If every component on a page is lazy, the page becomes a cascade of loading states — each component loads independently, and the total time until the page is fully interactive is higher than if the components loaded eagerly together.

---

## Bad Example

```php
// Every component lazy — 10 independent AJAX requests on page load
#[Lazy] class Header extends Component { ... }
#[Lazy] class Nav extends Component { ... }
#[Lazy] class Content extends Component { ... }
#[Lazy] class Sidebar extends Component { ... }
#[Lazy] class Footer extends Component { ... }
```

---

## Good Example

```php
// Eager loading for lightweight, above-the-fold components
class Header extends Component { ... } // Lightweight, visible
class Nav extends Component { ... } // Lightweight, visible

// Lazy only for expensive, below-the-fold components
#[Lazy]
class HeavyChart extends Component { ... } // Expensive, below fold
```

---

## Exceptions

A "load on scroll" pattern where the page is infinitely scrolling content may legitimately have all deferred sections as lazy. Each section should still be independently measurable as benefiting from lazy loading.

---

## Consequences Of Violation

Performance risks: excessive AJAX requests, slower full-page interactivity. UX: multiple loading placeholders visible simultaneously.
