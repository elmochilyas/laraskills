# Service Injection

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Blade / View Layer
- **Knowledge Unit:** Service Injection
- **Difficulty Level:** Intermediate
- **EECC Version:** 1.0
- **Last Updated:** 2026-06-02

---

## Overview

Blade's `@inject` directive retrieves a service from the service container directly in the view. It takes a variable name and a service class/interface name, resolves the service, and assigns it to the variable for template use.

**Engineering value:** Convenience — views can access services without passing data through controllers. The cost is a hidden dependency on the service container, making templates harder to test and refactor. `@inject` is a pragmatic shortcut, not an architectural pattern.

---

## Core Concepts

### Basic Usage
```blade
@inject('analytics', 'App\Services\AnalyticsService')
<p>Page views today: {{ $analytics->pageViewsToday() }}</p>
```

### Injection with Interface
```blade
@inject('users', 'App\Contracts\UserRepository')
@foreach ($users->recent() as $user)
    <li>{{ $user->name }}</li>
@endforeach
```

### Compiled Output
```php
// @inject('var', 'Class') compiles to:
<?php $var = app('App\Services\AnalyticsService'); ?>
```

### Variants
`@inject` is equivalent to the `@php` block approach:
```blade
@php
    $analytics = app(AnalyticsService::class);
@endphp
```

---

## When To Use

- **Global site settings** — theme config, site name, feature flags
- **Navigation/menu building** — dynamic menus from a NavigationService
- **Analytics/diagnostics** — page view counters, A/B test flags, survey prompts
- **Configuration services** — injected settings that rarely change
- **Non-entity services** — services that return computed data, not database rows

---

## When NOT To Use

- **Primary request data** — the resource being displayed should come from the controller
- **Entity/repository injection** — `@inject('users', UserRepository::class)` couples presentation to persistence
- **Write operations** — never use `@inject` to trigger mutations (`$analytics->recordPageView()`)
- **Business logic** — complex rules belong in services/actions, not called from views
- **Component classes** — use constructor injection in class-based components instead

---

## Best Practices (WHY)

**WHY inject only singleton services.** `@inject` calls `app()` on every render — if not singleton-bound, a new instance is constructed per call. Singleton registration ensures O(1) lookup with no constructor overhead.

**WHY document injected dependencies in template headers.** `@inject` creates hidden dependencies that are invisible to anyone reading controller code. Document them with Blade comments to prevent confusion during refactoring.

**WHY prefer view composers for shared data used across multiple views.** A composer is registered once and applies to all matching views. `@inject` must be added to every template individually — error-prone and inconsistent.

**WHY avoid business logic in injected service calls.** The service method called in the view should return data, not perform mutations. `@inject` for read operations only.

**WHY use it sparingly.** `@inject` is a back door into the view layer. It bypasses the controller's data preparation, making data flow harder to trace. Prefer controller-passed data for primary content.

---

## Architecture Guidelines

### @inject vs View Composer vs Controller Data
| Concern | @inject | View Composer | Controller Data |
|---|---|---|---|
| Scope | Per-template | Per-view (globally registered) | Single action |
| Hidden dependencies | Yes (@inject in template) | Partial (composer registration) | No (explicit in return) |
| Testability | Hard (mock container) | Medium (mock composer) | Easy (pass data directly) |
| Discoverability | Low | Medium | High |
| Refactoring risk | High | Medium | Low |

### Acceptable Use Cases
- Global site settings
- Navigation structure
- Analytics/diagnostics
- Feature flag evaluation

### Avoid Use Cases
- Primary data (the resource being displayed)
- User-specific data
- Business logic
- Write/mutation operations

---

## Performance

- `@inject` resolves from container on every render: `app('Class')` is O(1) for singletons, O(n) for non-singletons (constructor chain)
- Services with expensive constructors should be registered as singletons
- Multiple `@inject` calls for the same non-singleton service create separate instances
- No caching or memoization — each render triggers fresh resolution

---

## Security

