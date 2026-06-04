## Rule: Use `@inject` Only for Non-Entity, Read-Only Services

---

## Category

Architecture

---

## Rule

Use `@inject` exclusively for services that return computed/configuration data (settings, navigation, analytics, feature flags). Never inject entity repositories, Eloquent models, or services that perform write operations.

---

## Reason

Injecting repositories or entity services from the view couples the presentation layer to the data access layer, hides data flow from the controller, and makes templates responsible for understanding data origins. `@inject` is a pragmatic shortcut for non-entity services — it should not become the primary data delivery mechanism for page content.

---

## Bad Example

```blade
@inject('users', 'App\Repositories\UserRepository')
@foreach ($users->all() as $user) {{-- View triggers DB query --}}
    <li>{{ $user->name }}</li>
@endforeach
```

---

## Good Example

```blade
@inject('settings', 'App\Services\SettingsService')
@inject('navigation', 'App\Services\NavigationService')

<x-header>
    <x-slot:title>{{ $settings->get('site_name') }}</x-slot:title>
    <nav>
        @foreach ($navigation->mainMenu() as $item)
            <a href="{{ $item['url'] }}">{{ $item['label'] }}</a>
        @endforeach
    </nav>
</x-header>
```

---

## Exceptions

When building the primary page data, always pass it from the controller. `@inject` exceptions are limited to configuration, navigation, and analytics services that are not the page's main content.

---

## Consequences Of Violation

Maintenance risks: Data flow becomes invisible; templates hide dependencies on repositories. Performance risks: Queries triggered from views bypass controller-level optimization.

---

## Rule: Register Injected Services as Singletons

---

## Category

Performance

---

## Rule

Register every service used with `@inject` as a singleton in a service provider. Never allow the container to create a new instance on every render.

---

## Reason

`@inject` compiles to `<?php $var = app('Class'); ?>` and resolves on every render. If the service is not registered as a singleton, a new instance is constructed each time — including running the constructor, resolving all constructor dependencies, and allocating memory. For services used across multiple templates on the same page, this creates redundant instances.

---

## Bad Example

```php
// No singleton registration — new instance created every @inject call
class AppServiceProvider extends ServiceProvider
{
    // Missing: $this->app->singleton(NavigationService::class);
}
```

```blade
@inject('nav', 'App\Services\NavigationService')
@inject('nav2', 'App\Services\NavigationService')
{{-- Two separate instances created --}}
```

---

## Good Example

```php
class AppServiceProvider extends ServiceProvider
{
    public function register(): void
    {
        $this->app->singleton(NavigationService::class);
        $this->app->singleton(SettingsService::class);
    }
}
```

---

## Exceptions

Services with zero constructor overhead and no dependencies (e.g., a simple stateless service with only static methods) may not benefit from singleton registration but should still be registered for consistency.

---

## Consequences Of Violation

Performance risks: Unnecessary object construction on every render; multiple instances of the same service per request. Scalability risks: Accumulated construction overhead across many pages and requests.

---

## Rule: Never Trigger Write Operations from Injected Services

---

## Category

Security

---

## Rule

Only call read/idempotent methods on injected services from templates. Never call methods that write to the database, send emails, modify session data, or produce side effects.

---

## Reason

Templates can render multiple times per request (component re-renders, partial caching, preview modes). A write operation triggered from `@inject` would execute on every render, causing duplicate writes, duplicate emails, and data corruption. Side effects in views are invisible to developers reading the controller and violate the principle that views should only display data.

---

## Bad Example

```blade
@inject('analytics', 'App\Services\AnalyticsService')
{{ $analytics->recordPageView(request()->path()) }} {{-- Side effect on every render --}}
```

---

## Good Example

```php
class AnalyticsMiddleware
{
    public function handle(Request $request, \Closure $next): Response
    {
        $response = $next($request);
        AnalyticsService::recordPageView($request->path()); // Write in middleware
        return $response;
    }
}
```

```blade
@inject('analytics', 'App\Services\AnalyticsService')
<p>Page views today: {{ $analytics->pageViewsToday() }}</p> {{-- Read only --}}
```

---

## Exceptions

No common exceptions. Write operations never belong in views under any circumstance.

---

## Consequences Of Violation

Security risks: Duplicate writes, data corruption, unintended email sending. Reliability risks: Operations execute unpredictably depending on render count. Maintenance risks: Side effects hidden in templates cause production incidents during refactoring.

---

## Rule: Prefer View Composers Over `@inject` for Shared Data

