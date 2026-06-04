# Skill: Use @inject for Non-Entity Read-Only Services

## Purpose

Access singleton services (settings, navigation, analytics, feature flags) directly in Blade templates via `@inject` without passing data through controllers.

## When To Use

- Global site settings — theme config, site name, feature flags
- Navigation/menu building — dynamic menus from a NavigationService
- Analytics/diagnostics — page view counters, A/B test flags
- Configuration services — injected settings that rarely change
- Non-entity services that return computed data, not database rows

## When NOT To Use

- Primary request data (the resource being displayed should come from the controller)
- Entity/repository injection (`@inject('users', UserRepository::class)` couples presentation to persistence)
- Write operations — never use `@inject` to trigger mutations
- Business logic — complex rules belong in services/actions
- Component classes — use constructor injection instead

## Prerequisites

- Service class registered in the service container
- Service registered as singleton in a service provider
- Blade template where the service data is needed

## Inputs

- Fully-qualified service class name or interface binding
- Variable name to assign the resolved service to
- Read-only method calls on the injected service

## Workflow

1. Register the service as a singleton in a service provider: `$this->app->singleton(ServiceClass::class)`
2. At the top of the Blade template, use `@inject('variableName', 'App\Services\ServiceClass')`
3. Add a Blade comment documenting each injected dependency: `{{-- $settings: App\Services\SettingsService — site config --}}`
4. Call only read-only, idempotent methods on the injected variable — never methods that write to the database, send emails, or mutate state
5. For data needed across many views, prefer view composers over `@inject` to avoid repeating the directive in every template

## Validation Checklist

- [ ] Injected service is registered as singleton in a service provider
- [ ] `@inject` variable name does not conflict with controller-passed variables
- [ ] Service methods called from view are read-only (no mutations)
- [ ] Template documents all injected dependencies with Blade comments
- [ ] No repositories or entity-related services are injected
- [ ] Service resolution does not trigger database queries in constructor
- [ ] Missing binding test exists for each `@inject` usage

## Common Failures

- **Injecting repositories directly:** `@inject('users', UserRepository::class)` couples presentation to persistence. Only inject non-entity services.
- **Expensive service resolution:** Service constructor performs DB queries or API calls. Register as singleton and use lazy properties.
- **Forgetting singleton registration:** Multiple `@inject` calls create separate instances. Always register as singleton in service provider.
- **Triggering writes from injected calls:** `{{ $analytics->recordPageView() }}` runs on every render. Only call read methods from templates.
- **Missing binding causes runtime error:** Class name typo or interface not bound throws `BindingResolutionException`. Test each view using `@inject`.

## Decision Points

- `@inject` vs view composer: Use `@inject` for one-off service access in a single template. Use view composers for data shared across multiple views.
- `@inject` vs controller data: Pass primary request data from the controller. Use `@inject` only for configuration, navigation, and analytics services.

## Performance Considerations

- `@inject` resolves from container on every render: `app('Class')` is O(1) for singletons
- Non-singleton services create a new instance per `@inject` call — constructor chain runs each time
- Multiple `@inject` calls for the same non-singleton service create separate instances
- No caching or memoization — each render triggers fresh resolution

## Security Considerations

- Injected services have full access to the container — never inject services that expose mutation methods
- Services should expose only read-only, idempotent methods from templates
- Do not inject repositories or Eloquent models directly — couples presentation to data access layer
- Service resolution via `app()` uses the container's binding configuration — ensure bindings are secure

## Related Rules

- service-injection/05-rules.md: Use `@inject` Only for Non-Entity, Read-Only Services
- service-injection/05-rules.md: Register Injected Services as Singletons
- service-injection/05-rules.md: Never Trigger Write Operations from Injected Services
- service-injection/05-rules.md: Prefer View Composers Over `@inject` for Shared Data
- service-injection/05-rules.md: Document All `@inject` Dependencies with Blade Comments
- service-injection/05-rules.md: Do Not Use `@inject` Inside Component Views

## Related Skills

- View Composers and Creators: Implement View Composers for Shared Data
- Component System: Create and Use Blade Components
- View Models and Presenters: Implement View Models for Complex Template Data

## Success Criteria

- Injected services are non-entity, read-only services (settings, navigation, analytics)
- All injected services are registered as singletons
- No write/mutation calls are made from the template on injected services
- Each `@inject` usage is documented with a Blade comment
- Component views use constructor injection instead of `@inject`
