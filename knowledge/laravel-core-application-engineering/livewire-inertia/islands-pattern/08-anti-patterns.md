# Livewire Islands Pattern — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Islands Pattern |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Full-Page Livewire for Mostly Static Content
2. Islands Trying to Share State Directly
3. Missing `:key` on Island Lists
4. Island Template Duplicating Page Shell
5. No Lazy Loading for Below-the-Fold Islands

---

## Repository-Wide Anti-Patterns

- **Inconsistent stack usage**: Mixing Livewire and Inertia on the same page.
- **Island renders entire page**: Using an island when the whole page is interactive — full-page component would be simpler.
- **Islands without independent data fetching**: Multiple islands coupling via Blade props from a single parent controller.

---

## Anti-Pattern 1: Full-Page Livewire for Mostly Static Content

### Category

Performance

### Description

Using a full-page Livewire component for pages where more than 50% of the content is static HTML (blog posts, documentation, marketing pages) instead of the Islands pattern.

### Why It Happens

Full-page Livewire is the default. Developers create a page by running `make:livewire BlogPost` and render everything inside the component view. The Islands pattern requires a mental shift — creating a plain Blade view and embedding components.

### Warning Signs

- Blog post with a comment section wrapped in `<div>` inside a Livewire component
- Documentation page with a search bar as a full-page Livewire component
- Initial page render includes serialized post content that never changes
- Network payload includes post body, author bio, and sidebar in the component snapshot

### Why Harmful

Full-page Livewire serializes the entire component state on every request, even for static content. A blog post's body, author bio, and sidebar are serialized every time a user posts a comment. This is wasted bandwidth and processing — the static content is sent over the wire repeatedly despite never changing.

### Consequences

- Unnecessary serialization of read-only content on every AJAX request
- Increased page payload — blog post body serialized with every comment action
- Slower initial render — Livewire boot overhead for components that could be plain Blade
- More server CPU usage from serializing static data

### Alternative

Use the Islands pattern: render the page as a standard Blade view with `@extends`, and embed individual Livewire components only for the interactive sections.

### Refactoring Strategy

1. Identify full-page Livewire components where >50% of content is static
2. Convert the component view to a standard Blade view extending a layout
3. Extract interactive sections (forms, widgets) into separate Livewire components
4. Embed those components as `<livewire:tag />` in the Blade view
5. Delete the now-unnecessary full-page component

### Detection Checklist

- [ ] Content-heavy pages use Islands, not full-page Livewire
- [ ] Static content rendered as plain Blade, not inside a Livewire component
- [ ] Component snapshot does not include read-only content
- [ ] Initial page render payload is reduced after migration to Islands

### Related Rules

- Choose Islands for Content Pages (05-rules.md)

### Related Skills

- Implement the Islands Pattern for Content-Heavy Pages (06-skills.md)

### Related Decision Trees

- Islands Pattern vs Full-Page Component for Content Pages (07-decision-trees.md)

---

## Anti-Pattern 2: Islands Trying to Share State Directly

### Category

Architecture

### Description

Attempting to share Livewire component state between island components on the same page by passing the same data as Blade props or relying on global state.

### Why It Happens

Developers accustomed to full-page components (where all state lives in a single class) expect islands to work the same way. They pass $post data to both a comment island and a share widget island, creating implicit coupling.

### Warning Signs

- Same data passed as props to multiple islands on the same page
- Islands use a shared service or singleton to access common state
- Removing one island breaks another island's data dependency
- Blade view passes `$allData` to every island

### Why Harmful

Islands are designed as independent Livewire components, each with its own ID, snapshot, checksum, and Alpine scope. They cannot share internal state. Passing the same complex object to multiple islands couples them — if one island changes, the other must be updated. This breaks the modularity that Islands are meant to provide.

### Consequences

- Coupled islands — removing one island breaks another
- Testing complexity — cannot test islands independently
- Refactoring difficulty — changing shared data affects multiple islands
- Violates the isolation principle of the Islands pattern

### Alternative

Each island should receive only the data it needs, or fetch its own data independently via its `mount()` method. For cross-island communication, use `$dispatch` events.

### Refactoring Strategy

1. Identify islands receiving the same complex data as props
2. Pass only the subset each island needs (`$data->chart` instead of `$data`)
3. If data is not available in the parent view, have the island fetch it in `mount()`
4. For reactive cross-island communication, implement `$dispatch` / `$on` listeners

### Detection Checklist

- [ ] Each island receives only the props it specifically needs
- [ ] No two islands receive the same complex data object
- [ ] Islands can be removed from a page without breaking other islands
- [ ] Cross-island communication uses `$dispatch` events, not shared props

### Related Rules

- Keep Islands Self-Contained (05-rules.md)

### Related Skills

- Implement the Islands Pattern for Content-Heavy Pages (06-skills.md)

### Related Decision Trees

- State Sharing Between Islands vs Independent Data Fetching (07-decision-trees.md)

---

## Anti-Pattern 3: Missing `:key` on Island Lists

### Category

Reliability

### Description

Rendering multiple island components in a `@foreach` loop without a `:key` attribute, or using the loop index as the key.

### Why It Happens

Developers may not know that Livewire requires a unique key for each island instance. The loop index (`$loop->index`) is a natural choice but is incorrect.

### Warning Signs

- `@foreach ($items as $item) <livewire:todo-item :todo="$item" />`
- Loop uses `:key="$loop->index"` or `:key="$index"`
- After sorting or filtering, islands display state from the wrong item
- Form inputs within islands show incorrect values after reorder