---

## Category

Architecture

---

## Rule

Use view composers for data that must be shared across multiple views. Use `@inject` only for one-off service access in a single template.

---

## Reason

A view composer is registered once and applies to all matching views automatically. `@inject` must be added to every template individually, leading to inconsistent application and maintenance overhead when the service changes. For data needed across many views (current user, navigation, settings), composers provide a single registration point with consistent behavior across all templates.

---

## Bad Example

```blade
{{-- Every template must add @inject independently --}}
{{-- templates/dashboard.blade.php --}}
@inject('nav', 'App\Services\NavigationService')

{{-- templates/settings.blade.php --}}
@inject('nav', 'App\Services\NavigationService')
{{-- Forgotten on templates/profile.blade.php — no navigation data --}}
```

---

## Good Example

```php
class NavigationComposer
{
    public function compose(View $view): void
    {
        $view->with('mainMenu', cache()->remember('main_menu', 3600, function () {
            return app(NavigationService::class)->mainMenu();
        }));
    }
}

// Registered once in ViewServiceProvider
View::composer('*', NavigationComposer::class);
```

---

## Exceptions

When a service is used in exactly one template and the data is not needed elsewhere, `@inject` is simpler than creating a dedicated composer class.

---

## Consequences Of Violation

Maintenance risks: `@inject` calls scattered across templates; adding a new template requires remembering all dependencies. Scalability risks: Changing a service interface requires updating every template that injects it.

---

## Rule: Document All `@inject` Dependencies with Blade Comments

---

## Category

Maintainability

---

## Rule

Add a Blade comment at the top of every template that uses `@inject`, listing each injected variable, its class, and its purpose.

---

## Reason

`@inject` creates hidden dependencies that are invisible to anyone reading the controller or route definition. Without documentation, a developer refactoring a controller may remove or change a service that a template depends on, causing a runtime error. Documenting injected dependencies makes the template's hidden contract explicit and discoverable.

---

## Bad Example

```blade
{{-- No documentation — injected dependency is invisible --}}
@inject('settings', 'App\Services\SettingsService')

<h1>{{ $settings->get('site_name') }}</h1>
```

---

## Good Example

```blade
{{--
    Injected dependencies:
    - $settings: App\Services\SettingsService — site configuration values
    - $navigation: App\Services\NavigationService — main menu items
--}}
@inject('settings', 'App\Services\SettingsService')
@inject('navigation', 'App\Services\NavigationService')
```

---

## Exceptions

Templates using only controller-passed data (no `@inject` calls) do not need dependency documentation.

---

## Consequences Of Violation

Maintenance risks: Refactoring controllers unknowingly breaks templates; runtime errors in production. Scalability risks: Growing codebase with undocumented `@inject` dependencies makes team onboarding harder and increases regression risk.

---

## Rule: Do Not Use `@inject` Inside Component Views

---

## Category

Architecture

---

## Rule

Use constructor injection in class-based components instead of `@inject` in the component's Blade template. Never use `@inject` inside anonymous component views.

---

## Reason

Class-based components can receive services via constructor injection, making dependencies explicit, testable, and documented in the component class. `@inject` inside a component view hides the dependency — the consumer of `<x-alert>` has no way to know that the component relies on an injected service. For anonymous components, the view has no class to document dependencies, so `@inject` creates an invisible coupling.

---

## Bad Example

```blade
{{-- components/sidebar.blade.php (anonymous) --}}
@inject('menu', 'App\Services\MenuService')
@foreach ($menu->items() as $item)
    <a href="{{ $item['url'] }}">{{ $item['label'] }}</a>
@endforeach
{{-- Hidden dependency — component consumer has no idea --}}
```

---

## Good Example

```php
class Sidebar extends Component
{
    public function __construct(
        private MenuService $menu,
    ) {}

    public function render(): View
    {
        return view('components.sidebar', [
            'menuItems' => $this->menu->items(),
        ]);
    }
}
```

```blade
{{-- components/sidebar.blade.php --}}
@foreach ($menuItems as $item)
    <a href="{{ $item['url'] }}">{{ $item['label'] }}</a>
@endforeach
```

---

## Exceptions

Anonymous components that need a single, non-entity service call may use `@inject` as a pragmatic shortcut, but this should be documented and considered technical debt.

---

## Consequences Of Violation

Maintenance risks: Component dependencies invisible to consumers; refactoring services breaks components silently. Testing risks: Components with `@inject` cannot be tested without the full container.
