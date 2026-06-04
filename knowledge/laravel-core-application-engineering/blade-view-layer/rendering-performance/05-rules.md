## Rule: Eager Load All View Data Before Calling `view()`

---

## Category

Performance

---

## Rule

Load all Eloquent relationships and compute all derived data in the controller before passing data to the view. Never lazy-load relationships inside a Blade template loop.

---

## Reason

Lazy loading inside a `@foreach` loop creates N+1 query problems — each iteration executes a separate database query. Queries executed from templates are invisible to standard controller profiling and hard to optimize because they are scattered across loops. Eager loading in the controller ensures all queries are visible, countable, and optimizable in one place.

---

## Bad Example

```php
class PostController
{
    public function index(): View
    {
        return view('posts.index', [
            'posts' => Post::all(), // N+1: comments loaded per post in loop
        ]);
    }
}
```

```blade
@foreach ($posts as $post)
    <h2>{{ $post->title }}</h2>
    <p>{{ $post->comments->count() }} comments</p> {{-- Query per iteration --}}
@endforeach
```

---

## Good Example

```php
class PostController
{
    public function index(): View
    {
        return view('posts.index', [
            'posts' => Post::with('comments')->get(), // Eager loaded
        ]);
    }
}
```

---

## Exceptions

Lazy loading is acceptable for relationships that are conditionally displayed on a minority of pages and would waste resources if always eager-loaded. In those cases, use `load()` in the controller, not lazy loading in the view.

---

## Consequences Of Violation

Performance risks: N+1 queries causing slow page loads; database load spikes. Scalability risks: Each additional row in the loop adds a query — does not scale beyond trivial datasets.

---

## Rule: Never Write Database Queries Inside `@php` Blocks

---

## Category

Architecture

---

## Rule

Zero tolerance for Eloquent queries, raw SQL, or API calls inside `@php` / `@endphp` blocks in Blade templates. All data retrieval must happen in controllers, services, or view composers before the view receives data.

---

## Reason

Queries inside `@php` blocks are invisible to anyone reading the controller or route. They execute on every render, cannot be cached from outside the template, cannot be profiled with standard tools, and are impossible to unit-test. The view layer should only iterate and display — it should never fetch.

---

## Bad Example

```blade
@php
    $recentPosts = \App\Models\Post::recent()->limit(5)->get(); // Query in view
@endphp

@foreach ($recentPosts as $post)
    <div>{{ $post->title }}</div>
@endforeach
```

---

## Good Example

```php
class DashboardController
{
    public function index(): View
    {
        return view('dashboard.index', [
            'recentPosts' => Post::recent()->limit(5)->get(),
        ]);
    }
}
```

```blade
@foreach ($recentPosts as $post)
    <div>{{ $post->title }}</div>
@endforeach
```

---

## Exceptions

Simple, non-query operations (loop counters, string manipulation, date formatting) in `@php` blocks may be acceptable but should be moved to view models or helpers as the template grows beyond trivial usage.

---

## Consequences Of Violation

Performance risks: Hidden queries cause slow renders without visibility in profiling. Maintenance risks: Queries scattered across templates cannot be optimized centrally. Testing risks: Template logic containing queries cannot be tested in isolation.

---

## Rule: Pre-Compute Formatted Values in View Models

---

## Category

Performance

---

## Rule

Format currency, dates, status labels, and other computed display values in view models or controllers, not inline inside Blade loops. Move all formatting out of `@foreach` bodies.

---

## Reason

Formatting functions (`number_format`, `Str::limit`, `Carbon::format`) inside a `@foreach` body execute on every iteration — the cost multiplies by the collection size. Pre-computing in a view model's constructor pays the cost once per item rather than once per render. For a 100-item list, this eliminates 100 formatting calls on every page view.

---

## Bad Example

```blade
@foreach ($orders as $order)
    <tr>
        <td>{{ number_format($order->total / 100, 2) }}</td>
        <td>{{ $order->created_at->format('Y-m-d') }}</td>
        <td>
            @if($order->status === 'completed')
                <span class="badge-success">Completed</span>
            @elseif($order->status === 'processing')
                <span class="badge-warning">Processing</span>
            @endif
        </td>
    </tr>
@endforeach
```

---

## Good Example

```php
readonly class OrderListItemViewModel
{
    public function __construct(public Order $order)
    {
        $this->formattedTotal = '$' . number_format($order->total / 100, 2);
        $this->formattedDate = $order->created_at->toDateString();
        $this->statusBadgeClass = match($order->status) {
            'completed' => 'badge-success',
            'processing' => 'badge-warning',
            default => 'badge-secondary',
        };
    }
}
```

```blade
@foreach ($viewModels as $item)
    <tr>
        <td>{{ $item->formattedTotal }}</td>
        <td>{{ $item->formattedDate }}</td>
        <td><span class="{{ $item->statusBadgeClass }}">{{ $item->order->status }}</span></td>
    </tr>
@endforeach
```

---

## Exceptions

Single-item views (show pages) where formatting overhead is negligible — pre-computation still improves consistency but is not a performance necessity.

---

## Consequences Of Violation

