# Inertia Page Components — Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Inertia Page Components |
| Anti-Pattern Count | 5 |

---

## Anti-Pattern Inventory

1. Props as Initial State — Copying Server Props to Local State
2. Client-Routed Navigation — Using React/Vue Router Instead of Inertia
3. Fat Page Components — 500+ Line Monolithic Components
4. Missing Layout Persistence — Layout State Lost on Every Navigation
5. No Loading Indication During Page Transitions

---

## Repository-Wide Anti-Patterns

- **Missing page component file**: No matching file for `Inertia::render()` path causes runtime error.
- **Mutating props directly**: Direct assignment to props breaks Inertia's immutable data flow.
- **Browser-only code in SSR**: Direct `window`/`document` access during SSR render causes hydration mismatch.
- **No error pages**: Error states (403, 404, 500) render as Blade pages or raw JSON instead of SPA-styled pages.

---

## Anti-Pattern 1: Props as Initial State — Copying Server Props to Local State

### Category

Design

### Description

Copying Inertia server props into local component state (e.g., `const [user, setUser] = useState(props.user)`) instead of using the props directly.

### Why It Happens

Developers coming from traditional React/Vue patterns are accustomed to fetching data once and managing it in local state. They treat `props` as "initial values" rather than as the authoritative source of truth.

### Warning Signs

- `useState(props.X)` or `ref(props.X)` patterns in page components
- Data displayed on the page does not update after a partial reload
- User sees stale data after navigating away and back

### Why Harmful

Copying server props to local state creates two sources of truth. When the component re-renders with new props (from a partial reload or same-page navigation), the local state still holds the old value. The UI becomes stale. Inertia's data flow is unidirectional — server sends, client renders. Breaking this pattern causes synchronization bugs.

### Consequences

- Stale data displayed after navigation or partial reload
- Two sources of truth for the same data — confusing for developers
- Manual sync logic needed to keep local state in sync with props
- Bugs that only appear after navigating to a different page and back

### Alternative

Use server props directly in the render output. If you need to mutate data, submit it to the server and refresh via partial reload. Use `useState` only for client-only UI state (open modals, accordion toggles).

### Refactoring Strategy

1. Search for `useState(props.` or `ref(props.` patterns
2. Replace with direct prop access in the render function
3. If client-side UI state is needed, extract to separate `useState` calls with local defaults
4. Verify that partial reloads correctly update the UI after removing local state

### Detection Checklist

- [ ] No server props are copied into `useState`/`ref`
- [ ] All server data is accessed directly from props
- [ ] Client-only UI state (modals, toggles) uses separate `useState`
- [ ] Partial reloads correctly update displayed data

### Related Rules

- Treat Props as Read-Only (05-rules.md)

### Related Skills

- Create an Inertia Page Component with Typed Props and Layout (06-skills.md)

### Related Decision Trees

- Persistent Layout vs Per-Page Layout (07-decision-trees.md)

---

## Anti-Pattern 2: Client-Routed Navigation — Using React/Vue Router Instead of Inertia

### Category

Architecture

### Description

Using client-side routing libraries (React Router, Vue Router) for page navigation within an Inertia application, bypassing Inertia's server-routed navigation model.

### Why It Happens

Teams migrating an existing SPA to Inertia may keep their client-side router. Developers familiar with frontend frameworks may default to the routing solution they know. They may not realize that Inertia has its own navigation mechanism.

### Warning Signs

- `react-router-dom` or `vue-router` packages imported and configured
- `<Link>` from React Router used instead of `<Link>` from Inertia
- Navigation causes client-side route changes without server involvement
- Page content does not update when navigation occurs

### Why Harmful

Client-side routing breaks Inertia's server-routed model. Routes are now defined in two places (PHP and JS), causing duplication. Server middleware, authorization checks, and data fetching defined in controllers are bypassed. The Inertia protocol for prop passing, validation error mapping, and partial reloads does not function.

