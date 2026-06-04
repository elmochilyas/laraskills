# Experience Curation: Blade Component Namespacing

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/blade-component-namespacing
- **Maturity:** Mature
- **Related Technologies:** Laravel Blade, Spatie Package Tools, Anonymous Components, View Namespaces
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Blade component namespacing in Laravel packages uses the `x-` prefix with a namespace delimiter (`::`) to render components from a specific package: `<x-package-name::component-name />`. The namespace is registered via `loadViewsFrom()` (for anonymous components) and/or `Blade::component()` (for class-based components). Spatie Package Tools encapsulates both registrations through `->hasViews()` and `->hasViewComponent()`. The namespace prefix must be unique across all packages to prevent conflicts. Components can be class-based (PHP class + Blade template) or anonymous (Blade template only), and both resolve under the same namespace prefix.

## Core Concepts
- **Namespace Prefix:** The string before `::` in the component tag (`<x-package-name::button />`); must match the namespace registered in `loadViewsFrom($path, 'package-name')`
- **Component Name Resolution:** The component name after `::` resolves to a Blade template file (`button` → `button.blade.php` in the registered views directory)
- **Class Component Registration:** `Blade::component('package-name::button', Button::class)` maps the component tag to a PHP class that handles rendering logic
- **Anonymous Component Resolution:** When no class component is registered, Blade looks for `[namespace-path]/[name]/index.blade.php` or `[namespace-path]/[name].blade.php`
- **Namespace as Directory Mapping:** The namespace prefix maps to a registered directory; `package-name::button` → `resources/views/button.blade.php` in the package
- **Anonymous vs Class Components as View-Only vs View+Logic:** Anonymous components are like HTML partials (template only); class components are like controllers + partials (logic + template)

## When To Use
- Any package that provides Blade components rendered via `<x-prefix::component-name />` syntax
- Packages with reusable UI elements (buttons, cards, modals, form inputs) that need a grouped namespace
- Design system packages that provide a cohesive set of components under a common prefix
- Packages that need both logic-containing components (class-based) and simple template components (anonymous)

## When NOT To Use
- Packages that don't render Blade views (API-only, console-only, backend utilities)
- Packages that use Inertia or Livewire exclusively for frontend rendering
- Packages with a single component that doesn't benefit from namespace grouping
- Packages where component templates are loaded from the consumer's view directory (not vendor)

## Best Practices
- **WHY:** Use the composer package name (without vendor prefix) as the namespace prefix for uniqueness across the ecosystem; `my-package` for `vendor/my-package`
- **WHY:** Use class components for any component with PHP logic (computed properties, validation, attribute casting, dependency injection); use anonymous components for purely presentational templates
- **WHY:** Use Spatie tools' `->hasViews()` to register the view namespace and `->hasViewComponent('prefix', Component::class)` for each class component; tools handle the namespace matching
- **WHY:** Use the same namespace prefix consistently across views (`view('namespace::view')`), components (`<x-namespace::component />`), and layouts (`@extends('namespace::layout')`) for developer familiarity
- **WHY:** Verify namespace uniqueness before release; check that no other popular package uses the same namespace prefix to prevent silent override conflicts

## Architecture Guidelines
- **Package Name as Namespace Convention:** Use the composer package name (without vendor prefix) as the namespace prefix for uniqueness
- **Class Component for Behavior Pattern:** Use class components when the component needs computed properties, validation, attribute casting, or dependency injection
- **Consistent Namespace Across Package:** Use the same namespace prefix for views, components, and layouts for developer consistency
- **Subdirectory Organization Pattern:** Organize component templates in subdirectories: `forms/input.blade.php`, `forms/select.blade.php`; components referenced as `<x-package::forms.input />`
- **Spatie Tools Pattern:** Use `->hasViews()` to register the view namespace and `->hasViewComponent('prefix', Component::class)` for each class component
- **Component Class Location:** Store in `src/Components/` for simplicity; matches Laravel convention
- **Subdirectory Depth:** Maximum 2 levels (`category/component`) for organization without complexity

## Performance
- Class components resolve faster than anonymous components because the class-view mapping is explicit (no filesystem lookup for anonymous templates)
- `php artisan view:cache` compiles all registered Blade files (including namespaced package templates) into cached PHP files, eliminating template parsing overhead on each render
- Each class component is instantiated per render occurrence; avoid heavy constructor logic that runs on every component render
- Anonymous components incur a filesystem check on first access (cached afterward by Blade); the cost is negligible for most applications
- View caching in deployment eliminates all runtime namespace resolution overhead