Performance risks: Formatting cost multiplied by collection size on every render. Maintenance risks: Formatting logic duplicated across templates; changes require editing every template that formats the same field.

---

## Rule: Cache Rendered Partials for Expensive, Rarely-Changing Sections

---

## Category

Performance

---

## Rule

Cache the rendered HTML output of expensive, rarely-changing view partials (sidebars, navigation menus, footer widgets) using `cache()->remember()`.

---

## Reason

A sidebar with dynamic navigation that queries the database on every page render wastes resources when the sidebar content changes infrequently. Caching the rendered HTML eliminates the query cost and rendering cost on every request. The sidebar is displayed on every page, so the caching ROI is proportional to page traffic.

---

## Bad Example

```php
public function show(): View
{
    return view('dashboard.show', [
        'sidebar' => view('partials.sidebar', [
            'menu' => MenuItem::all(), // Query on every request
        ])->render(),
    ]);
}
```

---

## Good Example

```php
public function show(): View
{
    $sidebar = cache()->remember('sidebar_html', 3600, function () {
        return view('partials.sidebar', [
            'menu' => MenuItem::all(),
        ])->render();
    });

    return view('dashboard.show', compact('sidebar'));
}
```

---

## Exceptions

Partials that contain user-specific data (unread notification counts, personalized recommendations) cannot be globally cached. Use per-user cache keys or view composers with caching for these cases.

---

## Consequences Of Violation

Performance risks: Expensive partials execute on every page render, multiplying cost across all pages that include them. Scalability risks: Database queries run on every page view for content that changes once daily.

---

## Rule: Pre-Compile All Views During Deployment

---

## Category

Performance

---

## Rule

Run `php artisan view:cache` as part of the deployment process. Never allow production to compile views on first request after deployment.

---

## Reason

Without pre-compilation, the first user to visit each page after deployment pays the compilation penalty (2-10ms per unique view). For an application with 100 views, the first 100 visits each compile a new view — this creates a "first-user-pays" tax where the initial users after deployment experience slow page loads. Pre-compilation moves this cost to the deployment process, ensuring consistent response times.

---

## Bad Example

```yaml
# Deployment script without view caching
php artisan migrate --force
# First user pays compilation cost for every view
```

---

## Good Example

```yaml
# Deployment script with view caching
php artisan view:cache
php artisan migrate --force
# All views pre-compiled; zero compilation latency for users
```

---

## Exceptions

Development environments should not run `view:cache` — they benefit from automatic recompilation on file changes. Only production deployments should pre-compile.

---

## Consequences Of Violation

Performance risks: Slow first-page-load for users after every deployment. Scalability risks: Compilation spikes coincide with deployment traffic surges, potentially overwhelming servers.

---

## Rule: Profile Before Optimizing Views

---

## Category

Performance

---

## Rule

Use Laravel Debugbar or Telescope to measure view rendering time before making performance optimizations. Never optimize templates based on assumptions about what is slow.

---

## Reason

Blade rendering (template execution) accounts for approximately 5% of total render time. Data preparation (queries, computations) accounts for approximately 95%. Without measurement, developers inevitably optimize the wrong thing — micro-optimizing Blade syntax while the real bottleneck (N+1 queries) goes unaddressed. Always profile to identify the actual bottleneck.

---

## Bad Example

```php
// "Optimizing" by changing @include to components for performance
// without measuring — wasted effort if the real issue is N+1
```

---

## Good Example

```php
// 1. Install Laravel Debugbar
// 2. Identify that view rendering is 5ms but database queries are 300ms
// 3. Fix N+1 queries with eager loading
// 4. Re-measure: total time drops from 305ms to 20ms
```

---

## Exceptions

Obvious N+1 patterns (queries inside `@foreach`) should be fixed immediately without profiling — they are always wrong. The rule applies to ambiguous performance issues.

---

## Consequences Of Violation

Performance risks: Time and effort spent on optimizations that yield negligible improvement. Maintenance risks: Premature optimization adds complexity for no measurable benefit.

---

## Rule: Limit View Composition Depth to 3 Levels

---

## Category

Performance

---

## Rule

Keep view inheritance and composition depth at 3 levels maximum (Base → Section → Page, or Page → Component → Sub-component). Refactor deeper structures into flatter compositions.

---

## Reason

Each level of `@include`, `@extends`, or component composition adds method call overhead, file resolution, and scope management. Beyond 3 levels, the cumulative overhead becomes measurable (0.5-2ms per page), and the complexity cost in debugging dominates. Flatter compositions are faster and easier to maintain.

---

## Bad Example

```
base.blade.php → section.blade.php → subsection.blade.php → page.blade.php → component.blade.php → sub-component.blade.php (6 levels)
```

---

## Good Example

```
base.blade.php → admin.blade.php → users.blade.php (3 levels — max)
Base → Section → Page
```

---

## Exceptions

Design system component libraries may exceed 3 levels where each level is a well-documented, stable composition (e.g., `Page > Card > CardBody > Text`). This should be the exception, not the default.

---

## Consequences Of Violation

Performance risks: Measurable rendering overhead from deep composition chains. Maintenance risks: Debugging requires tracing through 4+ files to understand output.