### Why Harmful

Livewire uses the key to track island identity across re-renders. Without a key, or with a volatile key like the loop index, Livewire may reassign state when list order changes. After a sort operation, the first island's form input might contain data from what was previously the third item.

### Consequences

- State assigned to wrong island after list reorder
- Form inputs showing values from unrelated records
- Toggles and checkboxes incorrectly showing state
- Hard-to-debug data corruption in list-based UIs

### Alternative

Always use a unique, stable identifier as the key — typically the model's primary key: `:key="$item->id"`.

### Refactoring Strategy

1. Find all `@foreach` loops rendering Livewire components
2. Add `:key="$item->id"` (or equivalent stable unique identifier) to each component tag
3. If items have no ID, generate UUIDs during data preparation
4. Remove any `:key="$loop->index"` or `:key="$index"` usages

### Detection Checklist

- [ ] Every island in a loop has a `:key` attribute
- [ ] Each key is unique and stable (not the loop index)
- [ ] Island state is correct after sorting, filtering, or reordering
- [ ] Form inputs retain correct values after list operations

### Related Rules

- Always Use :key on Island Lists (05-rules.md)

### Related Skills

- Implement the Islands Pattern for Content-Heavy Pages (06-skills.md)

### Related Decision Trees

- Islands Pattern vs Full-Page Component for Content Pages (07-decision-trees.md)

---

## Anti-Pattern 4: Island Template Duplicating Page Shell

### Category

Design

### Description

An island's Blade template includes the full page layout (header, footer, sidebar) instead of rendering only the interactive portion.

### Why It Happens

Developers create the island by copying the full-page component template, which includes the page shell. They don't realize the parent Blade view already renders the shell.

### Warning Signs

- Island template contains `<x-header />` or `<x-footer />`
- Page renders with duplicate headers, navigations, or sidebars
- CSS conflicts from nested layout elements
- Island template includes `@extends` or `@section` directives

### Why Harmful

The parent Blade view renders the page shell (header, footer, sidebar). If the island's template also includes these elements, they are rendered both in the parent Blade and inside the island, causing duplicated HTML. This bloats the response, breaks CSS styling, and violates separation of concerns.

### Consequences

- Duplicated HTML — header and footer appear twice
- CSS styling conflicts from nested layout elements
- Larger page response from redundant markup
- Violates the separation of concerns between layout and component

### Alternative

Island templates should render only the interactive widget or form. The page layout belongs in the parent Blade view.

### Refactoring Strategy

1. Strip all layout elements (header, footer, sidebar, `@extends`, `@section`) from island templates
2. Render only the interactive section's HTML
3. Ensure the parent Blade view provides the full page shell
4. Verify no duplicate layout elements appear in the rendered page

### Detection Checklist

- [ ] Island templates contain only the interactive portion, not the page shell
- [ ] No duplicate headers, footers, or sidebars in rendered page
- [ ] No `@extends` or layout directives in island templates
- [ ] Page shell is rendered by the parent Blade view only

### Related Rules

- Keep Island Templates Focused (05-rules.md)

### Related Skills

- Implement the Islands Pattern for Content-Heavy Pages (06-skills.md)

### Related Decision Trees

- Islands Pattern vs Full-Page Component for Content Pages (07-decision-trees.md)

---

## Anti-Pattern 5: No Lazy Loading for Below-the-Fold Islands

### Category

Performance

### Description

Every island on a page loads eagerly, including those below the fold, causing N+1 AJAX requests on initial page load for components the user hasn't seen yet.

### Why It Happens

Adding `#[Lazy]` requires explicit effort — creating a placeholder method, matching dimensions, etc. Eager loading is the default and works correctly for all islands.

### Warning Signs

- Page with 8+ islands and no `#[Lazy]` attribute on any of them
- Initial page load triggers 10+ AJAX requests for off-screen components
- Dashboard with many widgets all loading on page load
- Tabs or modals with islands that are invisible on first paint

### Why Harmful

Every island on a page fires a hydration request on initial load, even if it's not visible. For a page with 10 below-the-fold islands, 10 AJAX requests fire on page load. This congests the network, delays interactivity for visible components, and wastes server resources on components the user may never scroll to.

### Consequences

- Excessive AJAX requests on page load for off-screen islands
- Slower initial page interactivity — visible components delayed by background island requests
- Wasted server resources for islands the user never scrolls to
- Poor performance on mobile with limited bandwidth

### Alternative

Add `#[Lazy]` to islands that are below the fold, inside tabs, or inside modals. Provide a `placeholder()` method with matching dimensions.

### Refactoring Strategy

1. Identify islands below the fold or initially invisible
2. Add `#[Lazy]` attribute to each component class
3. Implement `placeholder()` with matching dimensions
4. Keep above-the-fold islands eager for immediate interactivity

### Detection Checklist

- [ ] Below-the-fold islands use `#[Lazy]`
- [ ] Above-the-fold islands load eagerly (no placeholder flash in viewport)
- [ ] Lazy islands have `placeholder()` methods with matching dimensions
- [ ] Initial page load AJAX count is proportional to visible components only

### Related Rules

- Combine Islands with Lazy Loading (05-rules.md)

### Related Skills

- Implement the Islands Pattern for Content-Heavy Pages (06-skills.md)
- Defer Expensive Components with Lazy Loading (06-skills.md)

### Related Decision Trees

- Islands Pattern vs Full-Page Component for Content Pages (07-decision-trees.md)
