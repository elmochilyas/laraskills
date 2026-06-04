# Skill: Integrate Alpine.js with Blade Templates for Client-Side Interactivity

## Purpose

Add client-side interactivity (dropdowns, modals, toggles, form validation, live search) to Blade templates using Alpine.js without building a full frontend application.

## When To Use

- UI interactivity — dropdowns, modals, toggles, tabs, accordions
- Client-side form validation for immediate feedback before submission
- Client-side search/filter of server-rendered lists
- Inline editing (toggling between display and edit modes)
- AJAX-powered widgets fetching data from API endpoints

## When NOT To Use

- Server-dependent state that must persist (use Livewire)
- Complex frontend applications (use React/Vue/Inertia)
- Large dataset rendering (1000+ items in `x-for`)
- SEO-critical dynamic content (Alpine renders on client)
- Replacing Blade control structures — `@if`/`@foreach` still run on server

## Prerequisites

- Alpine.js loaded (CDN with `defer`, npm, or importmap)
- Blade template where interactivity is needed
- Basic understanding of `x-data`, `x-bind`, `x-on`, `x-show`

## Inputs

- Blade view file
- Alpine.js script tag or build dependency
- HTML structure to augment with interactivity

## Workflow

1. Load Alpine.js with `defer` attribute and nonce if CSP is enabled: `<script defer src="alpine.js" nonce="{{ csp_nonce() }}"></script>`
2. Define an Alpine component with `x-data="{ property: value }"` on a container element, keeping state objects under 5-8 properties
3. Use `x-show="condition"` for visibility toggling and `@click.away="property = false"` for dismissible overlays
4. Use `x-model` for two-way data binding on form inputs and `x-text` for output text
5. For server data, render HTML structure with Blade first, then add Alpine for client-side filtering or enhancement — do not replace Blade logic
6. If using Turbo Drive, add `Alpine.initTree(document.body)` on `turbo:load` event to reinitialize components after navigation
7. Use `@once` / `@endonce` when pushing Alpine-related scripts to stacks to prevent duplicate injection

## Validation Checklist

- [ ] Alpine components initialize correctly on page load
- [ ] `@click.away` is attached to all dropdown/overlay components
- [ ] No expensive API calls or computations block initialization in `x-init`
- [ ] Alpine reinitializes correctly after Turbo Drive navigation (if Turbo is used)
- [ ] Alpine and Livewire (if both used) have clear state boundaries — Alpine for client, Livewire for server
- [ ] CSP allows inline event handlers or uses nonce-based loading
- [ ] Server-rendered (Blade) and client-rendered (Alpine) content boundaries are clear
- [ ] `x-for` lists with 1000+ items are paginated or use Livewire instead

## Common Failures

- **Alpine state lost on reload:** Using `x-data` for data that should persist to the server. Use Livewire for server-persistent state; Alpine for ephemeral client state only.
- **Dropdown stays open on outside click:** Missing `@click.away="open = false"` on the dropdown container. Always add it.
- **Components break after navigation:** Turbo Drive replaces DOM but Alpine doesn't reinitialize. Add `Alpine.initTree(document.body)` on `turbo:load`.
- **Blank page or flash of unstyled content:** Alpine content visible before initialization. Use `x-cloak` with CSS `[x-cloak] { display: none }`.
- **Alpine not working due to CSP:** Inline event handlers blocked by Content Security Policy. Use nonce-based loading or `unsafe-inline`.

## Decision Points

- Alpine vs Livewire: Use Alpine for client-only UI state (toggles, validation, filtering). Use Livewire for state that must sync to the server (form submissions, auth-dependent UI).
- Alpine vs full JS framework: Use Alpine as progressive enhancement over server-rendered HTML. Use React/Vue/Inertia for complex SPAs with rich client state management.

## Performance Considerations

- Alpine adds ~10KB compressed JavaScript
- Each `x-data` component adds initialization overhead — keep under 20 per page for <5ms init time
- `x-for` with 1000+ items degrades performance — paginate or use Livewire for large lists
- Defer heavy operations from `x-init` using `$nextTick` or async `init()` methods

## Security Considerations

- Escape user data passed into Alpine expressions: `x-text="{{ e($userInput) }}"` not `x-text="{{ $userInput }}"`
- Sanitize any HTML inserted via Alpine `fetch()` responses before rendering
- Use nonce-based Alpine loading when CSP restricts inline scripts
- Alpine store data should not include sensitive information that persists across pages

## Related Rules

- blade-with-alpine/05-rules.md: Keep Alpine State Client-Only, Use Livewire for Server State
- blade-with-alpine/05-rules.md: Add `@click.away` to Every Dropdown and Overlay
- blade-with-alpine/05-rules.md: Keep Alpine Components Small and Focused
- blade-with-alpine/05-rules.md: Use CSP-Compatible Alpine Loading
- blade-with-alpine/05-rules.md: Reinitialize Alpine After Turbo Drive Navigation
- blade-with-alpine/05-rules.md: Avoid Expensive Operations in `x-init`
- blade-with-alpine/05-rules.md: Do Not Replace Blade Logic with Alpine

## Related Skills

- Component System: Create and Use Blade Components
- Slots and Stacks: Implement Content Injection with Slots and Stacks
- Service Injection: Use @inject for Non-Entity Read-Only Services
- Layout Strategies: Implement Multi-Layout Strategy

## Success Criteria

- Interactive UI elements (dropdowns, modals, toggles) work on page load and after navigation
- All dismissible overlays close on outside click
- Alpine state is purely client-side — no expectation of server persistence
- CSP is not weakened to accommodate Alpine
- No Blade template logic is replaced by Alpine rendering — structure comes from server
