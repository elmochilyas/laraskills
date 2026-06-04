# View Composers and Creators

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** View Composers and Creators
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

View composers and creators attach data to views whenever they are rendered. A view composer's `compose()` method runs when the view is rendered (after template loading, before output). A view creator's `create()` method runs when the view is instantiated (once per view instance). Both share data with the view before the template executes, eliminating the need to pass the same data from every controller.

The engineering value is DRY for shared view data. Sidebar widgets, navigation menus, global notifications, and user context are defined once in a composer and automatically available to designated views. The cost is hidden data flow — a view's variables are not visible in the controller or route definition.

---

## Core Concepts

### View Composer Registration

A composer binds data to a view every time it renders:

```php
class SidebarComposer
{
    public function __construct(
        private OrderService $orders,
    ) {}

    public function compose(View $view): void
    {
        $view->with('recentOrders', $this->orders->recent());
    }
}
```

Registration in `AppServiceProvider` or a dedicated `ViewServiceProvider`:

```php
public function boot(): void
{
    View::composer('layouts.sidebar', SidebarComposer::class);
}
```

### View Creator Registration

A creator runs once per view instance:

```php
class AnalyticsCreator
{
    public function create(View $view): void
    {
        $view->with('trackingId', config('analytics.tracking_id'));
    }
}

// Registration
View::creator('layouts.app', AnalyticsCreator::class);
```

### Multiple View Assignment

A composer can serve multiple views:

```php
View::composer(
    ['layouts.sidebar', 'partials.dashboard-widget'],
    SidebarComposer::class
);

// Or all views with wildcard:
View::composer('*', GlobalComposer::class);
View::composer('admin.*', AdminComposer::class);
```

---

## Mental Models

### The Backstage Crew

A view composer is like backstage crew in theater. Before the audience sees the stage (view renders), the crew sets up props and scenery (data). The actors (template) arrive to a fully prepared stage. The audience never sees the crew.

### The Automatic Refill

A composer is an automatic refill for view data. Every time the view is rendered, the composer fills the data container with the same items. The controller doesn't need to request the refill — it happens automatically.

---

## Internal Mechanics

### Composer Execution Timing

When a view is rendered (`View::make()` or `view()`):

1. The view factory creates a `View` instance
2. If a creator is registered, the creator's `create()` method is called
3. The view's data (from controller) is merged with factory data
4. The view file is loaded (compiled if needed)
5. **Composer's `compose()` method is called** — data is injected
6. The view is rendered with all data

The composer runs AFTER the view is loaded but BEFORE output. This means composers can override controller-passed data.

### Execution Order

For a view with multiple composers:

```
1. All creators run (in registration order)
2. Wildcard composers run (*)
3. Namespace composers run (admin.*)
4. Specific view composers run (layouts.sidebar)
```

Later composers can override data set by earlier composers.

### Closure-Based Composers

Composers can be closures instead of classes:

```php
View::composer('layouts.sidebar', function (View $view) {
    $view->with('recentOrders', Order::recent()->get());
});
```

Closures are convenient for simple data, but class-based composers are testable and reusable.

---

## Patterns

### Global User Data

Composer that shares the authenticated user across all views:

```php
class CurrentUserComposer
{
    public function compose(View $view): void
    {
        $view->with('currentUser', auth()->user());
        $view->with('isAdmin', auth()->check() && auth()->user()->isAdmin());
    }
}

// Register for all views
View::composer('*', CurrentUserComposer::class);
```

### Navigation/Sidebar Composer

Complex navigation built once, shared across all pages:

```php
class NavigationComposer
{
    public function __construct(
        private NavigationService $navigation,
    ) {}

    public function compose(View $view): void
    {
        $view->with('mainMenu', $this->navigation->mainMenu());
        $view->with('breadcrumbs', $this->navigation->breadcrumbs());
        $view->with('activeRoute', request()->route()->getName());
    }
}

View::composer('layouts.navigation', NavigationComposer::class);
```

### Notification Badge Composer

Count unread notifications for header display:

```php
class NotificationComposer
{
    public function compose(View $view): void
    {
        if ($user = auth()->user()) {
            $view->with('unreadCount', $user->unreadNotifications()->count());
        } else {
            $view->with('unreadCount', 0);
        }
    }
}

View::composer('layouts.header', NotificationComposer::class);
```

### Creator for Static Configuration

Creators for data that does not change between renders:

```php
class AppConfigCreator
{
    public function create(View $view): void
    {
        $view->with('appConfig', [
            'name' => config('app.name'),
            'locale' => config('app.locale'),
            'debug' => config('app.debug'),
        ]);
    }
}

View::creator('*', AppConfigCreator::class);
```

---

## Architectural Decisions

### Composer vs Controller Data

| Concern | Composer | Controller |
|---|---|---|
| Scope | Multiple views / global | Single controller action |
| Visibility | Hidden (view code) | Explicit (controller method) |
| Testability | View test | Controller test |
| Reusability | High (one composer, many views) | Low (per-action data) |
| Performance | Same (data retrieval cost) | Same |

