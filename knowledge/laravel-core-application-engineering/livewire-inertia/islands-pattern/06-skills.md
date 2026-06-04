# Skill: Implement the Islands Pattern for Content-Heavy Pages

## Purpose

Embed isolated Livewire components ("islands") in a standard Blade view for content-heavy pages, keeping most of the page as static HTML while adding interactivity only where needed.

## When To Use

- Content-heavy pages with a few interactive widgets (blog post + comments + share widget)
- Marketing sites with static content and interactive forms
- Documentation pages with interactive code examples
- Any page where most content is static HTML and only specific sections need interactivity

## When NOT To Use

- Admin panels where the entire page is interactive (use full-page Livewire)
- Dashboards with many interconnected components (use full-page Livewire)
- Pages where islands need to share state directly (use full-page component or events)
- Simple CRUD pages where full-page Livewire is simpler

## Prerequisites

- Livewire installed
- Standard Blade layout (not full-page component mode)
- Understanding of component isolation

## Inputs

- Page layout (static content areas)
- Interactive elements that need Livewire
- Props to pass to each island

## Workflow

1. Create a standard Blade view extending a layout — no full-page Livewire component
2. Identify which page sections need interactivity (forms, comments, search, share widgets)
3. Create Livewire components for each interactive section — keep them independent
4. Embed islands in the Blade view using `<livewire:tag>` syntax:
   ```blade
   @extends('layouts.app')
   @section('content')
       <article>
           <h1>{{ $post->title }}</h1>
           <div class="content">{{ $post->body }}</div>
       </article>
       <livewire:comments :post="$post" :key="$post->id" />
       <livewire:share-widget :url="current()->url()" />
   @endsection
   ```
5. Keep island templates focused on the interactive portion — don't include page shell (header, footer, sidebar)
6. Use `:key` attribute on every island rendered in a loop to maintain correct state
7. Keep islands self-contained — each fetches its own data or receives it via props
8. Use `$dispatch` for cross-island communication if needed — never share state directly
9. Consider adding `#[Lazy]` for below-the-fold islands to further improve performance
10. Never embed Livewire in an Inertia page or vice versa

## Validation Checklist

- [ ] Content-heavy pages use Islands, not full-page Livewire
- [ ] Each island is self-contained with its own data fetching
- [ ] No shared state between islands (use `$dispatch` events if communication needed)
- [ ] `:key` attribute on all island instances (especially in loops — never use loop index)
- [ ] Islands focused on interactive portions only, not the full page layout
- [ ] Lazy loading considered for below-the-fold islands
- [ ] No Livewire embedded inside Inertia (or vice versa)

## Common Failures

- Using full-page Livewire for static content — unnecessary serialization overhead
- Islands trying to share state directly — doesn't work, components are isolated
- Missing `:key` on island lists — state corrupted when list order changes
- Island template includes page shell (header, footer) — duplicated HTML, CSS conflicts
- No lazy loading for heavy islands — many AJAX calls on page load

## Decision Points

- Use Islands for pages where >50% of content is static HTML. Use full-page Livewire for pages where >50% is interactive
- Use `:key` with stable identifiers (model IDs) — never use loop index
- Combine `#[Lazy]` with islands for below-the-fold content; keep above-the-fold islands eager

## Performance Considerations

Initial page render is significantly faster with Islands (plain Blade) compared to full-page Livewire (which serializes entire component state). Only the interactive islands incur Livewire's hydration/dehydration overhead. For an 80% static / 20% interactive page, Islands can reduce initial payload by 80%.

## Security Considerations

Each island has its own security context: checksum verification, CSRF protection, and authorization. Islands cannot access each other's state — data must be passed explicitly via props or events. Avoid passing sensitive data as island props (they're serialized in the page).

## Related Rules

- Choose Islands for Content Pages (05-rules.md)
- Keep Islands Self-Contained (05-rules.md)
- Always Use :key on Island Lists (05-rules.md)
- Keep Island Templates Focused (05-rules.md)
- Combine Islands with Lazy Loading (05-rules.md)
- Never Mix Livewire and Inertia on the Same Page (05-rules.md)

## Related Skills

- Defer Expensive Components with Lazy Loading (livewire/lazy-loading)
- Create a Well-Structured Livewire Component (livewire/component-architecture)
- Implement Route-Level Stack Segregation (hybrid-approaches)

## Success Criteria

- Content-heavy pages render mostly as static Blade HTML
- Interactive islands load independently with their own state and lifecycle
- No duplicated HTML or CSS conflicts from islands rendering page shell
- Island state remains correct when list order changes (thanks to `:key`)
- Cross-island communication works via `$dispatch` where needed
- Above-the-fold islands are eager; below-the-fold islands may use `#[Lazy]`
