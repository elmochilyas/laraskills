# ECC Anti-Patterns — Blade Fragments

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Blade Fragments |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Fragment-Only Response on Initial Page Load (Missing Full Layout)
2. Stateful Interactive UI via Fragments
3. Missing DOM ID on Fragment Wrapper
4. Nested Fragments
5. Duplicate Fragment Names in the Same View

---

## Repository-Wide Anti-Patterns

- Fragments as Server-Side Performance Optimization (full view still renders)
- Fragments for SEO-Critical Content Without Bot Detection
- Single Cache Key for Fragment and Full-Page Responses
- Sensitive Fragment Names Leaking Information
- Fragments Used for the Entire Page (no bandwidth savings)

---

## Anti-Pattern 1: Fragment-Only Response on Initial Page Load

### Category
Architecture | Performance

### Description
Returning a fragment response (`$view->fragment('name')`) on every request including the initial page load, instead of distinguishing first load from subsequent navigation.

### Why It Happens
Developers set up fragment responses in the controller and forget to check `$request->fragment()`. The fragment is returned unconditionally.

### Warning Signs
- All responses return partial HTML — browser shows unstyled content
- Navigation, header, and footer never render
- Controller always calls `->fragment()` without checking request headers
- Layout is rendered server-side but never sent (wasted CPU)

### Preferred Alternative
Check `$request->fragment()` or `$request->header('Turbo-Frame')` and return full-page view on initial requests, fragment only on subsequent navigation.

### Related Rules
- Rule: Return Full Page on First Request, Fragment on Subsequent

---

## Anti-Pattern 2: Stateful Interactive UI via Fragments

### Category
Architecture

### Description
Using Blade Fragments to update UI sections that contain interactive elements (forms, search inputs, toggles) that need to maintain client-side state across updates.

### Why It Happens
Developers try to use fragments for all partial updates without understanding the stateless nature of the approach.

### Warning Signs
- Form input values reset after fragment update
- Scroll position jumps to top on navigation
- Complex JavaScript workarounds to preserve state across fragment replacements
- Developer has implemented manual state-preservation via localStorage or hidden inputs

### Preferred Alternative
Use Livewire or Alpine.js for interactive, stateful UI. Reserve fragments for static content sections (lists, stats panels, navigation-driven content).

### Related Rules
- Rule: Do Not Use Fragments for Interactive Stateful Components

---

## Anti-Pattern 3: Missing DOM ID on Fragment Wrapper

### Category
Design | Reliability

### Description
Defining `@fragment('name')` without a matching `id` attribute on the wrapper element inside the fragment block.

### Why It Happens
Developers assume the fragment name alone is sufficient for client-side targeting.

### Warning Signs
- Turbo/HTMX content replacement silently fails (nothing updates)
- Fragment block contains `<div class="...">` without `id="..."` matching the fragment name
- Client-side selectors target a non-existent or mismatched ID
- Developer debugging network requests to see fragment content returns but no replacement occurs

### Preferred Alternative
Always add an `id` attribute on the wrapper element that matches the fragment name or the client-side target selector.

### Related Rules
- Rule: Match Fragment Wrapper ID to Fragment Name

---

## Anti-Pattern 4: Nested Fragments

### Category
Architecture | Reliability

### Description
Placing a `@fragment` block inside another `@fragment` block, creating nested fragment extraction boundaries.

### Why It Happens
Developers think of fragments as composable sections and nest them like components.

### Warning Signs
- Fragment responses contain truncated or duplicated content
- Inner fragment extraction fails unpredictably
- Nested `@fragment` directives in the same template file
- `@fragment` inside a `@section` that is itself inside another `@fragment`

### Preferred Alternative
Keep fragments flat and sibling-level. Use `@include` for shared partial content within fragments instead of nesting.

### Related Rules
- Rule: Do Not Nest Fragments

---

## Anti-Pattern 5: Duplicate Fragment Names in the Same View

### Category
Maintainability | Reliability

### Description
Using the same fragment name for two different `@fragment` blocks within the same view file.

### Why It Happens
Copy-pasting fragment blocks without renaming, or having multiple content areas named generically (e.g., both called "content").

### Warning Signs
- Two `@fragment('content')` blocks in the same view
- Fragment response only contains one of the two sections — the other silently dropped
- Developer confused about why the second section never updates
- No error or warning from Blade compiler about duplicate names

### Preferred Alternative
Use unique, descriptive fragment names per view (e.g., `@fragment('active-users')` and `@fragment('total-users')` instead of `@fragment('content')` twice).

### Related Rules
- Rule: Use Unique Fragment Names Per View
