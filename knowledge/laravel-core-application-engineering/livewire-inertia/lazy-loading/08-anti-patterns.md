# Livewire Lazy Loading — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Lazy Loading |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Lazy Loading Above-the-Fold Content
2. No Placeholder Method on Lazy Components
3. Expensive Queries in Placeholder Method
4. Heavy Props Passed to Lazy Components
5. All Components Marked as Lazy

---

## Repository-Wide Anti-Patterns

- **Wrong dimension placeholders**: Skeleton height doesn't match real component — layout shift on load.
- **Lazy component that never triggers**: No Intersection Observer fallback — component never loads.
- **Lazy on mount-only data**: Component's mount() is a simple assignment — lazy overhead adds no value.
- **No placeholders at all**: Empty `<div>` shown — user sees blank space until load.

---

## Anti-Pattern 1: Lazy Loading Above-the-Fold Content

### Category

Performance

### Description

Applying `#[Lazy]` to components that are visible in the initial viewport, causing a placeholder to appear where content should be immediately available.

### Why It Happens

Developers apply `#[Lazy]` to "optimize" all components without considering which are above the fold. The placeholder briefly flashes before the component loads, but on localhost (fast network) it's invisible.

### Warning Signs

- Header or hero section uses `#[Lazy]`
- User sees loading skeleton in the main content area on page load
- Above-the-fold content fades in after initial paint
- Placeholder flash for the primary page content

### Why Harmful

Above-the-fold components are what the user sees first when the page loads. Showing a placeholder in this critical area makes the page feel slow, even if the technical time-to-interactive is lower. Users perceive the page as "broken" or "loading" when the primary content area shows skeletons.

### Consequences

- User sees loading skeletons in the main content area
- Page feels slow regardless of actual performance metrics
- Reduced perceived performance — first paint shows empty/placeholder content
- User may navigate away thinking the page is broken

### Alternative

Reserve lazy loading for components below the fold — sections the user must scroll to see. Above-the-fold content should always render eagerly for immediate visual completeness.

### Refactoring Strategy

1. Identify all lazy components visible without scrolling
2. Remove `#[Lazy]` from above-the-fold components
3. Move lazy loading only to components below the fold
4. Verify that above-the-fold content renders immediately

### Detection Checklist

- [ ] No `#[Lazy]` on header, hero, or main content sections
- [ ] Above-the-fold components render eagerly
- [ ] User sees content immediately on page load (no placeholders in viewport)
- [ ] Only below-the-fold components use `#[Lazy]`

### Related Rules

- Only Lazy-Load Below-the-Fold Content (05-rules.md)

### Related Skills

- Defer Expensive Components with Lazy Loading (06-skills.md)

### Related Decision Trees

- #[Lazy] Component vs Eager Component for Initial Load (07-decision-trees.md)

---

## Anti-Pattern 2: No Placeholder Method on Lazy Components

### Category

UX

### Description

Marking a component with `#[Lazy]` without defining a `placeholder()` method, resulting in an empty `<div>` while the component loads.

### Why It Happens

The `#[Lazy]` attribute works without a placeholder — the component just renders nothing until loaded. Developers may forget to add the method or not realize it's required for good UX.

### Warning Signs

- Component has `#[Lazy]` but no `placeholder()` method
- Empty blank space where the lazy component should be
- Page layout collapses because the lazy element has zero height
- No visual feedback that content is loading

### Why Harmful

Without a placeholder, Livewire renders an empty `<div>` in place of the lazy component. The user sees nothing — not even a visual cue that content is loading. If the component takes more than a second to load, the user may think the page is broken or incomplete.

### Consequences

- Zero-height blank space during loading — layout shift when component loads
- No visual feedback that content is loading
- User confusion — element appears to be missing
- No loading indication for slow networks

### Alternative

Always define a `placeholder()` method that returns a loading skeleton matching the component's dimensions. Use CSS animations for visual feedback.

### Refactoring Strategy

1. Identify all `#[Lazy]` components without `placeholder()` methods
2. Add a `public function placeholder(): View` method returning a skeleton view
3. Ensure skeleton dimensions match the component's real dimensions
4. Add CSS animation (pulse, shimmer) for visual feedback

### Detection Checklist

- [ ] All `#[Lazy]` components have `placeholder()` methods
- [ ] Placeholder returns a skeleton, not an empty view
- [ ] Skeleton dimensions match the real component
- [ ] CSS animation provides loading feedback

### Related Rules

- Always Provide a Placeholder Method (05-rules.md)
- Match Placeholder Dimensions to Component (05-rules.md)

### Related Skills

- Defer Expensive Components with Lazy Loading (06-skills.md)

### Related Decision Trees

- Placeholder Design: Skeleton vs Spinner vs Static Fallback (07-decision-trees.md)

---

## Anti-Pattern 3: Expensive Queries in Placeholder Method

### Category

Performance

### Description

Performing database queries, API calls, or heavy computations inside the `placeholder()` method of a lazy component.

### Why It Happens

Developers may not understand that the placeholder method runs during the INITIAL page render — before the lazy load triggers. They may extract "light" data for the placeholder, not realizing even that query defeats the purpose.

### Warning Signs

- `placeholder()` contains `User::count()`, `Order::sum()`, or similar queries
- Placeholder displays dynamic content (notification count, user-specific data)
- Initial page load is slow even with lazy components
- Placeholder method takes more than 1ms

### Why Harmful

The `placeholder()` method is executed during the initial page render, before the component is lazy-loaded. If `placeholder()` performs a database query, that query runs on every page load for every user, entirely defeating the purpose of lazy loading. The entire benefit of `#[Lazy]` is to defer expensive operations — if the placeholder is expensive, nothing is deferred.

