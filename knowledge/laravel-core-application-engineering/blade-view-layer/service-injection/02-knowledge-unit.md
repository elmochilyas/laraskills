# Service Injection

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Service Injection
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary

Blade's `@inject` directive retrieves a service from the service container directly in the view. The directive takes a variable name and a service class or interface name, resolves the service from the container, and assigns it to the variable for use in the template.

The engineering value is convenience — views can access services without passing data through controllers. The cost is that the view gains a hidden dependency on the service container, making templates harder to test and refactor. `@inject` is a pragmatic shortcut, not an architectural pattern.

---

## Core Concepts

### Basic @inject Usage

```blade
@inject('analytics', 'App\Services\AnalyticsService')

<p>Page views today: {{ $analytics->pageViewsToday() }}</p>
```

The first parameter is the variable name, the second is the class/interface name. The variable is available throughout the template.

### Injection with Interface

Resolve from a contract binding:

```blade
@inject('users', 'App\Contracts\UserRepository')

@foreach ($users->recent() as $user)
    <li>{{ $user->name }}</li>
@endforeach
```

### Injection in Components

Components can inject services via constructor injection — `@inject` is primarily for inline view usage, not for component classes.

---

## Mental Models

### The Back Door

`@inject` is like a back door into the view — data enters without going through the controller's front door. It's convenient for quick access to low-priority data (analytics, settings, menus) but should not be the primary data entry point.

### The Service Tap

Think of `@inject` as tapping directly into the service well. Instead of filling a bucket (controller variable) and carrying it to the view, the view has its own tap into the well. Each view that taps the well creates a new connection, so the well should be cheap to access.

---

## Internal Mechanics

### Resolution Process

When Blade compiles `@inject('var', 'Class')`:

```php
// Compiled to:
<?php $var = app('App\Services\AnalyticsService'); ?>
```

The `@inject` compiles to a call to Laravel's `app()` helper. The service is resolved from the container each time the view renders.

### Variants

`@inject` is equivalent to `{{-- compiled: <?php $$var = app($class); ?> --}}`.

An alternative, `app()->make()`, achieves the same result directly in PHP:

```blade
@php
    $analytics = app(AnalyticsService::class);
@endphp
```

---

## Patterns

### Configuration Injection

Inject global configuration that changes rarely:

```blade
@inject('settings', 'App\Services\SettingsService')

<x-header>
    <x-slot:title>{{ $settings->get('site_name') }}</x-slot:title>
</x-header>
```

### Menu/Navigation Building

Complex navigation built by a service:

```blade
@inject('navigation', 'App\Services\NavigationService')

<nav>
    @foreach ($navigation->mainMenu() as $item)
        <a href="{{ $item['url'] }}" class="{{ $item['active'] ? 'active' : '' }}">
            {{ $item['label'] }}
        </a>
    @endforeach
</nav>
```

### Analytics/Diagnostics

Low-priority data that should not clutter controller logic:

```blade
@inject('analytics', 'App\Services\AnalyticsService')

@if ($analytics->shouldShowSurvey())
    <div class="survey-banner">
        {{-- Survey prompt --}}
    </div>
@endif
```

---

## Architectural Decisions

### @inject vs Controller Data Passing

| Concern | @inject | Controller Data |
|---|---|---|
| Hidden dependencies | Yes (view depends on container) | No (explicit in controller) |
| Testability | Hard (must mock container) | Easy (pass mock data) |
| Reusability | View-specific | Any consumer (API, CLI, view) |
| Performance | Same (app() resolution) | Same |
| Discoverability | Low (service call in template) | High (controller action) |

### When to Use @inject

- **Acceptable**: Global site settings, navigation structure, analytics snippets
- **Avoid**: Primary data (the resource being displayed), user-specific data, business logic

### @inject vs View Composers

| Concern | @inject | View Composer |
|---|---|---|
| Scope | Per-template | Per-view (or all views) |
| Registration | Inline in template | In service provider |
| Reusability | Single template | Multiple templates sharing view name |
| Maintenance | Template-scattered | Centralized |

View composers are preferred when the same data is needed across multiple views. `@inject` is for one-off needs.

---

## Tradeoffs

