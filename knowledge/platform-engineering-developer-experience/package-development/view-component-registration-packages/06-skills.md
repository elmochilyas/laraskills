# Skill: Register View Components in Laravel Packages

## Purpose
Register Blade view components (class-based and anonymous) in a Laravel package with proper namespace prefixing, enabling consumers to render them via `<x-package-name::component-name />`.

## When To Use
- Package provides reusable UI elements for Blade views
- Package ships Blade templates consumers use in their own views
- Design system package with cohesive components under a common prefix

## When NOT To Use
- API-only packages that don't render HTML
- Packages using Inertia or Livewire exclusively
- Simple utility packages with no visual output

## Prerequisites
- Package service provider
- Component template files in `resources/views/`
- Component classes (for class-based) in `src/Components/`

## Inputs
- Package name for namespace prefix
- Blade template files
- Component PHP classes (for class-based components)

## Workflow (numbered)
1. **Organize component templates** — Place in `resources/views/` with subdirectory organization (max 2 levels)
2. **Create class components** — Place in `src/Components/` extending `Illuminate\View\Component`; implement `render()` returning a view name
3. **Register view namespace** — `$this->loadViewsFrom(__DIR__.'/../resources/views', 'package-name')`
4. **Register class components** — `Blade::component('package-name::button', Button::class)` or Spatie's `->hasViewComponent('package-name', Button::class)`
5. **Make views publishable** — `$this->publishes([... => resource_path('views/vendor/package-name')], 'package-name-views')` for themeable components
6. **Test rendering** — Verify `<x-package-name::component />` resolves and renders correctly
7. **Cache views** — Run `php artisan view:cache` in deployment

## Validation Checklist
- [ ] `loadViewsFrom()` called with correct namespace prefix
- [ ] Class components registered via `Blade::component()` or `->hasViewComponent()`
- [ ] Namespace prefix unique, based on package name
- [ ] Class component `render()` returns valid view path within namespace
- [ ] User-provided data escaped with `{{ }}`
- [ ] Views publishable for themeable components
- [ ] `php artisan view:cache` succeeds without conflicts

## Common Failures
- **Namespace mismatch** — Blade tags use different namespace than `loadViewsFrom()`
- **Forgetting to register view namespace** — anonymous components don't resolve
- **Registering same namespace twice** — two packages conflict; last one wins
- **Class render() returns non-existent view** — view not found in registered namespace
- **Global registration without namespace** — `<x-button />` collides with other packages

## Decision Points
- Class vs anonymous: class for PHP logic; anonymous for pure presentational templates
- Publishable vs vendor-only: publishable for themed components; vendor-only for functional components
- Namespace prefix: full package name (unique) vs short prefix (convenient but risky)

## Performance/Security Considerations
- Component registration adds minimal boot time (microseconds)
- Anonymous components have slight filesystem overhead on first access; class components resolve faster
- `php artisan view:cache` eliminates runtime resolution overhead
- Escape user data with `{{ }}`; never use `{!! !!}` for user-provided content
- Validate and sanitize constructor parameters from Blade attributes
- Never resolve component namespace from user input (view path traversal risk)

## Related Rules (from 05-rules.md)
- VIEWC-RULE-001: Package name as component namespace
- VIEWC-RULE-002: Class-based for logic, anonymous for templates
- VIEWC-RULE-003: Always register view namespace
- VIEWC-RULE-004: Spatie tools for declarative registration
- VIEWC-RULE-006: Unique namespace prefix
- VIEWC-RULE-009: Escape user data with {{ }}

## Related Skills
- Register Blade Component Namespacing for Laravel Packages
- Set Up a Package Service Provider with Spatie Tools
- Integrate Inertia Components in Laravel Packages

## Success Criteria
- `<x-package-name::component />` renders correctly in any Laravel app
- Class components work with property injection and computed methods
- Anonymous components resolve from the registered view namespace
- No namespace conflicts with other packages
- Themed components publishable for consumer customization