### Consequences

- Server routes and client routes drift apart
- Controller authorization is bypassed — users can navigate to client routes that have no server guard
- Inertia props, validation errors, and shared data stop working
- Two routing systems to maintain — increased complexity

### Alternative

Use Inertia's built-in navigation: `<Link>` component from `@inertiajs/react` (or Vue/Svelte equivalent) for navigation, `router.visit()` for programmatic navigation, and `router.reload()` for partial refreshes.

### Refactoring Strategy

1. Remove React Router / Vue Router dependencies from the project
2. Replace `<Link>` from React Router with `<Link>` from `@inertiajs/react`
3. Replace programmatic `history.push()` / `router.push()` with `router.visit()`
4. Move all route definitions to Laravel's `routes/web.php`
5. Test that all navigations trigger server requests and receive Inertia responses

### Detection Checklist

- [ ] No client-side routing libraries imported (react-router-dom, vue-router)
- [ ] All navigation uses Inertia's `<Link>` or `router.visit()`
- [ ] All routes are defined in Laravel's `routes/web.php`
- [ ] Navigation triggers proper Inertia requests (check network tab for X-Inertia header)

### Related Rules

- Use Inertia Navigation, Not Client Router

### Related Skills

- Create an Inertia Page Component with Typed Props and Layout (06-skills.md)

### Related Decision Trees

- Inertia Page Component vs Blade Template for View Layer (07-decision-trees.md)

---

## Anti-Pattern 3: Fat Page Components — 500+ Line Monolithic Components

### Category

Maintainability

### Description

Creating page components that exceed 500 lines, mixing layout, data display, business logic, event handlers, and inline styles in a single file.

### Why It Happens

Page components are the natural entry point for a page's UI. As features grow, developers add sections, modals, and logic directly to the page component. There is no immediate pain — the component works — so there is no incentive to split.

### Warning Signs

- Page component file exceeds 500 lines
- Multiple unrelated UI sections (header, sidebar, table, footer, modals) in one file
- Event handlers and business logic mixed with JSX/Vue template
- Difficulty finding specific code within the component

### Why Harmful

Large components are hard to read, test, and maintain. A single component that does everything cannot be reused. Changes to one section risk breaking another. Code reviews become difficult because the diff is large and unfocused.

### Consequences

- Poor maintainability — changes require understanding the entire 500+ line file
- No reusability — sections that could be shared are locked inside the page component
- Difficult testing — must render the entire page to test a sub-section
- Prone to merge conflicts — multiple developers touching the same file

### Alternative

Extract reusable UI into sub-components (tables, modals, cards, forms). Extract business logic into custom hooks (React) or composables (Vue). Keep page components focused on layout and prop delegation.

### Refactoring Strategy

1. Identify visual sections in the page component (tables, modals, sidebars, forms)
2. Extract each section into a separate component file under `resources/js/Components/`
3. Extract event handlers and state logic into custom hooks/composables
4. The page component should compose sub-components and pass props down
5. Set a 300-line maximum for the page component after extraction

### Detection Checklist

- [ ] Page components are under 300 lines
- [ ] Visual sections are extracted into separate component files
- [ ] Business logic is extracted into hooks/composables
- [ ] Sub-components are reused across multiple pages where applicable

### Related Rules

- Extract Reusable UI into Sub-Components

### Related Skills

- Create an Inertia Page Component with Typed Props and Layout (06-skills.md)

### Related Decision Trees

- TypeScript Interface vs Inline Type for Page Props (07-decision-trees.md)

---

## Anti-Pattern 4: Missing Layout Persistence — Layout State Lost on Every Navigation

### Category

Performance / UX

### Description

Wrapping page content with a layout component directly inside the page's render function instead of using Inertia's persistent layout mechanism (`.layout` property).

### Why It Happens

The wrapping approach (`<Layout><PageContent /></Layout>`) is the natural way to compose components in React/Vue. Developers may not be aware of Inertia's `.layout` property pattern or may not understand why it matters.

