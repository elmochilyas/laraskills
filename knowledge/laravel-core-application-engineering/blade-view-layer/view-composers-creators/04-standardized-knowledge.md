# View Composers and Creators

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** View Composers and Creators
- **Difficulty Level:** Intermediate
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

View composers and creators attach data to views whenever they are rendered. A composer's `compose()` method runs when the view renders (after loading, before output). A creator's `create()` method runs when the view is instantiated. Both share data with the view before template execution.

**Engineering value:** DRY for shared view data. Sidebar widgets, navigation menus, global notifications, and user context are defined once in a composer and automatically available to designated views. The cost is hidden data flow — a view's variables are not visible in the controller or route definition.

---

## Core Concepts

### View Composer Registration
```php
class SidebarComposer
{
    public function __construct(private OrderService $orders) {}

    public function compose(View $view): void
    {
        $view->with('recentOrders', $this->orders->recent());
    }
}

// Registration
View::composer('layouts.sidebar', SidebarComposer::class);
```

### View Creator Registration
```php
class AnalyticsCreator
{
    public function create(View $view): void
    {
        $view->with('trackingId', config('analytics.tracking_id'));
    }
}

View::creator('layouts.app', AnalyticsCreator::class);
```

### Multiple View Assignment
```php
View::composer(
    ['layouts.sidebar', 'partials.dashboard-widget'],
    SidebarComposer::class
);

// Wildcard — all views
View::composer('*', GlobalComposer::class);

// Namespace — all admin views
View::composer('admin.*', AdminComposer::class);
```

### Closure-Based Composer
```php
View::composer('layouts.sidebar', function (View $view) {
    $view->with('recentOrders', Order::recent()->get());
});
```

### Execution Order
1. All creators run (registration order)
2. Wildcard composers (`*`)
3. Namespace composers (`admin.*`)
4. Specific view composers (`layouts.sidebar`)

Later composers can override data set by earlier composers. Composer runs AFTER controller data is bound — composers can override controller-passed data.

---

## When To Use

- **Global user data** — authenticated user, permissions across all views
- **Navigation/sidebar data** — menu items, breadcrumbs, active route
- **Notification badges** — unread counts, system alerts
- **Static configuration** — app name, locale, debug flag (use creator)
- **Data shared across multiple controllers** — reports, widgets appearing on different pages
- **View-specific data preparation** — when the same view appears in different controller contexts

---

## When NOT To Use

- **Single-controller data** — if data is only used by one controller action, pass it directly
- **Simple service calls** — `@inject` is simpler for one-off service access in a single template
- **Component-specific data** — use constructor injection in class-based components instead
- **Expensive queries on every page** — wildcard composers with DB queries degrade all pages
- **Data that varies per page context** — a composer cannot know which page is being rendered (use view model instead)

---

## Best Practices (WHY)

**WHY register composers in a dedicated ViewServiceProvider.** Centralized registration makes all shared view data discoverable in one place. Scattering `View::composer()` calls across providers makes data flow invisible.

**WHY cache data in global composers.** A composer registered with `*` runs on EVERY view render — including partials, components, and emails. Expensive queries or API calls must be cached.

**WHY prefer class-based over closure composers.** Class-based composers support dependency injection, are unit-testable, and can be reused across registrations. Closures inline in a service provider cannot be tested in isolation.

**WHY use creators for truly static data.** Creators run once per view instance, not on every render. Use them for configuration, constants, and data that never changes during a request. Use composers for data that may vary per request.

**WHY avoid data override conflicts.** Composers run after controller data assignment. If a composer sets the same variable name as the controller, the composer's value wins. This can silently override intended controller data — use unique variable names or document overlaps.

---

## Architecture Guidelines

### Dedicated ViewServiceProvider
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
Register in `config/app.php` providers array.

### Class-Based vs Closure
| Concern | Class-Based | Closure |
|---|---|---|
| Dependency injection | Full constructor injection | Must resolve via `app()` |
| Testability | High (unit-test the class) | Low (cannot isolate) |
| Reusability | High (same class, different views) | Low (per-registration) |

### Composer vs Controller Data
| Concern | Composer | Controller |
|---|---|---|
| Scope | Multiple views or global | Single controller action |
| Visibility | Hidden (view code) | Explicit (controller method) |
| Testability | View test | Controller test |
| Reusability | High | Low |

---

## Performance

- Composers add the cost of data retrieval on every render (unless cached)
- Wildcard `*` composers run on every view — partials, components, emails included
- Creators run once per view instance — if a view is rendered in a loop, creator runs each iteration
- Always cache expensive queries in composers: `cache()->remember('key', 3600, fn() => ...)`
- A composer calling `Model::all()` without caching on a page with 10 partials runs the query 10 times

---

