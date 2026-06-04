## Rule: Centralize All Composer Registration in a Dedicated ViewServiceProvider

---

## Category

Code Organization

---

## Rule

Register all `View::composer()` and `View::creator()` calls in a single `ViewServiceProvider`. Do not scatter registrations across `AppServiceProvider` or other providers.

---

## Reason

Scattered registrations make shared view data impossible to discover. A developer wanting to understand what data is available across views must search the entire codebase for `View::composer` calls. A centralized `ViewServiceProvider` provides a single, discoverable registry of all view data that is automatically injected — making the hidden data flow explicit.

---

## Bad Example

```php
// AppServiceProvider — mixed with container bindings, routing, etc.
class AppServiceProvider extends ServiceProvider
{
    public function boot(): void
    {
        View::composer('*', CurrentUserComposer::class);
        View::composer('layouts.sidebar', SidebarComposer::class);
        // ... 30 other unrelated boot operations
    }
}
```

---

## Good Example

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

---

## Exceptions

Packages distributing view composers should register them in the package's own service provider.

---

## Consequences Of Violation

Maintenance risks: Developers cannot find where shared view data originates; duplicate registrations cause silent overrides. Scalability risks: As the team grows, understanding the view data contract requires searching the entire codebase.

---

## Rule: Cache Expensive Queries in Wildcard Composers

---

## Category

Performance

---

## Rule

Any composer registered with `View::composer('*', ...)` that performs database queries, API calls, or expensive computations must cache the results. Never execute uncached expensive operations inside a wildcard composer.

---

## Reason

Wildcard composers run on EVERY view render — including partials, components, emails, and AJAX partials. An uncached query in a wildcard composer can execute dozens or hundreds of times per page, multiplying the database load. For a page rendering 50 partials, each executing a wildcard composer with a query, that is 50 queries instead of 1. Caching ensures the cost is paid once per request or once per TTL period.

---

## Bad Example

```php
class SidebarComposer
{
    public function compose(View $view): void
    {
        $view->with('recentOrders', Order::recent()->limit(5)->get());
        // Query runs on every view render — including every component
    }
}

View::composer('*', SidebarComposer::class); // Query runs 50x per page
```

---

## Good Example

```php
class SidebarComposer
{
    public function compose(View $view): void
    {
        $view->with('recentOrders', cache()->remember('recent_orders', 3600, function () {
            return Order::recent()->limit(5)->get();
        }));
    }
}

View::composer('layouts.sidebar', SidebarComposer::class); // Scoped, not wildcard
```

---

## Exceptions

Wildcard composers that set only request-scoped data from `auth()` or `request()` (no queries) do not need caching. Only database/API-heavy composers need it.

---

## Consequences Of Violation

Performance risks: Unintended N+1 query patterns from wildcard composers hitting every render. Scalability risks: Database load multiplied by number of view components per page.

---

## Rule: Prefer Class-Based Composers Over Closures

---

## Category

Maintainability

---

## Rule

Implement view composers as dedicated classes with constructor dependency injection. Use closures only for trivial, single-line data binding.

---

## Reason

Closure-based composers inline in a service provider cannot be unit-tested, cannot be reused across multiple registrations, and cannot use constructor injection (requiring manual `app()->make()` resolution). Class-based composers support dependency injection via the container, are unit-testable in isolation, and can be registered for multiple views with `View::composer(['view1', 'view2'], Class::class)`.

---

## Bad Example

```php
// Closure in service provider — untestable
View::composer('layouts.sidebar', function (View $view) {
    $orders = app(OrderService::class)->recent();
    $view->with('recentOrders', $orders);
});
```

---

## Good Example

```php
// Class-based composer — testable, injectable, reusable
class SidebarComposer
{
    public function __construct(private OrderService $orders) {}

    public function compose(View $view): void
    {
        $view->with('recentOrders', $this->orders->recent());
    }
}

View::composer('layouts.sidebar', SidebarComposer::class);
```

---

## Exceptions

A composer that only sets a static config value (e.g., `$view->with('appName', config('app.name'))`) may use a one-line closure. If the composer grows beyond one line, extract to a class.

---

## Consequences Of Violation

Testing risks: Closure-based composers cannot be tested in isolation. Maintenance risks: Logic inline in service providers cannot be reused; manual dependency resolution required.

---

## Rule: Avoid Wildcard Composers for Global Data That Most Views Do Not Use

---

## Category

Performance

---

## Rule

Do not register a wildcard `View::composer('*', ...)` for data that is needed by only some views. Scope composers to specific views or view namespaces.

---

## Reason

Wildcard composers execute on EVERY view render, including partials, components inside loops, and emails. Computing data (even cached) that only 20% of views use wastes resources on the other 80%. Scoped composers run only when the matching view renders, eliminating unnecessary overhead for unrelated views.

---

## Bad Example

```php
class GlobalDataComposer
{
    public function compose(View $view): void
    {
        $view->with('adminMenu', MenuService::adminMenu()); // Only needed on admin views
        $view->with('unreadCount', auth()->user()?->unreadNotifications()->count());
    }
}

View::composer('*', GlobalDataComposer::class);
// Runs on public pages, auth pages, partials — none of which need admin menu
```

---

## Good Example