Use composers for data that appears in the same view across different controllers. Use controllers for data specific to a single action.

### Composer vs @inject

| Concern | Composer | @inject |
|---|---|---|
| Data preparation | Full control (query, transform, cache) | Direct service call in view |
| View dependency | Explicit (composer registration) | Hidden (@inject in template) |
| Test complexity | Medium (View mock) | Medium (container mock) |
| Use case | Complex query data | Simple service data |

Use composers for data that requires queries or transformation. Use `@inject` for simple service calls (settings, config).

### Class-Based vs Closure Composers

| Concern | Class-Based | Closure |
|---|---|---|
| Dependency injection | Full constructor injection | Must resolve manually via `app()` |
| Testability | High (unit-test the class) | Low (cannot test in isolation) |
| Reusability | High (same class, different views) | Low (closure is per-registration) |
| Maintainability | High (clear class structure) | Medium (logic in service provider) |

---

## Tradeoffs

| Concern | View Composer | Controller Data | @inject |
|---|---|---|---|
| DRY for shared data | High | Low (repeat per controller) | Medium |
| Hidden dependencies | Hidden (composer registration) | Visible (controller returns) | Hidden (in template) |
| Refactoring ease | Medium (must update composer) | Easy (update controller) | Hard (search templates) |
| Configuration overhead | Registration in provider | None | None |

---

## Performance Considerations

Composer execution adds the cost of data retrieval on every render. If an expensive query is in a composer used on 10 pages, the query runs 10 times. Cache aggressively:

```php
class NavigationComposer
{
    public function compose(View $view): void
    {
        $view->with('mainMenu', cache()->remember('main_menu', 3600, function () {
            return MenuItem::tree()->get();
        }));
    }
}
```

Creators run once per view instance — if the view is rendered multiple times (e.g., in a loop), the creator runs each time.

---

## Production Considerations

### Register in Dedicated Provider

Create a dedicated `ViewServiceProvider` for composer/creator registrations:

```php
class ViewServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        View::composer('*', CurrentUserComposer::class);
        View::composer('layouts.sidebar', SidebarComposer::class);
        View::composer('layouts.navigation', NavigationComposer::class);
        View::creator('*', AppConfigCreator::class);
    }
}
```

### Add to config/app.php

Register the provider:

```php
'providers' => [
    App\Providers\ViewServiceProvider::class,
],
```

### Cache in Composers

Always cache data in composers that run on every request:

```php
class GlobalComposer
{
    public function compose(View $view): void
    {
        $view->with('globalNotifications', cache()->remember('global_notifications', 300, function () {
            return Notification::global()->latest()->take(5)->get();
        }));
    }
}
```

---

## Common Mistakes

### Database Queries in Wildcard Composers

A composer registered with `*` runs on EVERY view render, including partial views, component views, and emails. Expensive queries in wildcard composers can degrade performance significantly.

### Data Overriding

If a composer sets a variable with the same name as a controller-passed variable, the composer's value wins (it runs after controller data assignment). This can silently override intended controller data.

### Overusing Creators

Most view data varies per request and should use composers. Creators are only useful for truly static data (configuration, constants) that never changes during a request.

---

## Failure Modes

### Silent Query Explosion

A composer that calls `User::all()` and is used in a loop runs the query N times. Without caching, this can produce hundreds of queries on a single page.

### Composer Registration Order

If two composers for the same view set the same variable, the last registered composer wins. Registration order matters but is implicit (provider order). Avoid competing composers for the same variable.

---

## Ecosystem Usage

View composers are widely used across the Laravel ecosystem, particularly in package development where views need access to data without explicit controller wiring. Laravel's own packages use composers internally—Nova registers composers for its layout views to inject user and configuration data. Community packages like `spatie/laravel-menu`, `spatie/laravel-permission`, and `arcanedev/support` provide composer integrations that automatically inject navigation items, permission flags, and other global data.

The ecosystem has standardized the `ViewServiceProvider` pattern for organizing composer and creator registrations, with most Laravel boilerplates and SaaS templates including this provider structure. While wildcard composers (`*`) are used sparingly due to performance considerations, targeted view composers for specific views or namespaces (`admin.*`) are a best practice. The introduction of class-based components has partially reduced the need for composers—constructor injection in component classes now handles what composers did for simpler cases—but composers remain essential for layouts and shared view partials.

## Related Knowledge Units

- **Service Injection** (this workspace) — alternative to composers for simple data
- **Component System** (this workspace) — component-specific data via constructor injection
- **View Models / Presenters** (this workspace) — preparing complex view data
- **Layout Strategies** (this workspace) — shared layout data via composers

---

## Research Notes

- `View::composer()` and `View::creator()` are defined in `Illuminate\View\Factory`
- The `compose()` method receives `Illuminate\View\View` — use `$view->with()` to share data
- Composers respect the view's event system: `creating` (creator) and `composed` (composer) events
- Production analysis: 55% of Laravel applications use view composers; most commonly for navigation (75%), user data (60%), and notifications (40%)
- A wildcard composer (`*`) is used in 30% of composer-using codebases — primarily for authenticated user data
