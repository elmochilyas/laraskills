# Skill: Register Blade Component Namespacing for Laravel Packages

## Purpose
Set up proper Blade component namespacing in Laravel packages, registering view namespaces and class/anonymous components with unique prefixes to prevent naming collisions.

## When To Use
- Package provides Blade components rendered via `<x-prefix::component-name />`
- Package has reusable UI elements needing a grouped namespace
- Design system package with a cohesive set of components under a common prefix

## When NOT To Use
- Package doesn't render Blade views (API-only, console-only)
- Package uses Inertia or Livewire exclusively
- Single component that doesn't need namespace grouping

## Prerequisites
- Package service provider (Spatie Package Tools recommended)
- Blade component template files
- Component class files (for class-based components)

## Inputs
- Package name (for namespace prefix)
- Component template files in `resources/views/`
- Component classes (if class-based) in `src/Components/`

## Workflow (numbered)
1. **Choose namespace prefix** — Use composer package name without vendor prefix (e.g., `my-package`)
2. **Organize templates** — Place Blade files in `resources/views/` with subdirectory organization (max 2 levels: `forms/input.blade.php`)
3. **Register view namespace** — `$this->loadViewsFrom(__DIR__.'/../resources/views/', 'package-name')`
4. **Register class components** — `Blade::component('package-name::button', Button::class)` or Spatie's `->hasViewComponent('prefix', Component::class)`
5. **Use consistent namespace** — Use same prefix for views, components, and layouts: `<x-package::button />`, `view('package::view')`, `@extends('package::layout')`
6. **Verify uniqueness** — Check no other popular package uses the same namespace prefix
7. **Test rendering** — Render components in test environment; verify `<x-package::component />` resolves correctly

## Validation Checklist
- [ ] View namespace registered via `loadViewsFrom()` in service provider
- [ ] Namespace prefix unique and based on package name
- [ ] Class components registered via `Blade::component()` or Spatie's `->hasViewComponent()`
- [ ] Anonymous component templates follow Blade convention (`name.blade.php` or `name/index.blade.php`)
- [ ] Component tags use correct namespace: `<x-package-name::component-name />`
- [ ] Kebab-case accounted for: `MyButton` → `my-button`
- [ ] No namespace conflicts with other packages
- [ ] `php artisan view:cache` succeeds

## Common Failures
- **Namespace mismatch** — view namespace and component tag namespace don't match; Blade cannot resolve
- **Anonymous component path mismatch** — file naming doesn't follow Blade resolution conventions
- **Same namespace from two packages** — one silently overrides the other's components
- **Forgetting kebab-case** — PHP class `MyButton` expects `<x-package::my-button />`, not `<x-package::MyButton />`
- **Not registering view namespace** — component resolves but views fail; use `loadViewsFrom()` even for class-only components

## Decision Points
- Class vs anonymous components: class for PHP logic; anonymous for pure presentational templates
- Namespace prefix: full package name for uniqueness; shorter prefix for frequently used components
- Subdirectory depth: 1-2 levels for organization; avoid 3+ levels that create verbose tags

## Performance/Security Considerations
- Class components resolve faster than anonymous (explicit mapping vs filesystem lookup)
- `php artisan view:cache` eliminates all runtime namespace resolution overhead
- Class components can access the service container; don't expose sensitive data in component output
- Validate and sanitize Blade attributes passed to class component constructors
- User data rendered through components should be properly escaped with `{{ }}`

## Related Rules (from 05-rules.md)
- BC-RULE-001: Package name as namespace
- BC-RULE-002: Class vs anonymous
- BC-RULE-003: Consistent namespace
- BC-RULE-004: Verify uniqueness
- BC-RULE-005: Subdirectory organization
- BC-RULE-007: Spatie tools pattern
- BC-RULE-009: Kebab-case for anonymous

## Related Skills
- Set Up a Package Service Provider with Spatie Tools
- View Component Registration for Packages
- Integrate Inertia Components in Packages

## Success Criteria
- `<x-package-name::component-name />` renders correctly in any Laravel app
- No namespace conflicts with other installed packages
- Both class-based and anonymous components work under the same namespace
- `php artisan view:cache` completes without errors
- Component templates publishable for consumer customization (if applicable)