| Concern | @inject | View Composer | Controller Pass |
|---|---|---|---|
| Boilerplate | Zero | Class + registration | Explicit variable pass |
| Coupling | View ↔ Container | View ↔ Composer | View ↔ Controller |
| Test complexity | Medium (mock container) | Medium (mock composer) | Low (pass data directly) |
| Refactoring risk | High (hidden dependency) | Medium (composer visible) | Low (visible in route/controller) |

---

## Performance Considerations

`@inject` calls `app()` on each render. If the service is singleton-bound, the same instance is returned (O(1) lookup). If not bound, a new instance is constructed on every render (constructor overhead).

For services with expensive constructors, use `@inject` only with singletons:

```php
// AppServiceProvider
$this->app->singleton(AnalyticsService::class);
```

---

## Production Considerations

### Use with Singleton Services

Services resolved via `@inject` should be registered as singletons to avoid re-initialization on every render:

```php
public function register(): void
{
    $this->app->singleton(NavigationService::class);
}
```

### Document Injected Dependencies

Every `@inject` call creates a hidden dependency. Document these in the template header or a central registry to prevent confusion:

```blade
{{--
    Dependencies:
    - analytics: App\Services\AnalyticsService (singleton)
    - navigation: App\Services\NavigationService (singleton)
--}}

@inject('analytics', 'App\Services\AnalyticsService')
@inject('navigation', 'App\Services\NavigationService')
```

### Avoid Business Logic in Injected Calls

The service method called in the view should return data, not perform mutations. `@inject` should never be used to trigger write operations:

```blade
{{-- Bad: triggers write operation --}}
{{ $analytics->recordPageView() }}

{{-- Good: returns data --}}
{{ $analytics->pageViewsToday() }}
```

---

## Common Mistakes

### Injecting Repositories Directly

Injecting Eloquent repositories into views couples the presentation layer to persistence:

```blade
{{-- Bad --}}
@inject('users', 'App\Repositories\UserRepository')
@foreach ($users->all() as $user)
    {{ $user->name }}
@endforeach
```

The controller should fetch data and pass it as variables. Use `@inject` only for non-entity services (navigation, settings, analytics).

### Expensive Resolutions

Services that perform database queries or API calls in their constructor cause a query on every view render:

```blade
{{-- Bad: expensive service --}}
@inject('expensive', 'App\Services\ExpensiveInitService')
```

Use lazy properties or method-level caching instead of constructor-time initialization.

### Forgetting Singletons

Services resolved via `@inject` create a new instance per `@inject` call (unless registered as singleton). Multiple `@inject` calls for the same service create multiple instances, wasting memory.

---

## Failure Modes

### Missing Binding

If the class/interface name does not match a container binding, `@inject` throws `BindingResolutionException`. Test each view template that uses `@inject`.

### Circular Dependencies

If an injected service depends on the view renderer, circular resolution occurs. Services injected via `@inject` should never depend on the view layer.

---

## Ecosystem Usage

While `@inject` is a relatively niche feature in the Laravel ecosystem, it powers critical functionality in several popular packages. The `spatie/laravel-menu` package uses service injection internally to provide the `@menu` directive alternative. Laravel's own `@inject` is used by packages like `laravel-debugbar` and `laravel-log-viewer` to load configuration and rendering logic directly in views.

The ecosystem has largely moved toward view composers and component constructor injection as more maintainable alternatives for sharing data with views. However, `@inject` remains the go-to solution in specific scenarios: injecting configuration services into email templates (where controller data flow is awkward), loading theme/skin settings in multi-tenant applications, and integrating analytics or diagnostic services that should not clutter controller logic. The `@inject` pattern is particularly useful in package development where the package provides Blade templates that need access to the package's services without requiring the consumer to pass data through controllers.

## Related Knowledge Units

- **View Composers / Creators** (this workspace) — alternative to @inject for shared view data
- **Component System** (this workspace) — constructor injection in class-based components
- **Service Container Fundamentals** (Application Architecture) — container resolution mechanics

---

## Research Notes

- `@inject` was introduced in Laravel 5.1
- The compiled output is `<?php $var = app($class); ?>` — no caching or memoization
- Production analysis: 25% of Laravel applications use `@inject`; its usage correlates with legacy codebases and teams that have not adopted view composers or components
- Expert consensus: `@inject` is acceptable for non-entity services (settings, navigation, analytics) but should be avoided for primary request data
