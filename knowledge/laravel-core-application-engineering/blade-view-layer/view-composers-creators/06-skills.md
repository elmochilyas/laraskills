# Skill: Implement View Composers for Shared Data

## Purpose

Attach data (navigation, user context, notifications, configuration) to views automatically whenever they render, eliminating repetitive controller data passing.

## When To Use

- Global user data — authenticated user, permissions across all views
- Navigation/sidebar data — menu items, breadcrumbs, active route
- Notification badges — unread counts, system alerts
- Static configuration — app name, locale, debug flag (use creators)
- Data shared across multiple controller actions

## When NOT To Use

- Single-controller data (pass it directly from the controller)
- Simple one-off service access (use `@inject` instead)
- Component-specific data (use constructor injection in class-based components)
- Expensive queries on every page (wildcard composers with DB queries degrade all pages)
- Data that varies per page context (use a view model instead)

## Prerequisites

- Service provider (preferably a dedicated `ViewServiceProvider`)
- Composer class or closure
- View name or pattern to attach the composer to

## Inputs

- View name(s) or wildcard pattern
- Composer class with `compose(View $view)` method
- Data to share with the view

## Workflow

1. Create a dedicated `ViewServiceProvider` that extends `ServiceProvider` and register it in `config/app.php`
2. For each shared data concern, create a class-based composer with constructor dependency injection implementing `compose(View $view): void`
3. Register composers using `View::composer('view.name', ComposerClass::class)` — scope to specific views or namespaces, not wildcard `*` unless data is truly universal
4. For static configuration data (never changes during a request), use `View::creator('*', CreatorClass::class)` instead of a composer
5. Cache expensive queries inside composers: `cache()->remember('key', 3600, fn() => ...)` — especially critical for wildcard composers
6. Use prefixed variable names in `$view->with('prefixVariable', $data)` to prevent accidental override of controller-passed variables
7. Register all composer and creator calls in one centralized `ViewServiceProvider::boot()` method

## Validation Checklist

- [ ] Composer registration is centralized in a dedicated ViewServiceProvider
- [ ] Wildcard composers cache expensive queries or use only request-scoped data
- [ ] No composer data variable name conflicts with controller-passed variables (prefixed names used)
- [ ] Composer-provided variables are documented in the template or a central reference
- [ ] Class-based composers use constructor injection instead of `app()` in closures
- [ ] Creators are used only for truly static configuration data (not auth-dependent data)
- [ ] View tests include composer data setup or test composer class in isolation

## Common Failures

- **Database queries in wildcard composers:** `View::composer('*', ...)` with uncached DB queries runs on every partial and component render. Scope to specific views or cache aggressively.
- **Silent data override:** Composer sets `$users` but controller also sets `$users` — composer silently wins. Prefix composer variables like `$currentUser`.
- **Using creators for request-scoped data:** `View::creator()` for auth-dependent data may be stale if view is cached. Use composers for dynamic data; creators for static config only.
- **Registering same composer multiple times:** Two providers both register the same composer. Centralize all registrations in one provider.
- **Ignoring composer in view tests:** Testing a view without composer data setup causes missing variable errors. Set up composer data or test composer class in isolation.

## Decision Points

- Composer vs creator: Use composers for data that varies per request (auth, notifications, navigation). Use creators for truly static data that never changes during a request (app name, locale config).
- Class-based vs closure composer: Use class-based for testability, dependency injection, and reuse. Use closures only for trivial single-line data binding.
- Wildcard (`*`) vs scoped composer: Use wildcard only for data genuinely needed on every view (current user, app name). Scope to specific views or namespaces for section-specific data.

## Performance Considerations

- Composers add data retrieval cost on every render
- Wildcard `*` composers run on EVERY view render — partials, components, emails included
- Creators run once per view instance — if view renders in a loop, creator runs each iteration
- Always cache expensive queries: `cache()->remember('key', 3600, fn() => ...)`

## Security Considerations

- Composers have access to `auth()` and `request()` — ensure they don't expose sensitive data to unauthorized views
- A wildcard composer that sets `$adminUsers` leaks to public-facing partials — scope data to specific views
- Never pass raw database models through composers unless the view is authorized to see them
- Composer data is merged into the view's data array — the view can't distinguish composer data from controller data

## Related Rules

- view-composers-creators/05-rules.md: Centralize All Composer Registration in a Dedicated ViewServiceProvider
- view-composers-creators/05-rules.md: Cache Expensive Queries in Wildcard Composers
- view-composers-creators/05-rules.md: Prefer Class-Based Composers Over Closures
- view-composers-creators/05-rules.md: Avoid Wildcard Composers for Global Data That Most Views Do Not Use
- view-composers-creators/05-rules.md: Prevent Silent Data Override Between Composers and Controllers
- view-composers-creators/05-rules.md: Use Creators Only for Truly Static Configuration Data
- view-composers-creators/05-rules.md: Test Composer-Provided Data in View Tests

## Related Skills

- Service Injection: Use @inject for Non-Entity Read-Only Services
- View Models and Presenters: Implement View Models for Complex Template Data
- Component System: Create and Use Blade Components
- Layout Strategies: Implement Multi-Layout Strategy

## Success Criteria

- All view composer registrations are centralized in a dedicated ViewServiceProvider
- Composers are scoped to specific views or namespaces — wildcards used only for universally needed data
- Expensive queries in composers are cached
- Composer variable names are prefixed to avoid collision with controller data
- Creators are used exclusively for static configuration, not auth-dependent or request-scoped data
- Composer classes are unit-testable and tested in isolation
