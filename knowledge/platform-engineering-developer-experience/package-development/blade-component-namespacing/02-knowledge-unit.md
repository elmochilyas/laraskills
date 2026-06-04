# Knowledge Unit: Blade Component Namespacing

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/blade-component-namespacing
- **Maturity:** Mature
- **Related Technologies:** Laravel Blade, Spatie Package Tools, Anonymous Components, View Namespaces

## Executive Summary

Blade component namespacing in Laravel packages uses the `x-` prefix with a namespace delimiter (`::`) to render components from a specific package: `<x-package-name::component-name />`. The namespace is registered via `loadViewsFrom()` (for anonymous components) and/or `Blade::component()` (for class-based components). Spatie Package Tools encapsulates both registrations through `->hasViews()` and `->hasViewComponent()`. The namespace prefix must be unique across all packages to prevent conflicts. Components can be class-based (PHP class + Blade template) or anonymous (Blade template only), and both resolve under the same namespace prefix.

## Core Concepts

- **Namespace Prefix:** The string before `::` in the component tag (`<x-package-name::button />`); must match the namespace registered in `loadViewsFrom($path, 'package-name')`
- **Component Name Resolution:** The component name after `::` resolves to a Blade template file (`button` → `button.blade.php` in the registered views directory)
- **Class Component Registration:** `Blade::component('package-name::button', Button::class)` maps the component tag to a PHP class that handles rendering logic
- **Anonymous Component Resolution:** When no class component is registered, Blade looks for `[namespace-path]/[name]/index.blade.php` or `[namespace-path]/[name].blade.php`

## Mental Models

- **Namespace as Directory Mapping:** The namespace prefix maps to a registered directory; `package-name::button` → `resources/views/button.blade.php` in the package
- **Component Tag as URL Path:** Think of `<x-package-name::button />` like a URL path: the namespace is the domain, the component name is the path after the domain
- **Anonymous vs Class Components as View-Only vs View+Logic:** Anonymous components are like HTML partials (template only); class components are like controllers + partials (logic + template)
- **Colon Delimiter as Separation:** The `::` separates the namespace (organized grouping) from the component name (specific file); it's the same pattern used for view namespaces in `view('namespace::view')`

## Internal Mechanics

1. **View Namespace Registration:** `$this->loadViewsFrom(__DIR__.'/../resources/views', 'package-name')` stores the namespace-prefixed path. When `<x-package-name::name />` is called, Blade resolves the path by looking for `name.blade.php` or `name/index.blade.php` in the registered directory.
2. **Class Component Resolution:** When a class component is registered via `Blade::component('package-name::name', ComponentClass::class)`, Blade maps the tag directly to the PHP class, which has a `render()` method returning the view path.
3. **Component Rendering Pipeline:** Tag `<x-package::button type="submit">` → Blade compiler generates PHP → PHP instantiates `Button` component → passes attributes → calls `render()` → includes the view → outputs HTML.
4. **Anonymous Component Lookup:** If no class mapping exists, Blade searches the registered namespace paths. It first checks `[directory]/[name]/index.blade.php`, then `[directory]/[name].blade.php`. If neither exists, an `InvalidArgumentException` is thrown.

## Patterns

- **Package Name as Namespace Convention:** Use the composer package name (without vendor prefix) as the namespace prefix: `my-package` for `vendor/my-package`. This ensures uniqueness across the ecosystem.
- **Class Component for Behavior Pattern:** Use class components when the component needs computed properties, validation, attribute casting, or dependency injection. Use anonymous components for purely presentational templates.
- **Consistent Namespace Across Package:** Use the same namespace prefix for views (`view('namespace::view')`), components (`<x-namespace::component />`), and layouts (`@extends('namespace::layout')`) for developer consistency.
- **Subdirectory Organization Pattern:** Organize component templates in subdirectories: `forms/input.blade.php`, `forms/select.blade.php`, `layouts/card.blade.php`. Components are referenced as `<x-package::forms.input />`.
- **Spatie Tools Pattern:** Use `->hasViews()` to register the view namespace and `->hasViewComponent('prefix', Component::class)` for each class component; Spatie tools handle the namespace matching between views and components.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Namespace value | Package name vs custom vs generic | Package name (composer package name) for uniqueness |
| Component class location | `src/Components/` vs `src/View/Components/` | `src/Components/` for simplicity; matches Laravel convention |
| Anonymous vs class for simple components | Always class vs anonymous by default | Class for any component with logic; anonymous for static templates |
| Subdirectory depth | Flat vs 2-level vs 3-level | 2-level maximum (`category/component`) for organization without complexity |

## Tradeoffs