## Security

- Composers have access to `auth()` and `request()` — ensure they don't expose sensitive data to unauthorized views
- A wildcard composer that sets `$adminUsers` leaks to public-facing partials — scope data to the views that need it
- Never pass raw database models to views through composers unless the view is authorized to see them
- Composer data is merged into the view's data array — the view cannot distinguish composer data from controller data

---

## Common Mistakes

### 1. Database queries in wildcard composers
- **Description:** `View::composer('*', ...)` with uncached DB queries
- **Cause:** Convenience — one registration for all views
- **Consequence:** Query runs on every view render, including partials and component views; can cause hundreds of queries per page
- **Better:** Scope composers to specific views or namespaces; cache aggressively

### 2. Silent data override
- **Description:** Composer sets `$users` but controller also sets `$users`
- **Cause:** No naming convention for composer-provided variables
- **Consequence:** Composer's value silently replaces controller's value
- **Better:** Prefix composer variables (e.g., `$composer->with('appName', ...)`); document overlaps

### 3. Overusing creators for request-scoped data
- **Description:** Using `View::creator()` for data that changes per request
- **Cause:** Confusing "once per instance" with "once per request"
- **Consequence:** Creator data may be stale if the view is cached or reused
- **Better:** Use composers for data that varies per request; creators for truly static data only

### 4. Registering the same composer multiple times
- **Description:** Two providers both register the same composer for the same view
- **Cause:** Duplicate registration across provider files
- **Consequence:** Composer runs twice; data is overwritten or computed twice
- **Better:** Centralize all composer registrations in one provider

### 5. Ignoring composer in view tests
- **Description:** Testing a view without setting up its composer data
- **Cause:** Not knowing which data the composer provides
- **Consequence:** Test fails because expected variables are missing; developer doesn't know about the hidden dependency
- **Better:** Document composer-provided variables; include composer setup in view test bootstrap

---

## Anti-Patterns

- **Wildcard composer for everything.** One composer that provides 15 variables to all views. Every page pays the cost of computing data it doesn't use.
- **Composer as replacement for component data.** If a specific component needs data, inject it via constructor, not a global composer.
- **Composers with business logic.** A composer should prepare view data, not execute business operations. Writing to the database in a composer is a design error.
- **Naming composer variables generically.** `$data`, `$items`, `$info` — generic names collide more easily. Use specific, prefixed names.
- **Multiple composers competing for the same variable.** Two composers setting `$menu` on the same view creates implicit ordering dependencies.

---

## Examples

### Current User Composer (Global)
```php
class CurrentUserComposer
{
    public function compose(View $view): void
    {
        $view->with('currentUser', auth()->user());
        $view->with('isAdmin', auth()->check() && auth()->user()->isAdmin());
    }
}

View::composer('*', CurrentUserComposer::class);
```

### Navigation Composer (Specific View)
```php
class NavigationComposer
{
    public function __construct(private NavigationService $navigation) {}

    public function compose(View $view): void
    {
        $view->with('mainMenu', cache()->remember('main_menu', 3600, function () {
            return $this->navigation->mainMenu();
        }));
        $view->with('activeRoute', request()->route()->getName());
    }
}

View::composer('layouts.navigation', NavigationComposer::class);
```

### Creator for Static Config
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

### Notification Badge Composer
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

---

## Related Topics

- **Service Injection** — alternative to composers for simple data
- **Component System** — component-specific data via constructor injection
- **View Models / Presenters** — preparing complex view data per view
- **Layout Strategies** — shared layout data via composers
- **Service Container Fundamentals** (Application Architecture) — dependency injection for composer classes

---

## AI Agent Notes

- `View::composer()` and `View::creator()` are defined in `Illuminate\View\Factory`
- `compose()` receives `Illuminate\View\View` — use `$view->with()` to share data
- Composers respect the view event system: `creating` (creator) and `composed` (composer)
- ~55% of Laravel applications use view composers; navigation (75%), user data (60%), notifications (40%)
- Wildcard composer (`*`) used in ~30% of composer-using codebases
- Components have partially reduced the need for composers — constructor injection in components handles what composers did for simpler cases
- Composers can be attached to multiple views with an array: `View::composer(['view1', 'view2'], Class::class)`

---

## Verification

- [ ] Composer registration is centralized in a dedicated ViewServiceProvider
- [ ] Wildcard composers cache expensive queries
- [ ] No composer data variable name conflicts with controller-passed variables
- [ ] Composer-provided variables are documented in the template or a central reference
- [ ] Class-based composers use constructor injection instead of `app()` in closures
- [ ] Creators are used only for truly static configuration data
- [ ] View tests include composer data setup or composer class is tested in isolation
- [ ] Each composer has a clear, single responsibility (one type of data per composer)