```php
// Scoped to views that actually need the data
View::composer('admin.*', AdminMenuComposer::class);
View::composer('layouts.header', NotificationComposer::class);
View::composer('*', CurrentUserComposer::class); // Needed everywhere
```

---

## Exceptions

Data that is genuinely needed by every single view (current user, app name, locale) may use a wildcard composer. Evaluate whether the data is truly universal before using `*`.

---

## Consequences Of Violation

Performance risks: Unnecessary data preparation on every view render, including component renders. Scalability risks: As the view count grows, the wasted computation per request accumulates.

---

## Rule: Prevent Silent Data Override Between Composers and Controllers

---

## Category

Reliability

---

## Rule

Use distinct, prefixed variable names for composer-provided data to prevent accidental override of controller-passed variables. Document the composer variable contract in the composer class.

---

## Reason

Composers run AFTER controller data binding — if a composer sets `$users` and the controller also sets `$users`, the composer's value silently wins. This creates subtle bugs where controller data disappears without any error. Unique variable names (prefixing composer data) prevent collisions and make the data source obvious in the template.

---

## Bad Example

```php
class DashboardComposer
{
    public function compose(View $view): void
    {
        $view->with('users', User::recent()->limit(5)->get());
        // Overrides controller's $users if present
    }
}
```

```blade
{{-- Template expects controller's $users but gets composer's --}}
@foreach ($users as $user) {{-- Wrong data --}}
```

---

## Good Example

```php
class DashboardComposer
{
    public function compose(View $view): void
    {
        $view->with('recentUsers', User::recent()->limit(5)->get());
        // Prefix avoids collision with controller's $users
    }
}
```

```blade
@foreach ($recentUsers as $user) {{-- Composer data, explicit --}}
@endforeach
@foreach ($users as $user) {{-- Controller data, explicit --}}
@endforeach
```

---

## Exceptions

When the composer is specifically designed to provide fallback data that the controller may override (and the override order is intentional), document this explicitly. This pattern should be rare.

---

## Consequences Of Violation

Reliability risks: Controller data silently replaced by composer data; incorrect data displayed to users. Maintenance risks: Debugging requires understanding composer execution order relative to controller.

---

## Rule: Use Creators Only for Truly Static Configuration Data

---

## Category

Framework Usage

---

## Rule

Use `View::creator()` only for data that is constant within a request (app name, locale, config values). Use `View::composer()` for data that may change between renders during the same request.

---

## Reason

Creators run when the view is instantiated, not when it renders. If a view is cached or reused within a request, creator data is set once and may become stale. Composers run on every render, ensuring fresh data. Using creators for auth-dependent or request-scoped data risks stale values; using composers for static config adds unnecessary execution overhead on every render.

---

## Bad Example

```php
class UserDataCreator
{
    public function create(View $view): void
    {
        $view->with('currentUser', auth()->user());
        $view->with('notifications', auth()->user()?->notifications()->get());
        // Auth data in creator — may be stale if view is reused
    }
}
```

---

## Good Example

```php
class AppConfigCreator
{
    public function create(View $view): void
    {
        $view->with('appConfig', [
            'name' => config('app.name'),
            'locale' => config('app.locale'),
        ]);
        // Static config — never changes within a request
    }
}

class UserComposer
{
    public function compose(View $view): void
    {
        $view->with('currentUser', auth()->user());
        $view->with('unreadCount', auth()->user()?->unreadNotifications()->count());
        // Auth data — refreshed on every render
    }
}
```

---

## Exceptions

No common exceptions. The creator/composer distinction exists for exactly this reason — using them correctly prevents stale data and unnecessary re-execution.

---

## Consequences Of Violation

Reliability risks: Stale user data if the view is reused within a request. Performance risks: Static config re-computed on every render if placed in a composer.

---

## Rule: Test Composer-Provided Data in View Tests

---

## Category

Testing

---

## Rule

Include composer data setup in view test assertions, or test composer classes in isolation. Never assume a view works without verifying its composer-provided data.

---

## Reason

Composers inject data invisibly — the view template references variables that are not in the controller's data array. Without testing, a composer that stops providing a variable (due to refactoring or removal) causes a runtime error in the template that no controller test catches. Writing tests for composer behavior ensures the hidden data contract is verified.

---

## Bad Example

```php
public function test_sidebar_renders()
{
    $rendered = view('layouts.sidebar')->render();
    // Fails because $recentOrders is provided by SidebarComposer, not the controller
}
```

---

## Good Example

```php
// Test composer class in isolation
public function test_sidebar_composer_provides_recent_orders(): void
{
    $composer = new SidebarComposer(new OrderService());
    $view = Mockery::mock(View::class);
    $view->shouldReceive('with')->with('recentOrders', Mockery::type(Collection::class));

    $composer->compose($view);
}

// Or test with composer booted
public function test_sidebar_renders_with_composer_data(): void
{
    Order::factory()->count(3)->create();
    $response = $this->get('/dashboard');
    $response->assertViewHas('recentOrders');
}
```

---

## Exceptions

View integration tests that render the page through HTTP (`$this->get('/dashboard')`) automatically execute composers — these tests do not need explicit composer setup, but they do need the route and controller to work.

---

## Consequences Of Violation

Reliability risks: Missing composer data causes runtime errors that no test catches. Maintenance risks: Removing or modifying a composer may break views silently until a user visits the page.