### Consequences

- Initial page load includes database queries from placeholder methods
- Lazy loading provides no performance benefit — queries still run eagerly
- Server load remains high despite all components being "lazy"
- User experiences the same slow page, but now with additional AJAX overhead

### Alternative

Restrict `placeholder()` to returning a static or nearly-static view. Pass dynamic placeholder data as props from the parent component.

### Refactoring Strategy

1. Identify expensive operations in `placeholder()` methods
2. Move queries to the component's `mount()` method (which runs on lazy load)
3. If the placeholder needs dynamic text, pass it as a prop from the parent
4. Ensure `placeholder()` returns only static skeleton HTML with no DB queries

### Detection Checklist

- [ ] No `placeholder()` method contains database queries
- [ ] No `placeholder()` method makes API calls
- [ ] Placeholder is static or uses only props passed from parent
- [ ] Initial page load does not include queries from lazy component placeholders

### Related Rules

- Keep Placeholder Methods Lightweight (05-rules.md)

### Related Skills

- Defer Expensive Components with Lazy Loading (06-skills.md)

### Related Decision Trees

- #[Lazy] Component vs Eager Component for Initial Load (07-decision-trees.md)

---

## Anti-Pattern 4: Heavy Props Passed to Lazy Components

### Category

Performance

### Description

Passing full Eloquent models or large data arrays as props to a `#[Lazy]` component, negating the payload reduction benefit of lazy loading.

### Why It Happens

Developers often pass `$post` (the Eloquent model with all relationships) to a lazy component. They assume that because the component initializes lazily, the props are also deferred. In reality, props are serialized in the initial snapshot regardless.

### Warning Signs

- `<livewire:comments :post="$post" />` where `$post` is a full model with relationships
- Network tab shows large initial snapshot despite all components being lazy
- Lazy component props include nested relationships, collections, or heavy objects
- Initial page payload is not reduced by adding `#[Lazy]`

### Why Harmful

Props passed to lazy components are serialized in the initial page snapshot and sent to the frontend, even though the component initializes lazily. Passing a full `$post` model with all its relationships means the serialized data is included in every page response, completely negating the payload reduction benefit of lazy loading.

### Consequences

- Initial page snapshot includes serialized model data for lazy components
- Payload not reduced — lazy loading benefit lost
- Bandwidth wasted on data sent to frontend before the component needs it
- Exposed model data in HTML source (security concern for sensitive fields)

### Alternative

Pass only lightweight props (IDs, primitives) to lazy components. Fetch the full data inside `mount()` when the lazy load triggers.

### Refactoring Strategy

1. Identify lazy components receiving full models as props
2. Replace with scalar props: `<livewire:comments :post-id="$post->id" />`
3. Update component to fetch data in `mount()`: `$this->post = Post::findOrFail($this->postId)`
4. Verify that initial snapshot size decreases

### Detection Checklist

- [ ] Lazy component props are primitives or IDs only
- [ ] Full data is fetched inside `mount()`, not passed as props
- [ ] Initial snapshot does not include serialized model data for lazy components
- [ ] Network payload decreased after migrating to lightweight props

### Related Rules

- Pass Lightweight Props to Lazy Components (05-rules.md)

### Related Skills

- Defer Expensive Components with Lazy Loading (06-skills.md)

### Related Decision Trees

- #[Lazy] Component vs Eager Component for Initial Load (07-decision-trees.md)

---

## Anti-Pattern 5: All Components Marked as Lazy

### Category

Performance

### Description

Applying `#[Lazy]` to every component on a page regardless of its weight or position, causing a cascade of independent AJAX requests.

### Why It Happens

Developers may "optimize" by making everything lazy, thinking more lazy = more better. They may not have measured which components are actually expensive.

### Warning Signs

- Every component on a page has `#[Lazy]` attribute
- Header, navigation, sidebar, footer — all lazy
- Page loads with 10+ placeholders and a cascade of AJAX requests
- Lightweight components (30ms render time, 2KB output) marked as lazy
- Full page interactivity is slower than if everything loaded eagerly

### Why Harmful

Each lazy component adds an AJAX request overhead. If every component on a page is lazy, the page becomes a cascade of loading states — each component loads independently, and the total time until the page is fully interactive is higher than if the components loaded eagerly together. The user sees 10+ placeholders and waits for each to load incrementally.

### Consequences

- Cascade of AJAX requests — 10+ independent requests on page load
- Slower full-page interactivity than eager loading
- Multiple placeholders visible simultaneously — poor UX
- Intersection Observer overhead for lightweight components
- Wasted AJAX setup for components that could have been sent with the initial page

### Alternative

Measure render time and payload size for each component. Only apply `#[Lazy]` to components whose initial render adds >100ms or >50KB to the page response. Lightweight components should load eagerly.

### Refactoring Strategy

1. Measure render time and payload size for all components
2. Remove `#[Lazy]` from components under the 100ms/50KB threshold
3. Keep lazy only for genuinely expensive, below-the-fold components
4. Verify the page is interactive faster after reducing the number of lazy components

### Detection Checklist

- [ ] Lightweight components load eagerly (not lazy)
- [ ] Less than half of the components on a page are lazy
- [ ] No lazy loading for header, navigation, or other lightweight UI
- [ ] Page interactivity time is measured and compared to all-lazy baseline
- [ ] Lazy loading is applied based on measurement, not habit

### Related Rules

- Never Lazy All Components (05-rules.md)

### Related Skills

- Defer Expensive Components with Lazy Loading (06-skills.md)

### Related Decision Trees

- #[Lazy] Component vs Eager Component for Initial Load (07-decision-trees.md)
