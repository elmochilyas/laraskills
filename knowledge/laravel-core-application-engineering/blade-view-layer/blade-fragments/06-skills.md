# Skill: Implement Blade Fragment Responses for Turbo/HTMX Navigation

## Purpose

Optimize page navigation by serving only changed content sections via Blade Fragments, reducing bandwidth and enabling smooth client-side transitions.

## When To Use

- Adding Turbo Drive or HTMX to a Laravel application
- Pagination or content updates without full page reload
- Form submission feedback that replaces only a results section
- Subsequent navigations where the layout is static and only the main content changes

## When NOT To Use

- Initial page load — always return full HTML with layout
- Interactive stateful components (use Livewire or Alpine instead)
- SEO-critical content that must be indexed by crawlers
- Pages with nested fragments (fragment within fragment)
- Server-CPU optimization (fragments save bandwidth, not server CPU)

## Prerequisites

- Laravel 12+ (or a package providing fragment support)
- Turbo Drive or HTMX installed on the frontend
- Blade view with at least one content section

## Inputs

- View file containing `@fragment` directives
- Controller action rendering the view
- Client-side library (Turbo/HTMX) for fragment replacement

## Workflow

1. Identify the content section that changes frequently (e.g., user list, search results)
2. Wrap the changeable content in `@fragment('name')` / `@endfragment` in the Blade view
3. Add a DOM `id` attribute on the wrapper element matching the fragment name or client-side target selector
4. In the controller, check `$request->fragment()` to detect whether the request expects a fragment
5. Return full-page view for initial requests; return `$view->fragment('name')` for subsequent navigation
6. Use `$request->isBot()` to ensure crawlers always receive full-page HTML
7. Use distinct cache keys for fragment responses versus full-page responses with independent TTLs
8. Verify that fragment names are unique within each view — no duplicate `@fragment('name')` blocks

## Validation Checklist

- [ ] First page load returns full HTML with layout (head, navigation, footer)
- [ ] Subsequent fragment requests return only the fragment HTML
- [ ] Fragment wrapper element has a consistent DOM ID matching the client target
- [ ] No `@fragment` block is nested inside another `@fragment` block
- [ ] Each fragment name is unique within the view
- [ ] Bot user agents receive full-page HTML, never fragments
- [ ] Fragment and full-page responses use separate cache keys
- [ ] Authorization and middleware still apply to fragment requests

## Common Failures

- **Layout never renders on first load:** Controller always returns `->fragment()` instead of checking `$request->fragment()`. Fix by returning full view when no fragment header is present.
- **Client-side content never updates:** Wrapper element inside `@fragment` is missing the `id` attribute. Add `id="fragment-name"` matching the client target selector.
- **Fragment content is wrong or truncated:** Nested fragments cause unpredictable extraction. Keep fragments flat and sibling-level, not nested.
- **Search engines index broken pages:** Bot requests receive fragment-only HTML. Add `$request->isBot()` check to skip fragment responses.

## Decision Points

- Fragment vs Livewire: Use fragments for navigation-driven content updates where no client state is maintained. Use Livewire when the UI needs to remember form state, scroll position, or interactivity across updates.
- Single vs multiple fragments: Use one fragment per independently updatable content area. Multiple fragments on the same page are fine as long as they are siblings, not nested.

## Performance Considerations

- Fragments do NOT save server CPU — the entire view is still rendered server-side
- Bandwidth savings are significant: fragment responses are typically 10x smaller than full pages
- Cache fragment and full-page responses separately with different TTLs
- For server cost reduction, use view caching instead of fragments

## Security Considerations

- Fragment responses may bypass layout-level security elements — ensure authorization runs on every request
- Fragment names should not contain sensitive information
- Bot detection must exclude crawlers from fragment responses
- Full-page HTML sent to bots preserves meta tags, structured data, and SEO elements

## Related Rules

- blade-fragments/05-rules.md: Return Full Page on First Request, Fragment on Subsequent
- blade-fragments/05-rules.md: Match Fragment Wrapper ID to Fragment Name
- blade-fragments/05-rules.md: Do Not Nest Fragments
- blade-fragments/05-rules.md: Always Serve Full-Page HTML to Bots
- blade-fragments/05-rules.md: Cache Fragment Responses Separately from Full-Page Responses
- blade-fragments/05-rules.md: Use Unique Fragment Names Per View

## Related Skills

- Component System: Create and Use Blade Components
- Template Inheritance: Implement Template Inheritance Hierarchy
- Rendering Performance: Profile and Optimize Slow View Rendering
- Layout Strategies: Implement Multi-Layout Strategy

## Success Criteria

- Navigation between pages updates only the content area without full page reload
- Initial page visit serves complete HTML with layout, header, and footer
- Bot crawlers always receive full-page HTML for correct indexing
- Fragment responses are independently cached with shorter TTLs than full pages
- No runtime errors from duplicate or nested fragment names
