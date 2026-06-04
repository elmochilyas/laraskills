# Skill: Defer Expensive Components with Lazy Loading

## Purpose

Use the `#[Lazy]` attribute to defer initialization of expensive Livewire components until they enter the viewport, with matching placeholder skeletons and lightweight props.

## When To Use

- Heavy components with expensive database queries in `mount()`
- Components below the fold that aren't visible on initial page load
- Dashboard widgets that load data from external APIs
- Tab panels where content loads only when the tab is active

## When NOT To Use

- Components above the fold that are immediately visible
- Lightweight components with trivial `mount()` methods
- Components that need to be interactive immediately on page load
- Components whose data is needed for initial page layout

## Prerequisites

- Livewire v3 (lazy loading with `#[Lazy]` attribute)
- Understanding of which component initializations are expensive

## Inputs

- Component measurement (render time, payload size)
- Above-the-fold vs below-the-fold analysis
- Placeholder design matching component dimensions

## Workflow

1. Measure the component's render time and payload size to confirm lazy loading is beneficial
2. Add `#[Lazy]` attribute to the component class
3. Implement `placeholder()` method returning a loading skeleton matching the component's dimensions:
   ```php
   public function placeholder(): View
   {
       return view('livewire.placeholders.dashboard-stats');
   }
   ```
4. Keep `placeholder()` lightweight — no database queries or API calls
5. Pass only lightweight props (IDs, primitives) to lazy components — fetch full data in `mount()`:
   ```blade
   <livewire:comments :post-id="$post->id" :key="$post->id" />
   ```
6. Only apply `#[Lazy]` to below-the-fold components — above-the-fold content loads eagerly
7. Do not mark all components as lazy — each lazy component adds an AJAX request

## Validation Checklist

- [ ] Heavy components use `#[Lazy]` attribute
- [ ] `placeholder()` method returns a meaningful loading skeleton
- [ ] Placeholder dimensions match final component height (prevents layout shift)
- [ ] Above-the-fold content loads immediately (not lazy)
- [ ] Props to lazy components are lightweight (IDs, not full models)
- [ ] No expensive operations in `placeholder()` (no DB queries, no API calls)
- [ ] Layout shift minimized when lazy components load
- [ ] Not every component on the page is lazy (only genuinely expensive ones)

## Common Failures

- No `placeholder()` method — empty `<div>` shown, user sees blank space
- Placeholder height doesn't match component — layout shift when component loads
- Lazy loading above-the-fold content — user sees placeholder in main viewing area
- Expensive queries in `placeholder()` — defeats the purpose of lazy loading
- Heavy props passed to lazy components — initial snapshot still large
- All components marked as lazy — cascade of AJAX requests, slower full interactivity

## Decision Points

- Lazy-load components whose initial render adds >100ms or >50KB to the page response
- Lightweight components should load eagerly to avoid unnecessary AJAX overhead
- Combine `#[Lazy]` with the Islands pattern for maximum performance on content-heavy pages

## Performance Considerations

Each lazy component makes a separate AJAX request when it enters the viewport. They load in parallel as they enter the viewport. Initial page weight is reduced because expensive queries and heavy templates are deferred.

## Security Considerations

Lazy-loaded components go through the same Livewire lifecycle — checksum verification, authorization, and validation all apply. Props passed to lazy components are serialized in the initial snapshot — avoid passing sensitive data as props.

## Related Rules

- Always Provide a Placeholder Method (05-rules.md)
- Match Placeholder Dimensions to Component (05-rules.md)
- Only Lazy-Load Below-the-Fold Content (05-rules.md)
- Keep Placeholder Methods Lightweight (05-rules.md)
- Pass Lightweight Props to Lazy Components (05-rules.md)
- Never Lazy All Components (05-rules.md)

## Related Skills

- Implement the Islands Pattern for Content-Heavy Pages (livewire/islands-pattern)
- Implement User-Friendly Loading States (livewire/loading-states)
- Defer Expensive Data with Lazy Props (inertia/lazy-data-evaluation)

## Success Criteria

- Initial page load time improved by deferring expensive below-the-fold components
- Placeholder skeleton matches the real component's dimensions — no layout shift
- Lazy props are lightweight (IDs, primitives) — full data fetched in `mount()`
- Above-the-fold content renders immediately (not lazy)
- Not every component is lazy — lightweight components load eagerly
- Placeholder method contains no database queries or expensive operations
