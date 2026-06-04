# Rendering Performance

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Rendering Performance
- **Difficulty Level:** Advanced
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Blade rendering performance is determined by view compilation, template complexity, data preparation, and output size. Blade compiles templates to flat PHP once and caches them — the runtime cost is typically dominated by data retrieval (database queries, API calls), not template rendering itself. Excessive components, deep inheritance chains, and expensive view logic can degrade performance.

**Engineering principle:** Views should be dumb and fast. All data preparation (queries, computation, formatting) should happen before the view receives data. The view's job is to iterate over prepared data and output HTML. When rendering becomes slow, the fix is almost always in the data preparation layer, not the template.

---

## Core Concepts

### Compilation Caching
```
resources/views/users/index.blade.php
  → storage/framework/views/abc123.php (compiled PHP)
```
Compilation happens on first access after cache clear. Subsequent requests serve the compiled file directly — zero parsing overhead.

### View Data Preparation Cost
```
Total render time = Data preparation (queries, computations) + Template execution (PHP)
                   ↑ 95% of total                       ↑ 5% of total
```

### Compilation Pipeline
1. Check if compiled view exists in cache
2. If not, compile: parse directives, handle `@extends`/`@include`/`@component`, write compiled PHP
3. Execute compiled PHP
4. Return rendered HTML string

Step 2 is expensive (2-10ms per unique view). Steps 3-4 are fast (0.1-1ms).

### Inheritance Compilation
When a child extends a parent:
1. Child compiles, storing `@section` blocks as content variables
2. Parent layout is compiled
3. `@yield` calls replaced with child's section content
4. Single compiled file cached — no runtime inheritance traversal

### Component Resolution Overhead
Each component adds:
- Service container resolution (class-based components)
- Constructor execution
- View rendering for component template
- Slot processing

For 20 components per page: ~0.2-0.5ms (class-based) or ~0.05ms (anonymous).

---

## When To Use Performance Optimization

- Pages taking >200ms to render — profile first, optimize second
- N+1 queries detected — most common cause of slow views
- Deep component nesting (4+ levels) — each level adds overhead
- Large collection rendering (1000+ items) — paginate or virtualize
- Production deployment — always run `php artisan view:cache`
- Pages with >50 components — component resolution adds up

---

## When NOT To Optimize

- Premature optimization — views rendering in <50ms don't need micro-optimizations
- Single-component pages — component resolution overhead is negligible
- Before profiling — never optimize without data; Blade is rarely the bottleneck
- Template-level micro-optimizations — changing `@include` to component or vice versa for performance is wasted effort

---

## Best Practices (WHY)

**WHY eager load all view data before calling view().** Lazy loading (`$user->posts` in the template) creates N+1 queries. Each query adds 1-5ms. Loading all relationships before rendering eliminates this. The fix is always in the controller, not the view.

**WHY pre-compute view models.** Formatting currency, computing status badges, and preparing conditional values in the template adds PHP execution time to every loop iteration. Pre-compute these in a view model's constructor — the cost is paid once, not per item.

**WHY cache rendered partials for expensive, rarely-changing sections.** A sidebar with dynamic navigation queries the database on every page render. Cache the rendered HTML for 3600 seconds. The sidebar changes rarely but is displayed on every page — caching eliminates the query cost on every request.

**WHY limit view composition depth to 3 levels.** Each level of @include or component adds method call overhead and file resolution. Deep nesting (4+ levels) adds measurable overhead. If you need more depth, consider flatter composition.

**WHY profile before optimizing.** Without measurement, you will optimize the wrong thing. Use Laravel Debugbar or Telescope to identify which views are slow and why. 90% of slow view issues are N+1 queries, not template rendering.

**WHY pre-compile all views on deploy.** `php artisan view:cache` compiles all views during deployment, eliminating compilation latency on first request after deploy. This prevents the first-user-pays penalty.

---

## Architecture Guidelines

### View Composition Depth
| Depth | Performance | Maintainability |
|---|---|---|
| Flat (1-level includes) | Fastest | Moderate |
| Moderate (2-3 levels) | Fast | Good |
| Deep (4+ levels) | Noticeable overhead | Poor |

### Component vs @include Performance
| Concern | Component | @include |
|---|---|---|
| Resolution overhead | Higher (container + constructor) | Minimal (include file) |
| Scope isolation | Full (props only) | Partial (inherits scope) |
| Slot processing | Yes (adds overhead) | No |

Use @include for simple partials. Use components for scoped UI pieces.

### Baseline Benchmarks
| Operation | Time |
|---|---|
| Compile a simple view | 2-5ms |
| Render a compiled view | 0.1-0.5ms |
| Render with 10 components | 0.3-1ms |
| Render with 50 components | 1-5ms |
| Render a 500KB view output | 1-3ms |

### Output Size Impact
| Output Size | Render Time | Network Time (1Mbps) |
|---|---|---|
| 50KB (typical page) | 0.5ms | 400ms |
| 200KB (rich page) | 2ms | 1.6s |
| 1MB (heavy page) | 10ms | 8s |

Network time dominates for large responses. Pagination and lazy loading reduce output size.

---

## Performance

### Optimization Impact
| Optimization | Performance Gain | Development Cost |
|---|---|---|
| Eager loading | High (eliminates N+1) | Low |
| View model pre-computation | Medium | Low |
| Cache rendered partials | High (for expensive partials) | Medium |
| Reduce component depth | Low (saves ~0.01ms) | Medium |
| Pre-compile all views | Medium (first-hit latency) | Low |

---

## Security