### Warning Signs

- Layout component wrapped around page content inside the page component's return statement
- Sidebar scroll position resets on every navigation
- Open accordions or sub-menus in the layout collapse on page change
- Layout-level API calls re-fire on every page navigation

### Why Harmful

Without persistent layouts, a new layout is created on every navigation — the layout remounts, losing scroll position, open accordions, and any layout-level state (e.g., sidebar collapse state). API calls in the layout re-fire on every page change, adding unnecessary load. The application feels less like an SPA.

### Consequences

- Layout state (scroll, sidebar, modals) lost on page change
- Expensive layout initialization re-executes on every navigation
- More HTTP requests (layout API calls) on every page
- SPA feel is degraded — layout visually resets during transitions

### Alternative

Assign a persistent layout via the `.layout` property: `Index.layout = page => <Layout children={page} />`. This tells Inertia to keep the layout mounted across navigations.

### Refactoring Strategy

1. Identify page components that wrap layout inline
2. Move the layout wrapper to the `.layout` property assignment
3. Remove layout wrapper from the page component's render output
4. Test that layout state (sidebar scroll, open menus) persists across navigations

### Detection Checklist

- [ ] Layout uses `.layout` property assignment, not inline wrapping
- [ ] Layout state persists across navigations (scroll position, open menus)
- [ ] Layout-level API calls execute only once (on initial load)
- [ ] No visual reset of layout elements during page transitions

### Related Rules

- Use Persistent Layouts (05-rules.md)

### Related Skills

- Create an Inertia Page Component with Typed Props and Layout (06-skills.md)

### Related Decision Trees

- Persistent Layout vs Per-Page Layout (07-decision-trees.md)

---

## Anti-Pattern 5: No Loading Indication During Page Transitions

### Category

UX

### Description

Failing to show any loading indicator during Inertia page transitions, leaving users with no feedback that a navigation is in progress.

### Why It Happens

Inertia navigation is fast for cached pages, so developers may not notice the need for a loading indicator. The layout component that would render the indicator is often not the page being built — it's a shared layout that was set up once and forgotten.

### Warning Signs

- Page transitions that appear as a frozen screen followed by content appearing
- No progress bar, spinner, or dimming overlay during navigation
- Users click links and nothing appears to happen for 200-500ms
- Users click multiple links because the first click appeared to do nothing

### Why Harmful

Inertia navigations can take 200-1000ms depending on server response time. Without a loading indicator, users perceive the application as unresponsive or broken when a page transition takes more than 300ms. They may click again, triggering duplicate requests.

### Consequences

- Navigation feels sluggish or broken
- Users perceive the application as slow
- Duplicate requests from impatient users clicking multiple times
- Poor user experience during slow network conditions

### Alternative

In the persistent layout component, subscribe to `usePage().processing` and render a loading bar, spinner, or dimming overlay while navigations are in progress. A subtle loading bar (similar to YouTube's red bar) provides immediate feedback.

### Refactoring Strategy

1. Open the persistent layout component
2. Import `usePage` from `@inertiajs/react`
3. Add a loading indicator that appears when `usePage().processing` is true
4. Test on throttled network (3G) to verify the indicator appears during transitions

### Detection Checklist

- [ ] Layout component subscribes to `usePage().processing`
- [ ] Loading indicator (bar, spinner, overlay) visibly appears during navigation
- [ ] Indicator is subtle and non-intrusive (small progress bar at top of page)
- [ ] Indicator disappears when navigation completes
- [ ] Tested on slow network (3G) to verify visibility

### Related Rules

- Show Navigation Loading Indication (05-rules.md)

### Related Skills

- Create an Inertia Page Component with Typed Props and Layout (06-skills.md)

### Related Decision Trees

- Inertia Page Component vs Blade Template for View Layer (07-decision-trees.md)
