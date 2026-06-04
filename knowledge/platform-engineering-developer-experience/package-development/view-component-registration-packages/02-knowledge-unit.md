# Knowledge Unit: View Component Registration in Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/view-component-registration-packages
- **Maturity:** Mature
- **Related Technologies:** Laravel Blade, Spatie Package Tools, Anonymous Components, Component Namespaces

## Executive Summary

Registering Blade view components in Laravel packages involves: registering the view namespace (`loadViewsFrom()`), registering Blade component classes with a prefix (`Blade::component()` or `->hasViewComponent()` in Spatie tools), and optionally registering anonymous component directories. The package's components are rendered using a prefix namespace in the application (`<x-package-name::component-name />`). Proper component registration ensures that: component classes are auto-discovered by the Blade compiler, views are located in the correct namespace, and component tags resolve to the correct PHP class. Spatie tools' `->hasViewComponent()` method encapsulates this registration into a single declarative call.

## Core Concepts

- **Blade Component Namespace:** A prefix (e.g., `package-name`) that groups the package's components; components are rendered as `<x-package-name::button />` in Blade templates
- **Anonymous Components:** Blade components defined by template files only (no PHP class); registered via `loadViewsFrom()`; rendered as `<x-package-name::alert />`
- **Class-Based Components:** PHP classes extending `Illuminate\View\Component` with a corresponding Blade template; registered via `Blade::component('class', 'namespace')`
- **View Namespace Registration:** `loadViewsFrom(__DIR__.'/../resources/views', 'package-name')` makes views loadable via `view('package-name::view-name')` and enables anonymous component resolution

## Mental Models

- **Namespace as Component Prefix:** The view namespace becomes the Blade component prefix; `loadViewsFrom($path, 'prefix')` makes `<x-prefix::name />` resolve to `$path/name.blade.php`
- **Class vs Anonymous Components:** Class components have PHP logic (computed properties, methods, attributes); anonymous components are pure templates with passed data. Use class components for reusable UI with behavior; anonymous for simple structural templates.
- **Component as API:** The component's public API includes: attributes (constructor parameters), slots (content between tags), and computed properties (methods/properties available in the view)

## Internal Mechanics

1. **View Namespace Registration:** `$this->loadViewsFrom()` stores a namespace-to-path mapping in Laravel's `ViewFinderInterface`. When `view('namespace::view')` or `<x-namespace::name />` is called, Blade resolves the path from the registered namespace.
2. **Class Component Registration:** `Blade::component('namespace::component', ComponentClass::class)` or Spatie's `->hasViewComponent('namespace', ComponentClass::class)` registers the class as the renderer for the `<x-namespace::component />` tag.
3. **Anonymous Component Resolution:** When `<x-namespace::name />` is rendered and no class component is registered for that tag, Blade looks for a view file at `[namespace_path]/name/index.blade.php` or `[namespace_path]/name.blade.php`.
4. **Component Rendering:** Blade compiles `<x-package::button type="submit" />` into PHP that instantiates the Component class, passes attributes, renders the view, and outputs HTML. The component's `render()` method returns the view path.

## Patterns

- **Prefix Convention Pattern:** Use the package name (without vendor prefix) as the component namespace (e.g., `settings` for `my-org/settings`). This is consistent with the view namespace.
- **Class-Based Default Pattern:** Register the most common components as class-based (enables logic encapsulation); use anonymous components for purely structural or single-use components.
- **Component Library Pattern:** Package provides a set of related components (button, card, modal, alert, form inputs) all under the same namespace prefix for a cohesive design system.
- **Override Pattern:** Allow consumers to override package views by publishing and modifying them (`$this->publishes([$path => resource_path('views/vendor/package-name')])`), but component classes remain in the vendor directory and can't be overridden.
- **Spatie Tools Pattern:** Use `->hasViews()` to register the view namespace and `->hasViewComponent('prefix', Component::class)` for each component class, keeping registration declarative.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Component type | Class-based vs anonymous | Class-based for reusable components with behavior; anonymous for simple templates |
| Component prefix | Package name vs custom namespace | Package name for consistency; custom for design system packages |
| View publishing | Published (overridable) vs vendor-only | Published for themes/styling; vendor-only for functional components |
| Inline components | Inline views vs separate view files | Separate files for complex views; inline for simple one-line components |