- Compiled views are PHP files in `storage/framework/views/` — ensure this directory is not web-accessible
- View cache poisoning: if an attacker can write to the views cache directory, they can execute arbitrary PHP
- Never render user-controlled template names or paths — `view($userInput)` is a code injection vulnerability
- Output size monitoring: excessively large responses can indicate data leaks (e.g., serializing entire database)

---

## Common Mistakes

### 1. Database queries in views (N+1)
- **Description:** Eloquent relationship accessed inside a @foreach loop
- **Cause:** Passing a model to the view without eager loading
- **Consequence:** Each loop iteration executes a separate query
- **Better:** `$user->load('posts.comments')` in the controller before passing to view

### 2. Expensive operations in @php blocks
- **Description:** Database queries, API calls inside `@php` / `@endphp` in the template
- **Cause:** Convenience — "just this one query" in the view
- **Consequence:** Query runs on every render; impossible to cache or optimize from outside the template
- **Better:** Move all queries to controllers/services; views should only iterate and display

### 3. Unoptimized loops with formatting
- **Description:** `number_format()`, `Carbon::format()`, `Str::limit()` inside @foreach
- **Cause:** Formatting data in the template instead of pre-computing
- **Consequence:** Computation cost multiplied by collection size; repeated for every render
- **Better:** Pre-compute formatted values in view model or controller

### 4. Overusing @php
- **Description:** Multiple `@php` blocks throughout the template for data manipulation
- **Cause:** Treating Blade templates like PHP scripts instead of presentation files
- **Consequence:** Template becomes unreadable; logic cannot be tested; performance hard to profile
- **Better:** Each @php block is a code smell — move logic to view models, services, or controllers

### 5. Stale compiled views
- **Description:** View file changed but compiled cache serves old version
- **Cause:** Filesystem timestamp issues (NFS, Docker bind mounts)
- **Consequence:** Stale HTML served to users; changes not reflected
- **Better:** Run `php artisan view:clear` after template changes; verify mtime detection works

---

## Anti-Patterns

- **Profiling without fixing N+1 first.** N+1 queries account for 90% of slow view issues. Fix those before looking at anything else.
- **Micro-optimizing Blade syntax.** Whether you use `@include` or `<x-component>` matters less than whether you query the database 100 times in a loop.
- **Caching entire view responses without invalidation strategy.** Cached full-page HTML is fast, but stale cached pages confuse users. Use fragment caching or cache tags.
- **Rendering 10,000 rows in a table.** The browser will struggle to render 10,000 DOM nodes regardless of how fast Blade produces them. Paginate at 25-50 per page.
- **View-level caching of data that changes per user.** Cached view data that doesn't account for user context shows wrong information.

---

## Examples

### Eager Loading Before View
```php
// Bad — lazy loading in view triggers N+1
public function show(User $user): View
{
    return view('users.show', compact('user'));
}

// Good — eager load before view
public function show(User $user): View
{
    $user->load('posts.comments', 'profile');
    return view('users.show', compact('user'));
}
```

### Pre-Computed View Model
```php
class OrderShowViewModel
{
    public string $formattedTotal;
    public int $itemsCount;
    public bool $canCancel;

    public function __construct(public Order $order)
    {
        // Pre-compute in constructor, not lazily
        $this->formattedTotal = '$' . number_format($order->total / 100, 2);
        $this->itemsCount = $order->items->count();
        $this->canCancel = in_array($order->status, ['pending', 'processing']);
    }
}
```

### Cache Rendered Partial
```php
class SettingsController
{
    public function show(): View
    {
        $sidebar = cache()->remember('sidebar_html', 3600, function () {
            return view('partials.sidebar')->render();
        });

        return view('settings.show', compact('sidebar'));
    }
}
```

### Monitor Slow Views
```php
// In AppServiceProvider or middleware
View::composer('*', function ($view) {
    $start = microtime(true);

    register_shutdown_function(function () use ($start, $view) {
        $time = (microtime(true) - $start) * 1000;
        if ($time > 100) {
            Log::warning("Slow view: {$view->name()} took {$time}ms");
        }
    });
});
```

---

## Related Topics

- **Template Inheritance** — inheritance compilation performance
- **Component System** — component rendering overhead
- **View Models / Presenters** — pre-computation strategy
- **Caching Strategies** (Data and Storage) — cache for rendered views
- **Blade Fragments** — bandwidth vs server CPU tradeoffs
- **Custom Directives** — compile-time vs runtime cost

---

## AI Agent Notes

- Blade uses xxh128 hashing for compiled file path: `storage/framework/views/{hash}.php`
- `php artisan view:cache` compiles ALL views — can take 30-60s for thousands of views
- Worst-case rendering: deeply nested component tree with lazy data access in each component
- 90% of slow view issues are caused by N+1 queries, not template rendering
- View compilation happens once per unique view; rendered output is cached on first access
- `View::exists('name')` checks for view existence without rendering
- `view:clear` removes all compiled view files; `view:cache` pre-compiles all
- Compiled views are auto-recompiled when the source file's mtime changes

---

## Verification

- [ ] All database queries are eager-loaded before being passed to views
- [ ] No database queries or API calls exist inside @php blocks or templates
- [ ] Pre-computed view models handle all formatting (no inline number_format/Str::limit)
- [ ] Expensive, rarely-changing partials are cached
- [ ] View composition depth does not exceed 3 levels
- [ ] `php artisan view:cache` runs during deployment
- [ ] Slow view monitoring is configured (threshold < 100ms per view)
- [ ] No collection with >100 items is rendered without pagination
- [ ] Laravel Debugbar or Telescope shows view rendering time < 10ms per page
- [ ] Compiled views directory is not web-accessible
