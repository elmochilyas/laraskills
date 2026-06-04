# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Laravel Core Application Engineering |
| Subdomain | Livewire / Inertia Basics |
| Knowledge Unit | Livewire Islands Pattern |
| Difficulty Level | Expert |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

The Islands pattern renders isolated, interactive Livewire components within a mostly static HTML page. Instead of wrapping the entire page in a Livewire component (full-page component mode), the page is rendered as plain Blade, with individual Livewire components embedded as "islands" of interactivity. Each island is self-contained with its own state, lifecycle, and AJAX updates. The engineering value is performance: the initial page render is fast (plain Blade, no Livewire serialization overhead), and only the interactive components are hydrated.

---

## Core Concepts

- **Island**: A self-contained Livewire component embedded in a standard Blade view
- **Full-page vs Islands**: Full-page wraps the entire page in Livewire; Islands embed individual components
- **State isolation**: Each island has its own ID, snapshot, checksum, and Alpine scope
- **No shared state**: Islands do NOT share state — each must fetch data independently or receive as props
- **Rendering pipeline**: Blade renders the full page → each `<livewire:component>` tag resolves independently

---

## When To Use

- Content-heavy pages with a few interactive widgets (blog post + comment section + share widget)
- Marketing sites with static content and interactive forms
- Documentation pages with interactive code examples
- Pages where most content is static HTML and only specific sections need interactivity
- Any page where full-page Livewire would add unnecessary overhead

## When NOT To Use

- Admin panels where the entire page is interactive
- Dashboards with many interconnected components
- Pages where islands need to share state (use full-page component or events)
- Simple CRUD pages where full-page Livewire is simpler

---

## Best Practices

- **Use Islands for content-heavy pages** — blogs, docs, marketing, landing pages
- **Use full-page components for interactive pages** — admin panels, dashboards, CRUD forms
- **Keep islands independent** — each island should be self-contained with its own data fetching
- **Use `:key` for proper island identification** — prevents state mixups when lists re-render
- **Keep island templates focused** — only render the interactive portion, not the entire page layout
- **Consider lazy loading for below-the-fold islands** — combine `#[Lazy]` with Islands for maximum performance

---

## Architecture Guidelines

- Standard Blade layout with `@extends('layouts.app')` and `@section('content')`
- Islands embedded as `<livewire:comments :post="$post" :key="$post->id" />` in Blade
- Each island has its own: component ID, state snapshot, checksum, Alpine.js scope
- Island rendering: `boot()` → `mount()` → render → dehydrate → HTML sent independently
- Islands do NOT share state — use `$dispatch` for cross-island communication
- Full-page component mode wraps the ENTIRE page in a single Livewire component

---

## Performance

The initial page render is significantly faster with Islands (plain Blade) compared to full-page Livewire (which serializes the entire component state on initial load). Only the interactive islands incur Livewire's hydration/dehydration overhead. For a page with 80% static content and 20% interactive widgets, Islands can reduce initial payload by 80%.

---

## Security

Each island has its own security context: checksum verification, CSRF protection, and authorization. Islands cannot access each other's state — data must be passed explicitly via props or events. Props passed to islands are serialized in the page — avoid passing sensitive data as props.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Using full-page for static content | Default Livewire behavior | Unnecessary overhead | Use Islands for content pages |
| Islands trying to share state | Expecting global state | Doesn't work | Use events or props |
| Missing `:key` on island lists | No unique identifier | State mixed between items | Always use `:key` |
| Island too large | Embedding full page section | Island complexity defeats purpose | Keep islands focused on interactivity |
| No lazy loading for heavy islands | All islands eager-loaded | Many AJAX calls on page load | Use `#[Lazy]` for non-critical islands |

---

## Anti-Patterns

- **Island that renders the entire page**: If the island contains most of the page content, use full-page Livewire
- **Inter-island coupling via props**: Passing complex shared state between islands — use events instead
- **Islands without keys**: Lists of islands without unique `:key` attributes
- **Island inside Inertia page**: Mixing Livewire and Inertia on the same page

---

## Examples

**Layout with islands:**
```blade
@extends('layouts.app')

@section('content')
    <article>
        <h1>{{ $post->title }}</h1>
        <div class="content">{{ $post->body }}</div>
    </article>

    {{-- Interactive comment section island --}}
    <livewire:comments :post="$post" :key="$post->id" />

    {{-- Interactive share widget island --}}
    <livewire:share-widget :url="current()->url()" />
@endsection
```

**Island component:**
```php
class Comments extends Component
{
    public Post $post;
    public string $newComment = '';

    public function addComment(): void
    {
        $this->validate(['newComment' => 'required|min:2']);
        $this->post->comments()->create([
            'body' => $this->newComment,
            'user_id' => auth()->id(),
        ]);
        $this->newComment = '';
    }

    public function render(): View
    {
        return view('livewire.comments', [
            'comments' => $this->post->comments()->latest()->get(),
        ]);
    }
}
```

---

## Related Topics

- livewire/component-architecture — Component fundamentals
- livewire/lazy-loading — Combining lazy loading with Islands
- livewire/actions-events — Cross-island communication via events
- stack-selection-guide — When to use Livewire vs other approaches

---

## AI Agent Notes

- Islands are Livewire components embedded in plain Blade views
- Each island has its own component ID, state snapshot, checksum, and Alpine scope
- Islands do NOT share state — use `$dispatch` for cross-island communication
- Full-page component mode wraps the entire page in Livewire; Islands are lighter
- `:key` attribute is essential for proper island identification in lists
- Combination of `#[Lazy]` + Islands is optimal for content-heavy pages

---

## Verification

- [ ] Content-heavy pages use Islands, not full-page Livewire
- [ ] Each island is self-contained with its own data fetching
- [ ] No shared state between islands (use events if needed)
- [ ] `:key` attribute on all island instances
- [ ] Islands focused on interactive portions, not entire page
- [ ] Lazy loading considered for below-the-fold islands
- [ ] No Livewire inside Inertia (or vice versa)
- [ ] Initial page render performance measured and improved
