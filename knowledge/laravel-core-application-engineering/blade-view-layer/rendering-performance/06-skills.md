# Skill: Profile and Optimize Slow View Rendering

## Purpose

Identify and eliminate performance bottlenecks in Blade view rendering, focusing on the 95% of render time dominated by data preparation rather than template execution.

## When To Use

- Pages taking >200ms to render
- N+1 queries detected in template loops
- Deep component nesting (4+ levels)
- Large collection rendering (1000+ items)
- Production deployment — always pre-compile views
- Pages with >50 components per view

## When NOT To Optimize

- Views rendering in <50ms (micro-optimizations are wasted effort)
- Before profiling with Laravel Debugbar or Telescope
- Template-level micro-optimizations (changing `@include` to component for performance)
- Single-component pages where overhead is negligible

## Prerequisites

- Laravel Debugbar or Telescope installed in development
- Identify which pages are slow (user reports, monitoring, or logging)
- Understanding of eager loading, view models, and caching

## Inputs

- Slow route or view name
- Profiling data (Debugbar timeline, query count, view render time)
- Template source files

## Workflow

1. Install Laravel Debugbar or Telescope to measure view rendering time and database query count
2. Identify whether the bottleneck is data preparation (95% likely: N+1 queries, slow queries) or template rendering (5% likely: deep nesting, expensive computations)
3. Fix N+1 queries by eager loading all relationships in the controller before calling `view()`: `Model::with('relation')->get()`
4. Remove any Eloquent queries, API calls, or raw SQL from `@php` blocks — move all data retrieval to controllers or services
5. Pre-compute formatted values (currency, dates, status badges) in view models instead of formatting inside `@foreach` loops
6. Cache rendered HTML for expensive, rarely-changing partials (sidebars, navigation) using `cache()->remember()`
7. Reduce component nesting and view composition depth to 3 levels maximum
8. Run `php artisan view:cache` during deployment to pre-compile all views

## Validation Checklist

- [ ] All database queries are eager-loaded before being passed to views
- [ ] No database queries or API calls exist inside `@php` blocks or templates
- [ ] Pre-computed view models handle all formatting (no inline `number_format`/`Str::limit`)
- [ ] Expensive, rarely-changing partials are cached
- [ ] View composition depth does not exceed 3 levels
- [ ] `php artisan view:cache` runs during deployment
- [ ] Slow view monitoring is configured (threshold < 100ms per view)
- [ ] No collection with >100 items is rendered without pagination
- [ ] Laravel Debugbar or Telescope shows view rendering time < 10ms per page

## Common Failures

- **Optimizing the wrong thing:** Micro-optimizing Blade syntax while N+1 queries cause 300ms delays. Always profile first — Blade is rarely the bottleneck.
- **Database queries in views:** Lazy loading relationships inside `@foreach` loops. Always eager load in the controller.
- **Inline formatting in loops:** `number_format()` and `Carbon::format()` inside `@foreach` multiply cost by collection size. Pre-compute in view models.
- **Overusing `@php` blocks:** Multiple `@php` blocks with data manipulation make templates unreadable and unprofileable. Move logic to view models.
- **Not pre-compiling views on deploy:** First user after deployment pays compilation penalty. Run `php artisan view:cache` during deployment.

## Decision Points

- Eager loading vs lazy loading: Always eager load in the controller. Only lazy-load for relationships conditionally displayed on a minority of pages, using `load()` not lazy loading in the view.
- View model pre-computation: Use when formatting appears inside loops or conditionals. Skip for simple variable interpolation on single-item views.

## Performance Considerations

- Total render time = Data preparation (95%) + Template execution (5%)
- Compilation: 2-10ms per unique view (happens once, cached)
- Compiled view execution: 0.1-1ms per view
- Component resolution: ~0.01ms class-based, ~0.001ms anonymous
- Network time dominates for large responses — paginate aggressively

## Security Considerations

- Compiled views are PHP files in `storage/framework/views/` — ensure this directory is not web-accessible
- View cache poisoning: if an attacker can write to views cache directory, they can execute arbitrary PHP
- Never render user-controlled template names — `view($userInput)` is a code injection vulnerability
- Monitor output size: excessively large responses can indicate data leaks

## Related Rules

- rendering-performance/05-rules.md: Eager Load All View Data Before Calling `view()`
- rendering-performance/05-rules.md: Never Write Database Queries Inside `@php` Blocks
- rendering-performance/05-rules.md: Pre-Compute Formatted Values in View Models
- rendering-performance/05-rules.md: Cache Rendered Partials for Expensive, Rarely-Changing Sections
- rendering-performance/05-rules.md: Pre-Compile All Views During Deployment
- rendering-performance/05-rules.md: Profile Before Optimizing Views
- rendering-performance/05-rules.md: Limit View Composition Depth to 3 Levels

## Related Skills

- View Models and Presenters: Implement View Models for Complex Template Data
- Component System: Create and Use Blade Components
- Blade Fragments: Implement Blade Fragment Responses for Turbo/HTMX Navigation
- Template Inheritance: Implement Template Inheritance Hierarchy

## Success Criteria

- Profiling shows view rendering time < 10ms per page (Blade execution)
- No database queries originate from template files — all data loaded in controllers
- All formatting is pre-computed, not done inline in loops
- Expensive partials are cached with appropriate TTLs
- View composition depth is at most 3 levels
- `php artisan view:cache` runs on every production deployment