- Injected services have full access to the container — never inject services that expose mutation methods from templates
- Services should expose read-only methods that return data (idempotent, no side effects)
- Do not inject repositories or Eloquent models directly — this couples presentation to data access layer
- Service resolution via `app()` uses the container's binding configuration — ensure bindings are secure

---

## Common Mistakes

### 1. Injecting repositories directly
- **Description:** `@inject('users', 'App\Repositories\UserRepository')`
- **Cause:** Convenience — avoid passing data from controller
- **Consequence:** Presentation layer coupled to persistence; view triggers database queries
- **Better:** Controller fetches data and passes as variables; use `@inject` only for non-entity services

### 2. Expensive service resolution
- **Description:** Service constructor performs DB queries or API calls
- **Cause:** Constructor-time initialization instead of lazy loading
- **Consequence:** Query/API call on every view render, even when the injected variable isn't used
- **Better:** Use lazy properties or method-level caching; register service as singleton

### 3. Forgetting to register as singleton
- **Description:** `@inject` used three times for same service; three instances created
- **Cause:** Service not registered with `$this->app->singleton()`
- **Consequence:** Memory waste and duplicate initialization
- **Better:** Register services used by `@inject` as singletons in service provider

### 4. Triggering write operations from injected calls
- **Description:** `{{ $analytics->recordPageView() }}` — side effect in view
- **Cause:** Treating `@inject` as a general-purpose service accessor
- **Consequence:** Page view recorded every time the view renders (including caching, partial rendering)
- **Better:** Only call read methods from templates; move writes to middleware or controllers

### 5. Missing binding causes runtime error
- **Description:** Class name doesn't match any container binding
- **Cause:** Typo in class name or interface not bound
- **Consequence:** `BindingResolutionException` on page render
- **Better:** Test each view that uses `@inject`; document expected bindings

---

## Anti-Patterns

- **@inject as primary data delivery.** The single most common misuse. If every view starts with 3+ `@inject` calls for the data it displays, the controller is being bypassed.
- **Injected calls that perform mutations.** `{{ $cartService->addItem($id) }}` in a view is a bug — it runs on every render, including partial renders.
- **@inject in component templates.** Use constructor injection in class-based components instead of `@inject` in the component view.
- **Overusing @inject for quick fixes.** Every `@inject` call is technical debt — it creates a hidden dependency that will surprise future maintainers.

---

## Examples

### Settings Service Injection
```blade
@inject('settings', 'App\Services\SettingsService')

<x-header>
    <x-slot:title>{{ $settings->get('site_name') }}</x-slot:title>
</x-header>
```

### Navigation Service
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

### With Singleton Registration
```php
// AppServiceProvider::register()
public function register(): void
{
    $this->app->singleton(NavigationService::class);
    $this->app->singleton(SettingsService::class);
}
```

---

## Related Topics

- **View Composers / Creators** — alternative for shared view data across multiple views
- **Component System** — constructor injection in class-based components
- **Service Container Fundamentals** (Application Architecture) — container resolution mechanics
- **View Models / Presenters** — preparing complex view data in dedicated classes

---

## AI Agent Notes

- `@inject` introduced in Laravel 5.1
- Compiled output: `<?php $var = app($class); ?>` — no caching or memoization
- ~25% of Laravel applications use `@inject`; usage correlates with legacy codebases
- Expert consensus: acceptable for non-entity services (settings, navigation, analytics) but avoid for primary request data
- Can use fully-qualified class name or interface binding string
- Does NOT support method injection — only constructor injection via container

---

## Verification

- [ ] Injected service is registered as singleton in a service provider
- [ ] `@inject` variable name does not conflict with controller-passed variables
- [ ] Service methods called from view are read-only (no mutations)
- [ ] Missing binding test exists for each `@inject` usage
- [ ] Template documents all injected dependencies with comments
- [ ] No repositories or entity-related services are injected
- [ ] View renders correctly without requiring controller changes
- [ ] Service resolution does not trigger database queries in constructor
