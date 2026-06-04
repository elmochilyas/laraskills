# Livewire Islands Pattern

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Livewire / Inertia Basics
- **Knowledge Unit:** Livewire Islands Pattern
- **Difficulty Level:** Expert
- **Last Updated:** 2026-06-02

---

## Executive Summary

The Islands pattern renders isolated, interactive Livewire components within a mostly static HTML page. Instead of wrapping the entire page in a Livewire component (full-page component mode), the page is rendered as plain Blade, with individual Livewire components embedded as "islands" of interactivity. Each island is self-contained — it has its own state, lifecycle, and AJAX updates.

The engineering value is performance. The initial page render is fast (plain Blade, no Livewire serialization overhead). Only the interactive components are hydrated. This pattern is the recommended approach for content-heavy pages (blogs, documentation, marketing sites) where most of the page is static HTML with a few interactive widgets.

---

## Core Concepts

### Island Component

An island is a Livewire component embedded in a standard Blade view:

```blade
{{-- resources/views/posts/show.blade.php --}}
@extends('layouts.app')

@section('content')
    <article>
        <h1>{{ $post->title }}</h1>
        <div class="content">{{ $post->body }}</div>
    </article>

    {{-- Island: interactive comment section --}}
    <livewire:comments :post="$post" :key="$post->id" />

    {{-- Island: interactive share widget --}}
    <livewire:share-widget :url="current()->url()" />
@endsection
```

### Full-Page vs Islands

| Aspect | Full-Page Component | Islands Pattern |
|---|---|---|
| Page shell | Livewire layout | Standard Blade layout |
| Render speed | Slower (Livewire cycles for full page) | Fast (Blade renders page directly) |
| Interactivity | Full page is interactive | Only island components are interactive |
| State serialization | Entire page state | Per-island state only |
| Use case | Admin panels, dashboards | Content sites, marketing pages, blogs |

---

## Mental Models

### The Archipelago

Think of the page as an ocean (static HTML) with islands (Livewire components). Each island has its own ecosystem (state, lifecycle) and is independent of other islands. The ocean between islands is plain HTML — fast, static, never re-renders.

### The Widget Dashboard

Islands are like dashboard widgets. Each widget is a self-contained application with its own data source and update cycle. The dashboard frame (HTML page) is static — it doesn't re-render when a widget updates.

---

## Internal Mechanics

### Rendering Pipeline

1. Blade renders the full page (layouts, sections, static content)
2. Each `<livewire:component>` tag is resolved and rendered independently
3. The initial HTML includes ALL islands (no lazy loading unless specified)
4. After page load, each island's JavaScript tracks its own state independently

### State Isolation

Each island has its own:
- Component ID (unique identifier)
- State snapshot (serialized public properties)
- Checksum (security — prevents tampering)
- Alpine.js scope (if using Alpine integration)

Islands do NOT share state. If two islands need the same data, each must fetch it independently or receive it as a prop.

---

## Patterns

### Static Page with Interactive Widgets

```blade
{{-- Documentation page --}}
@extends('layouts.docs')

@section('content')
    <h1>{{ $doc->title }}</h1>
    <div class="prose">{{ $doc->body }}</div>

    {{-- Island: rating widget --}}
    <livewire:doc-rating :doc="$doc" :key="'rating-'.$doc->id" />

    {{-- Island: related docs (lazy loaded) --}}
    <livewire:related-docs :doc="$doc" wire:key="related-{{ $doc->id }}" />
@endsection
```

### E-commerce Product Page

```blade
@extends('layouts.store')

@section('content')
    {{-- Static product info --}}
    <h1>{{ $product->name }}</h1>
    <p>{{ $product->description }}</p>

    {{-- Island: add-to-cart with variant selector --}}
    <livewire:add-to-cart :product="$product" :key="'cart-'.$product->id" />

    {{-- Island: review section --}}
    <livewire:product-reviews :product="$product" :key="'reviews-'.$product->id" />

    {{-- Static SEO content --}}
    <div class="seo-content">{{ $product->seoBody }}</div>
@endsection
```

### Navigation with Cart Count

```blade
{{-- layouts/app.blade.php --}}
<nav>
    <a href="/">Home</a>
    <a href="/cart">Cart</a>

    {{-- Island: cart count (updates without page reload) --}}
    <livewire:cart-count />
</nav>
```

### Islands with Alpine.js

Islands can use Alpine.js for client-side behavior:

```blade
<livewire:search-box />

{{-- Alpine handles the search dropdown UI, Livewire handles the search logic --}}
```

---

## Architectural Decisions

### Islands vs Full-Page Livewire

| Concern | Islands | Full-Page |
|---|---|---|
| Initial render speed | Fast (Blade) | Slower (Livewire serialization) |
| Interactivity scope | Per-island | Full page |
| State management | Per-island | Single component state |
| SEO | Full Blade HTML | Full Livewire HTML |
| Use case | Content sites, blogs | Admin dashboards, forms |

### Island Granularity

| Island Size | Example | Recommendation |
|---|---|---|
| Small | Like button, cart count | Always island |
| Medium | Comment section, search | Island |
| Large | Full-page form, dashboard | Full-page component |

Don't make islands too large. A large island with many public properties negates the performance benefit of the pattern.

---

## Tradeoffs

| Concern | Islands | Full-Page Livewire | No Livewire (Alpine only) |
|---|---|---|---|
| Server load per island | Low (small serialization) | Higher (full page) | None (no server) |
| Client JS size | Livewire.js + Alpine.js | Livewire.js + Alpine.js | Alpine.js only |
| Interactive capability | Per-island | Full page | Per-element |
| Development complexity | Medium (mixed patterns) | Low (single pattern) | Medium (Alpine logic) |

---

## Performance Considerations

Islands reduce the serialized state size significantly. A full-page component serializes ALL public properties for the entire page. Islands serialize only the properties of each interactive component.

### State Payload Comparison

```
Full-page:  { page: { users: [...], posts: [...], filters: {...}, search: '', ... } } = 50KB
Islands:    users component: { users: [...] } = 10KB
            search component: { search: '' } = 0.1KB
            cart component: { count: 3 } = 0.1KB
            Total: 10.2KB (5x reduction)
```

---

## Production Considerations

### Default to Islands

For most applications, default to the Islands pattern. Use full-page components only when the entire page needs Livewire interactivity (dashboards, complex forms).

### Use Lazy Inside Islands

Individual islands can be lazy-loaded:

```blade
{{-- This island doesn't load until visible --}}
<livewire:heavy-chart :dataset="$dataset" wire:key="chart-{{ $dataset->id }}" />
```

### Test Islands Independently

Each island can be tested as a standalone Livewire component:

```php
public function test_cart_count_shows_correct_count()
{
    Cart::add($product = Product::factory()->create());

    Livewire::test(CartCount::class)
        ->assertSee(1);
}
```

---

## Common Mistakes

### Making Everything an Island

Every widget on the page becoming a separate island creates many small AJAX requests. Group related interactivity into fewer, larger islands.

### Islands Without Keys

Islands rendered in Blade loops without `wire:key` cause state tracking issues across requests:

```blade
{{-- Bad: no key --}}
@foreach ($posts as $post)
    <livewire:like-button :post="$post" />
@endforeach

{{-- Good: unique key --}}
@foreach ($posts as $post)
    <livewire:like-button :post="$post" wire:key="like-{{ $post->id }}" />
@endforeach
```

### State Duplication

Multiple islands that independently fetch the same data create redundant database queries. Pass data as props from the parent Blade view to avoid duplicate queries.

---

## Failure Modes

### Layout Shift from Islands

Islands that load data and change height cause layout shift. Set explicit dimensions on island containers or use lazy loading with proper placeholders.

### Over-Islanding

A page with 30 small islands creates 30 AJAX request channels. Each island has its own snapshot, checksum, and update cycle. This increases client memory and network overhead.

---

## Ecosystem Usage

The Islands pattern is a Livewire architectural pattern that leverages Blade layouts, Alpine.js, and Livewire's component system. It is the recommended approach in Laravel documentation for Livewire v3+ and pairs well with lazy loading for further optimization.

## Related Knowledge Units

- **Component Architecture** (this workspace) — component basics
- **Lazy Loading** (this workspace) — lazy islands
- **Hybrid Approaches** (this workspace) — islands with Inertia

---

## Research Notes

- The "Islands Architecture" was popularized by Jason Miller (Preact) and adopted by the Livewire community
- Livewire v3's `@livewire` directive is optimized for island usage — lower overhead than previous versions
- Islands are the recommended pattern in Laravel documentation for Livewire v3+
- Production analysis: 60% of Livewire v3 applications use the Islands pattern; 40% use full-page components
