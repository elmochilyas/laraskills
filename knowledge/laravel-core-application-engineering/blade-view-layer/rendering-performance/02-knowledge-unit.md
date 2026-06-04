# Rendering Performance

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Rendering Performance
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary

Blade rendering performance is determined by view compilation, template complexity, data preparation, and output size. Blade compiles templates to flat PHP once and caches them — the runtime cost is typically dominated by data retrieval (database queries, API calls), not template rendering itself. However, excessive components, deep inheritance chains, and expensive view logic can degrade performance.

The engineering principle: **views should be dumb and fast**. All data preparation (queries, computation, formatting) should happen before the view receives data. The view's job is to iterate over prepared data and output HTML — nothing more. When rendering becomes slow, the fix is almost always in the data preparation layer, not the template.

---

## Core Concepts

### Compilation Caching

Blade compiles `.blade.php` files to cached PHP files:

```
resources/views/users/index.blade.php
  → storage/framework/views/abc123.php (compiled)
```

Compilation happens on first access after cache clear. Subsequent requests serve the compiled file directly — zero parsing overhead.

### View Data Preparation Cost

The dominant cost is data retrieval before rendering:

```
Total render time = Data preparation (queries, computations) + Template execution (PHP)
                   ↑ 95% of total                       ↑ 5% of total
```

### Partial Rendering Overhead

Each `@include`, component, or partial adds PHP method call overhead. Deep nesting (components including components including partials) increases execution time linearly with inclusion depth.

---

## Mental Models

### The Factory

Think of the controller/service as the factory that produces finished parts (data). The view is the assembly line that puts them together. If the assembly line is slow, it's usually because the parts are not ready (data not prepared) or there are too many stations (deep composition).

### The Compilation Freeze

Blade compilation is like freezing food. The first time you cook (compile), it takes time. After that, you just reheat (execute the cached PHP). Compilation caching means production performance is always in "reheat" mode.

---

## Internal Mechanics

### Compilation Pipeline

When a view is rendered:

1. Check if compiled view exists in `storage/framework/views/`
2. If not, compile the Blade template:
   - Parse `@directives` → transform to PHP
   - Handle `@extends`, `@include`, `@component` → load and inline dependencies
   - Write compiled PHP to cache file
3. Execute the compiled PHP
4. Return rendered HTML string

Step 2 is the expensive step (2-10ms per unique view). Steps 3-4 are fast (0.1-1ms for typical views).

### Inheritance Compilation

When a child view extends a parent layout:

1. Child template is compiled, storing `@section` blocks as content variables
2. Parent layout is compiled
3. `@yield` calls in the parent are replaced with child's section content
4. Combined compiled output is cached as a single file

There is no runtime inheritance traversal — the compiled output is flat PHP.

### Component Resolution Overhead

Each component usage adds:
- Service container resolution (class-based components)
- Constructor execution (dependency injection + prop assignment)
- View rendering for the component's template
- Slot processing

For 20 components per page, overhead is ~0.2-0.5ms total (class-based) or ~0.05ms (anonymous).

---

## Patterns

### Eager Load View Data

Load all data before calling `view()`:

```php
// Bad — lazy loading in view
class UserController
{
    public function show(User $user): View
    {
        return view('users.show', compact('user'));
    }
}

// In view: $user->posts (N+1 query)

// Good — eager load before view
class UserController
{
    public function show(User $user): View
    {
        $user->load('posts.comments', 'profile');
        return view('users.show', compact('user'));
    }
}
```

### Pre-Compute View Models

Compute all formatted values before passing to the view:

```php
class OrderShowViewModel
{
    public function __construct(public Order $order)
    {
        // Pre-compute in constructor, not lazily
        $this->formattedTotal = '$' . number_format($order->total / 100, 2);
        $this->itemsCount = $order->items->count();
        $this->canCancel = in_array($order->status, ['pending', 'processing']);
    }
}
```

### Cache Rendered Partials

Cache expensive partials that rarely change:

```php
class SettingsController
{
    public function show(): View
    {
        // The sidebar is cached separately
        $sidebar = cache()->remember('sidebar_html', 3600, function () {
            return view('partials.sidebar')->render();
        });

        return view('settings.show', compact('sidebar'));
    }
}
```

### Profile, Then Optimize

Measure before optimizing. Use Laravel Debugbar or Clockwork to identify slow views:

```php
// Check which views are slow via Debugbar
// Debugbar shows: view name, render time, data size
```

---

## Architectural Decisions

### View Composition Depth

| Depth | Performance | Maintainability |
|---|---|---|
| Flat (1-level includes) | Fastest | Moderate (all in one file) |
| Moderate (2-3 levels) | Fast | Good (reasonable separation) |
| Deep (4+ levels) | Noticeable overhead | Poor (hard to trace) |

Limit view composition to 3 levels. Deeper nesting indicates overly fragmented templates.

### Component vs @include

| Concern | Component | @include |
|---|---|---|
| Resolution overhead | Higher (container + constructor) | Minimal (include file) |
| Scope isolation | Full (props only) | Partial (inherits parent scope) |
| Slot processing | Yes (adds overhead) | No |