## Tradeoffs

- **Anonymous vs Class Components:** Anonymous components are simpler to create (just a Blade file) but cannot encapsulate PHP logic or computed properties. Class components provide better separation of concerns and testability but require more files.
- **Global vs Namespaced Components:** Global components (`<x-button />`) are shorter to write but risk naming collisions. Namespaced components (`<x-package::button />`) are safer but more verbose.
- **Overridable vs Locked Views:** Making views publishable gives consumers full control over appearance but creates maintenance burden (they must re-override when the package updates). Non-publishable views are simpler but limit customization.

## Performance Considerations

- **Component Registration Cost:** Registering 20+ view namespaces and 50+ components adds minimal boot time (microseconds). The cost is in array building, not file I/O.
- **View Caching:** `php artisan view:cache` compiles all registered view files (including package views) into cached Blade files, improving rendering performance. Package views are cached alongside application views.
- **Anonymous Component Lookup:** Anonymous component resolution has a slight overhead (filesystem check for `name/index.blade.php` then `name.blade.php`). Class components resolve faster because the class-view mapping is explicit.

## Production Considerations

- **View Override Compatibility:** When consumers publish package views, those overrides persist across package updates. Package view changes must be backward-compatible (don't remove passed variables without deprecation).
- **Component Naming Conflicts:** If two packages register the same component namespace, one will silently override the other. Ensure unique namespace prefixes to prevent conflicts.
- **View Cache on Deployment:** Run `php artisan view:cache` in deployment to compile all Blade templates (including package views) for optimal rendering performance.
- **Anonymous Component Collisions:** If a package's anonymous component directory structure conflicts with another package's views (same file path under different registered namespaces), the wrong view may be rendered.

## Common Mistakes

- **View namespace mismatch:** Using `<x-package::name>` but registering a different namespace in `loadViewsFrom()`; components render empty or throw errors
- **Forgetting to register anonymous components:** Anonymous components only work if the view namespace is registered; without `loadViewsFrom()`, Blade can't find the component template
- **Registering same namespace twice:** Two packages using the same namespace prefix; the last registered namespace wins, breaking component resolution for the first package
- **Class component render() returns non-existent view:** The component class's `render()` returns a view path that doesn't exist; `ViewNotFoundException` is thrown at render time
- **Not publishing view overrides when consumers expect them:** If a package's components are meant to be styled, views should be publishable; locking views prevents theming

## Failure Modes

- **Namespace Collision:** Two packages register `loadViewsFrom($path, 'admin')`, causing components from the first package to render views from the second. Mitigate: always use the full package name as namespace.
- **Component Not Found:** `<x-package::button>` throws `InvalidArgumentException` because the class component registration failed silently or the anonymous component directory doesn't exist. Mitigate: test component registration in CI with a full render.
- **View Override Stale:** Consumer publishes views, then package adds new component variables that aren't in the overridden view. Mitigate: use backward-compatible view parameters (merge new defaults, don't remove existing).
- **Cached View Conflicts:` view:cache` compiles views from all registered namespaces; if a namespaced view path changes (package update, directory restructure), the cache becomes stale until rebuilt.

## Ecosystem Usage

- **Laravel UI / Breeze:** Packages that ship complete UI component sets with class-based and anonymous components under relevant namespaces
- **Filament Admin:** Complex component system with registered namespaces for form fields, tables, widgets, and layouts
- **Livewire Components:** Register via `Livewire::component()` rather than `Blade::component()`; Livewire components have their own registration mechanism separate from Blade components
- **Spatie Components:** Packages like `spatie/laravel-components` demonstrate both class-based and anonymous component registration patterns

## Related Knowledge Units

- blade-component-namespacing
- package-service-provider-patterns
- spatie-laravel-package-tools
- inertia-component-integration-packages

## Research Notes

- Blade component registration has been stable since Laravel 7 (2020) when anonymous components and component namespaces were introduced
- The `.blade.php` extension requirement and view name resolution rules are unchanged across Laravel versions
- Component prefix naming (x-prefix::) is the most common source of confusion for new package developers
- The trend toward Laravel component libraries (Filament, Flux, TallStackUI) has increased the importance of proper component registration and namespacing in packages
