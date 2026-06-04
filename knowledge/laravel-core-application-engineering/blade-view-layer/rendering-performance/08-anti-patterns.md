# ECC Anti-Patterns — Rendering Performance

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Laravel Core Application Engineering |
| **Subdomain** | Blade / View Layer |
| **Knowledge Unit** | Rendering Performance |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Database Queries Inside `@php` Blocks (Hidden N+1)
2. Formatting Inside `@foreach` Loops (Per-Item Computation)
3. Optimizing Without Profiling (Wrong Bottleneck)
4. Deep View Composition (5+ Levels)
5. No View Pre-Compilation on Deployment (First-User Penalty)

---

## Repository-Wide Anti-Patterns

- Caching Full View Responses Without Invalidation Strategy
- Rendering 10,000 Rows in a Table (No Pagination)
- User-Specific Content Cached with Global Key
- `@php` Blocks for Data Retrieval Scattered Across Templates
- Premature Micro-Optimization of Blade Syntax

---

## Anti-Pattern 1: Database Queries Inside `@php` Blocks

### Category
Performance | Architecture

### Description
Writing Eloquent queries, raw SQL, or API calls inside `@php` / `@endphp` blocks in Blade templates instead of fetching data in controllers.

### Why It Happens
Convenience — the developer needs "just one more query" for this template and adds it directly instead of modifying the controller.

### Warning Signs
- `@php $recentPosts = \App\Models\Post::recent()->limit(5)->get(); @endphp` in a template
- New query added to view without corresponding controller change
- Debug toolbar shows queries originating from view files
- Same query appears in multiple templates (no centralization)

### Preferred Alternative
Zero tolerance for queries in templates. All data retrieval happens in controllers, services, or view composers before the view receives data.

### Related Rules
- Rule: Never Write Database Queries Inside `@php` Blocks

---

## Anti-Pattern 2: Formatting Inside `@foreach` Loops

### Category
Performance

### Description
Calling `number_format()`, `Str::limit()`, `Carbon::format()`, or similar formatting functions directly inside a `@foreach` loop body.

### Why It Happens
Developers think of formatting as a "presentation concern" and put it in the template without considering the cost multiplied by collection size.

### Warning Signs
- `@foreach ($orders as $order)` contains `number_format(...)` and `$order->created_at->format(...)`
- Same formatting logic duplicated in multiple templates
- Formatting changes require editing every template that renders the field
- Profiling shows PHP time proportional to collection size

### Preferred Alternative
Pre-compute formatted values in view models or controllers. The template only references pre-formatted properties.

### Related Rules
- Rule: Pre-Compute Formatted Values in View Models

---

## Anti-Pattern 3: Optimizing Without Profiling

### Category
Performance | Waste

### Description
Spending time on Blade micro-optimizations (changing `@include` to components, reducing component depth) without first measuring where the actual bottleneck is.

### Why It Happens
Developers assume the view layer is slow because that's where they see the rendering code, without measuring the data preparation phase.

### Warning Signs
- Developer spent 2 hours refactoring component structure for "performance"
- No Laravel Debugbar or Telescope data was collected before optimization
- "Optimization" reduced render time by 0.5ms but N+1 queries still take 300ms
- Performance budget discussions focus on template syntax

### Preferred Alternative
Profile first with Debugbar or Telescope. 95% of slow views are caused by N+1 queries or slow data retrieval, not template rendering.

### Related Rules
- Rule: Profile Before Optimizing Views

---

## Anti-Pattern 4: Deep View Composition (5+ Levels)

### Category
Performance | Maintainability

### Description
Nesting views through `@extends`, `@include`, and component composition to 5 or more levels, creating a deep rendering chain.

### Why It Happens
Developers use inheritance and composition to achieve code reuse without considering the cost or debuggability of deep chains.

### Warning Signs
- Page layout involves: base → section → sub-section → page → component → sub-component
- Debugging a missing element requires opening 5+ files
- Compiled PHP is the only way to trace rendering
- Each level adds 0.1-0.5ms overhead
- Team cannot agree on where certain content comes from

### Preferred Alternative
Cap composition at 3 levels. Use component composition (flatter) instead of deep inheritance chains.

### Related Rules
- Rule: Limit View Composition Depth to 3 Levels

---

## Anti-Pattern 5: No View Pre-Compilation on Deployment

### Category
Performance

### Description
Deploying to production without running `php artisan view:cache`, forcing the first user after each deployment to pay the compilation penalty.

### Why It Happens
Developers don't realize that Blade views compile on first access. They test locally (where compilation happens on save) and don't experience the first-hit latency.

### Warning Signs
- Deployment script does not include `php artisan view:cache`
- First user after deployment experiences 2-10ms extra latency per unique view
- Monitoring shows view compilation spikes coinciding with deployments
- No CI/CD step for view pre-compilation

### Preferred Alternative
Add `php artisan view:cache` to the deployment pipeline. Pre-compile all views before traffic is routed to the new instance.

### Related Rules
- Rule: Pre-Compile All Views During Deployment
