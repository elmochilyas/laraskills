# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Livewire / Inertia Basics
**Knowledge Unit:** Livewire Lazy Loading
**Generated:** 2026-06-03

---

# Decision Inventory

* #[Lazy] Component vs Eager Component for Initial Load
* Lazy Loading via #[Lazy] vs Manual wire:init for Deferred Initialization
* Placeholder Design: Skeleton vs Spinner vs Static Fallback

---

# Architecture-Level Decision Trees

---

## Decision 1: #[Lazy] Component vs Eager Component for Initial Load

---

## Decision Context

Whether to mark a Livewire component with `#[Lazy]` (defer initialization until visible) or keep it eager (initialize during initial page render).

---

## Decision Criteria

* Whether the component is above the fold (visible on initial page load)
* Whether the component's mount() method is expensive (slow queries, API calls)
* Whether the component's data is needed for the initial page layout
* Whether the component requires immediate interactivity

---

## Decision Tree

Is the component visible above the fold (immediately visible without scrolling)?
↓
YES → Use eager component — must be available for initial paint and interactivity
NO → Is the component's `mount()` method expensive (>200ms database queries, API calls)?
    YES → Use `#[Lazy]` — defer expensive initialization until needed
    NO → Is the component below the fold (requires scrolling)?
        YES → Use `#[Lazy]` — why load something the user hasn't seen yet?
        NO → Is the component critical for initial page layout (determines layout sizing)?
            YES → Use eager component — layout depends on component dimensions
            NO → Use `#[Lazy]` — defer non-critical components

---

## Rationale

`#[Lazy]` defers component initialization until the component enters the viewport (detected by Intersection Observer). This improves initial page load time by skipping expensive initialization for components the user hasn't seen yet. Above-the-fold components should never be lazy — the user sees them immediately.

---

## Recommended Default

**Default:** Above-the-fold components: eager. Below-the-fold components with expensive mount: `#[Lazy]`.
**Reason:** Above-the-fold components must render immediately. Lazy loading provides the most benefit for below-the-fold components with expensive initialization.

---

## Risks Of Wrong Choice

* Lazy above-the-fold: Placeholder shows in the main content area — user sees blank/loading state
* Eager below-the-fold: Expensive component initialized even if user never scrolls — wasted resources
* Lazy without placeholder: Empty space until component loads — layout shift
* Lazy for simple component: Intersection Observer overhead for a 5ms mount — unnecessary

---

## Related Rules

* Always Provide a Placeholder Method

---

## Related Skills

* Defer Expensive Components with Lazy Loading

---

---

## Decision 2: Lazy Loading via #[Lazy] vs Manual wire:init for Deferred Initialization

---

## Decision Context

Whether to use Livewire's `#[Lazy]` attribute (automatic on viewport entry) or manual `wire:init` (triggered by page load) for deferred initialization.

---

## Decision Criteria

* Whether the component should initialize when visible (viewport-based) or on page load (time-based)
* Whether the component is below the fold (viewport trigger preferred)
* Whether the component should initialize as soon as possible but not block the page load
* Whether the team needs more control over the trigger timing

---

## Decision Tree

Should the component initialize immediately when the page loads, but not block the initial render?
↓
YES → Use `wire:init` — fires on page load after initial render, doesn't block page paint
NO → Should the component initialize only when it enters the viewport (below the fold)?
    YES → Use `#[Lazy]` — Intersection Observer triggers initialization when visible
    NO → Should the component initialize on user interaction (button click)?
        YES → Use manual trigger — action method called from wire:click, not automatic initialization
        NO → Use `#[Lazy]` — default deferred initialization strategy

---

## Rationale

`#[Lazy]` triggers initialization when the component enters the viewport — ideal for below-the-fold components. `wire:init` fires immediately after the page renders — good for "don't block initial paint but start loading ASAP" scenarios. Manual triggers give full control over initialization timing.

---

## Recommended Default

**Default:** `#[Lazy]` for components not visible on initial load. `wire:init` for components that should start loading immediately but not block the page.
**Reason:** `#[Lazy]` is simpler and uses Intersection Observer for intelligent timing. `wire:init` is for components that need to load early but shouldn't block the initial render.

---

## Risks Of Wrong Choice

* `#[Lazy]` for above-the-fold with wire:init: Component not visible on load — placeholder stays until triggered
* `wire:init` for below-the-fold: Fires on page load — expensive component initialized even if never seen
* No deferred initialization: Everything loads on initial render — slow page load
* Wrong trigger mechanism: Component initializes too early or never initializes

---

## Related Rules

* Always Provide a Placeholder Method

---

## Related Skills

* Defer Expensive Components with Lazy Loading

---

---

## Decision 3: Placeholder Design: Skeleton vs Spinner vs Static Fallback

---

## Decision Context

What to show in the placeholder while a lazy component is loading — a skeleton (content-shaped placeholder), a spinner, or a static fallback.

---

## Decision Criteria

* Whether the placeholder should match the component's layout dimensions
* Whether the user should see animated loading feedback or a static placeholder
* Whether the component is critical for the page layout (affects layout shift)
* Whether the placeholder design should match the application's loading state pattern

---

## Decision Tree

Does the component have a known height and width that affects page layout?
↓
YES → Use a skeleton placeholder matching the component's dimensions — prevents layout shift
NO → Does the component take significant time to load (>1 second)?
    YES → Use a skeleton with subtle animation — user sees content-like placeholder, knows something is loading
    NO → Use a simple spinner or text — "Loading..." is sufficient for quick loads
NO → Should the placeholder show meaningful static content even before the component loads?
    YES → Use a static fallback — cached or default content shown until component hydrates
    NO → Use a skeleton placeholder — matches content shape, provides visual continuity

---

## Rationale

Skeleton placeholders match the component's layout and prevent layout shift when the real component loads. Spinners indicate activity but don't convey layout. Static fallbacks show meaningful content immediately. The best placeholder depends on the component's role in the page layout and load time.

---

## Recommended Default

**Default:** Skeleton placeholder matching component dimensions for most components. Spinner for small, quick-loading components. Static fallback for content that has a useful default state.
**Reason:** Skeletons prevent layout shift and provide visual continuity. Spinners are simpler but cause layout shift. Static fallbacks provide the best UX for content with usable defaults.

---

## Risks Of Wrong Choice

* No placeholder: Zero-height element until component loads — page jumps when component appears
* Spinner without dimensions: Spinner takes no space — component loads and pushes content down
* Skeleton with wrong dimensions: Skeleton is 200px but component is 400px — layout shift when real component loads
* Static fallback that never updates: Placeholder stays forever if component fails — user never sees error

---

## Related Rules

* Always Provide a Placeholder Method

---

## Related Skills

* Defer Expensive Components with Lazy Loading