- **Anonymous vs Class Components:** Anonymous components are faster to create (single Blade file) and simpler for designers to understand, but they can't encapsulate logic, validate attributes, or use dependency injection. Use class components for reusable UI elements that need behavior.
- **Deep vs Shallow Namespaces:** Deep subdirectories (`forms/inputs/text.blade.php`) organize components logically but create verbose component tags (`<x-package::forms.inputs.text />`). Flat namespaces (`text-input.blade.php`) are simpler but may become messy with many components.
- **Overridable vs Locked Components:** Making component views publishable allows consumers to customize appearance but creates maintenance burden. Locked components ensure consistency but limit flexibility. Consider which components need customization.
- **Single vs Multi-File Class Components:** Inline components (`render()` returns a view or string) reduce file count; separate view files separate logic from presentation but require more files. For simple components, inline is efficient; for complex ones, separate views are clearer.

## Performance Considerations

- **Component Resolution Cost:** Class components resolve faster than anonymous components because the class-view mapping is explicit (no filesystem lookup for anonymous templates).
- **View Cache Impact:** `php artisan view:cache` compiles all registered Blade files (including namespaced package templates) into cached PHP files, eliminating the template parsing overhead on each render.
- **Component Instantiation:** Each class component is instantiated per render occurrence; avoid heavy constructor logic that runs on every component render.
- **Anonymous Component Lookup:** Anonymous components incur a filesystem check on first access (cached afterward by Blade); the cost is negligible for most applications.

## Production Considerations

- **Namespace Collision Prevention:** Before registering a namespace, consider potential conflicts. Use unique package prefixes; if two packages conflict, the last registered namespace wins, silently breaking the other.
- **View Publishing for Customization:** If the package components need to be customizable, publish views to `resources/views/vendor/package-name/` using `$this->publishes()`.
- **Component Security:** Class components can access the service container; ensure they don't expose sensitive data or perform unauthorized actions based on request input.
- **Cache Warmup:** In deployment, `php artisan view:cache` warms the view cache including all namespaced package views; this prevents the first request from compiling templates.

## Common Mistakes

- **Namespace mismatch between views and components:** Using `loadViewsFrom($path, 'package')` but registering components as `<x-mypackage::button />`; the namespace must match exactly
- **Anonymous component path not matching name:** Component `<x-package::forms.button>` expects a file at `forms/button.blade.php` or `forms/button/index.blade.php`; if the file is at `forms/button.blade.php` (correct), but placing it at `forms/buttons/button.blade.php` (incorrect) breaks resolution
- **Registering the same namespace from two packages:** Two packages calling `loadViewsFrom()` with the same namespace; one silently overrides the other's components
- **Forgetting kebab-case conversion:** Blade converts `x-package::myComponent` to look for `my-component.blade.php`; PHP files using `MyComponent.php` need explicit registration, not anonymous resolution
- **Not registering view namespace at all:** Using `<x-package::button />` without calling `loadViewsFrom()`; Blade cannot resolve the component and throws an error

## Failure Modes

- **Silent Namespace Override:** Two packages register the same view namespace; Blade resolves views from the last registered path. Mitigate: always verify namespace uniqueness; use the full package name as prefix.
- **Component Not Found After Package Update:** Package renames or moves component templates, but consumer's code references old component names. Mitigate: keep backward-compatible component aliases for one major version cycle.
- **Anonymous Component Lookup Failure:** Component name uses dot notation (`forms.button`) but the file structure uses a different naming convention. Mitigate: follow Blade's convention (`name` resolves to `name.blade.php` or `name/index.blade.php`; `category.name` resolves to `category/name.blade.php`).
- **View Cache Staleness:** After changing component views, the view cache still serves the compiled version. Mitigate: run `php artisan view:clear` or `php artisan view:cache` after updating package views.

## Ecosystem Usage

- **Laravel UI:** Uses `laravel-ui` namespace for authentication scaffolding components
- **Filament:** Comprehensive namespace system with separate namespaces for forms (`filament-forms`), tables (`filament-tables`), and panels (`filament-panels`)
- **Livewire:** Livewire components use a different registration mechanism (`Livewire::component()`) but follow similar namespacing conventions
- **Spatie Packages:** All Spatie packages with Blade components use their package name as the component namespace (e.g., `spatie-permission`, `spatie-media-library`)
- **Flux UI:** Community UI library using `flux` namespace for all components; example of a component library with deep subdirectory organization

## Related Knowledge Units

- view-component-registration-packages
- inertia-component-integration-packages
- package-service-provider-patterns
- spatie-laravel-package-tools

## Research Notes

- Blade component namespacing was introduced in Laravel 7 (2020) alongside anonymous components; the pattern has been stable since
- The kebab-case conversion for anonymous components (PHP class `MyButton` → Blade tag `my-button`) is a common source of confusion
- Component namespacing is one of the areas where Laravel's convention-over-configuration philosophy is most visible
- The trend toward component libraries (Filament, Flux) has increased the complexity of component namespacing, with hierarchical namespaces and conditional registration becoming common patterns