## Security
- Class components can access the service container; ensure they don't expose sensitive data or perform unauthorized actions based on request input
- Published component views are in the consumer's resource directory and can be modified; document security expectations for overridden views
- User data rendered through components should be properly escaped with `{{ }}` syntax
- Class component constructor parameters (from Blade attributes) should be validated and sanitized
- Ensure component attribute binding doesn't allow arbitrary method calls or property access on component classes

## Common Mistakes

### Namespace mismatch between views and components
- **Description:** Using `loadViewsFrom($path, 'package')` but registering components as `<x-mypackage::button />`
- **Consequence:** The namespace doesn't match; Blade cannot resolve the component and throws an error
- **Better Approach:** Ensure the namespace string in `loadViewsFrom()` matches exactly what's used in Blade component tags

### Anonymous component path not matching name
- **Description:** Component `<x-package::forms.button>` but file is at `forms/buttons/button.blade.php` (incorrect)
- **Consequence:** Blade can't find the component template; `InvalidArgumentException` thrown
- **Better Approach:** Follow Blade's convention: `name` resolves to `name.blade.php` or `name/index.blade.php`; `category.name` resolves to `category/name.blade.php`

### Registering the same namespace from two packages
- **Description:** Two packages calling `loadViewsFrom()` with the same namespace string
- **Consequence:** One silently overrides the other's components; the first package's components break
- **Better Approach:** Always verify namespace uniqueness; use the full unique package name as prefix

### Forgetting kebab-case conversion
- **Description:** PHP class `MyButton` expecting `<x-package::MyButton />` but Blade converts to `<x-package::my-button />`
- **Consequence:** Anonymous resolution fails; class component may need explicit registration
- **Better Approach:** For class components, register explicitly with `Blade::component()`; for anonymous, use kebab-case file names matching the kebab-case tag

### Not registering view namespace at all
- **Description:** Using `<x-package::button />` without calling `loadViewsFrom()`
- **Consequence:** Blade cannot resolve the component because no namespace is registered
- **Better Approach:** Always call `loadViewsFrom()` for the package views directory, even if only using class components

## Anti-Patterns
- **Global component registration:** Registering components without a namespace prefix (`<x-button />` instead of `<x-package::button />`); risks naming collisions
- **Changing namespace between versions:** Changing the namespace prefix in a new package version; breaks all existing consumer component references
- **Overly deep namespaces:** Using 4+ levels of subdirectories (`forms/inputs/text/primary.blade.php`); creates verbose component tags and complex file structures
- **Namespace overloading:** Using the same namespace prefix for unrelated concerns (views, translations, assets); each resource type should follow its own namespace conventions
- **Ignoring Spatie tools:** Manually registering view namespaces and components when Spatie tools provide a cleaner declarative approach

## Examples
- **Filament:** Comprehensive namespace system with separate namespaces for forms (`filament-forms`), tables (`filament-tables`), and panels (`filament-panels`)
- **Spatie Packages:** Use their package name as the component namespace (e.g., `spatie-permission`, `spatie-media-library`)
- **Flux UI:** Community UI library using `flux` namespace for all components; demonstrates deep subdirectory organization
- **Laravel UI:** Uses `laravel-ui` namespace for authentication scaffolding components

## Related Topics
- view-component-registration-packages (how components are registered in service providers)
- inertia-component-integration-packages (Inertia has its own component registration separate from Blade)
- package-service-provider-patterns (component registration happens in the service provider)
- spatie-laravel-package-tools (provides `hasViewComponent()` for declarative registration)
- laravel-blade (broader Blade component system and rendering pipeline)

## AI Agent Notes
- The kebab-case conversion for anonymous components (PHP class `MyButton` → Blade tag `my-button`) is a common source of confusion; always explicitly mention it
- When debugging component not found errors, first verify the namespace string consistency between registration and usage
- Spatie tools eliminate namespace management concerns; recommend them for all but the simplest packages
- The trend toward component libraries (Filament, Flux) has increased the importance of proper namespacing
- For backward compatibility, keep deprecated namespace aliases for one major version cycle before removing

## Verification
- [ ] View namespace is registered via `loadViewsFrom()` in the service provider
- [ ] Namespace prefix is unique and based on the package name
- [ ] Class components are registered via `Blade::component()` or Spatie's `->hasViewComponent()`
- [ ] Anonymous component templates follow Blade's resolution convention (`name.blade.php` or `name/index.blade.php`)
- [ ] Component tags use the correct namespace: `<x-package-name::component-name />`
- [ ] Kebab-case conversion is accounted for in file naming
- [ ] No namespace conflicts with other packages
- [ ] Components render correctly in test environment
- [ ] `php artisan view:cache` succeeds without namespace conflicts
- [ ] Component views are made publishable for customization (if applicable)