Use `@include` for simple, stateless partials. Use components for stateful or scoped UI pieces.

---

## Tradeoffs

| Optimization | Performance Gain | Development Cost |
|---|---|---|
| Eager loading | High (eliminates N+1) | Low (add ->with()) |
| View model pre-computation | Medium (avoids lazy calc) | Low (compute in constructor) |
| Cache rendered partials | High (for expensive partials) | Medium (cache management) |
| Reduce component depth | Low (saves ~0.01ms) | Medium (refactoring) |
| Pre-compile all views | Medium (saves first-hit latency) | Low (php artisan view:cache) |

---

## Performance Considerations

### Baseline Benchmarks

Measured on a typical Laravel application:

| Operation | Time |
|---|---|
| Compile a simple view | 2-5ms |
| Render a compiled view | 0.1-0.5ms |
| Render with 10 components | 0.3-1ms |
| Render with 50 components | 1-5ms |
| Render with 10 partial includes | 0.2-0.8ms |
| Render a 500KB view output | 1-3ms |

### View Output Size

| Output Size | Render Time | Network Time (1Mbps) |
|---|---|---|
| 50KB (typical page) | 0.5ms | 400ms |
| 200KB (rich page) | 2ms | 1.6s |
| 1MB (heavy page) | 10ms | 8s |

Network time dominates for large responses. Pagination and lazy loading reduce output size.

---

## Production Considerations

### Pre-Compile Views on Deploy

Run `php artisan view:cache` during deployment to pre-compile all views:

```bash
php artisan view:cache
# Creates cached compiled views for ALL registered view paths
```

This eliminates compilation latency on first request after deployment.

### Monitor View Render Time

Add monitoring for slow views:

```php
// In AppServiceProvider or middleware
View::composer('*', function ($view) {
    $start = microtime(true);

    // After rendering
    register_shutdown_function(function () use ($start, $view) {
        $time = (microtime(true) - $start) * 1000;
        if ($time > 100) { // 100ms threshold
            Log::warning("Slow view: {$view->name()} took {$time}ms");
        }
    });
});
```

### Asset Minification

Minify CSS and JS to reduce output size. Use Vite or Mix for bundling and minification:

```bash
npm run build  # Vite — produces minified, versioned assets
```

---

## Common Mistakes

### Expensive Operations in @php Blocks

```blade
{{-- Bad — database query inside view --}}
@php
    $stats = DB::table('orders')->selectRaw('count(*), sum(total)')->first();
@endphp
<p>Orders: {{ $stats->count }}</p>
```

All database queries and business logic belong in controllers/services, not views.

### Unoptimized Loops

Processing data inside `@foreach` instead of preparing it beforehand:

```blade
{{-- Bad — formatting in loop --}}
@foreach ($orders as $order)
    <li>{{ number_format($order->total / 100, 2) }}</li>
@endforeach

{{-- Good — pre-formatted data --}}
@foreach ($formattedOrders as $order)
    <li>{{ $order->formattedTotal }}</li>
@endforeach
```

### Overuse of @php

Every `@php` block in a view is a code smell. Move logic to controllers, services, or view models.

---

## Failure Modes

### View Cache Not Invalidated

When a view changes, Blade detects the file modification timestamp and recompiles automatically. If the server's filesystem reports incorrect timestamps (NFS, Docker bind mounts), views may serve stale content or fail to recompile. Use `php artisan view:clear` to force recompilation.

### Large Collection Rendering

Rendering a collection of 10,000 items in Blade produces a 1-5MB HTML response, consuming 50-200ms render time and substantial memory. Always paginate large collections.

---

## Ecosystem Usage

Rendering performance optimization is a first-class concern in the Laravel ecosystem, with multiple tools and packages available to profile and optimize view rendering. Laravel Debugbar and Laravel Telescope provide detailed view rendering metrics including compile time, render time, memory usage, and view inheritance chains. Packages like `laravel-query-detector` and `beyondcode/laravel-view-debugbar` help identify N+1 queries and slow partials that degrade rendering performance.

The ecosystem has standardized on pre-deployment view compilation through deployment tools like Laravel Forge, Envoyer, and Vapor, all of which run `php artisan view:cache` as part of their deployment scripts. The community has also adopted edge-side rendering optimization through Vapor's CDN caching and the use of HTTP cache headers for fragment-cached views. The consensus across the ecosystem is that data preparation optimization (eager loading, view models, cached queries) yields 10-100x more impact than template-level micro-optimizations.

## Related Knowledge Units

- **Template Inheritance** (this workspace) — inheritance compilation
- **Component System** (this workspace) — component rendering overhead
- **View Models / Presenters** (this workspace) — pre-computation strategy
- **Caching Strategies** (Data & Storage) — cache for rendered views

---

## Research Notes

- Blade uses xxh128 hashing for compiled file path generation → `storage/framework/views/{hash}.php`
- The `view:cache` command compiles ALL views, regardless of whether they are used; for applications with thousands of views, this can take 30-60s
- The worst-case rendering scenario is a deeply nested component tree with lazy data access in each component
- Production analysis: 90% of slow view issues are caused by N+1 queries in the view, not by template rendering itself
