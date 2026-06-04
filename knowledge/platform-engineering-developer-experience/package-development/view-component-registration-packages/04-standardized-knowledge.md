# Experience Curation: View Component Registration in Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/view-component-registration-packages
- **Maturity:** Mature
- **Related Technologies:** Laravel Blade, Spatie Package Tools, Anonymous Components, Component Namespaces
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Registering Blade view components in Laravel packages involves: registering the view namespace (`loadViewsFrom()`), registering Blade component classes with a prefix (`Blade::component()` or `->hasViewComponent()` in Spatie tools), and optionally registering anonymous component directories. The package's components are rendered using a prefix namespace in the application (`<x-package-name::component-name />`). Proper component registration ensures that component classes are auto-discovered by the Blade compiler, views are located in the correct namespace, and component tags resolve to the correct PHP class. Spatie tools' `->hasViewComponent()` method encapsulates this registration into a single declarative call.

## Core Concepts
- **Blade Component Namespace:** A prefix (e.g., `package-name`) that groups the package's components; components are rendered as `<x-package-name::button />` in Blade templates
- **Anonymous Components:** Blade components defined by template files only (no PHP class); registered via `loadViewsFrom()`; rendered as `<x-package-name::alert />`
- **Class-Based Components:** PHP classes extending `Illuminate\View\Component` with a corresponding Blade template; registered via `Blade::component('class', 'namespace')`
- **View Namespace Registration:** `loadViewsFrom(__DIR__.'/../resources/views', 'package-name')` makes views loadable via `view('package-name::view-name')` and enables anonymous component resolution
- **Namespace as Component Prefix:** The view namespace becomes the Blade component prefix; `loadViewsFrom($path, 'prefix')` makes `<x-prefix::name />` resolve to `$path/name.blade.php`
- **Class vs Anonymous Components:** Class components have PHP logic (computed properties, methods, attributes); anonymous components are pure templates with passed data

## When To Use
- Packages that provide reusable UI elements (buttons, cards, modals, alerts, form inputs) for Blade views
- Packages that ship with Blade templates that consumers can use in their own views
- Design system packages that provide a cohesive set of styled components under a common prefix
- Packages that need to provide both logic (class-based) and structure (anonymous) components

## When NOT To Use
- API-only packages that don't render HTML (service packages, API clients, backend utilities)
- Packages where views are consumed programmatically rather than rendered in Blade (e.g., email rendering)
- Packages that use Inertia or Livewire exclusively for frontend rendering; those frameworks have their own component registration
- Simple utility packages that don't need visual output

## Best Practices
- **WHY:** Use the package name (without vendor prefix) as the component namespace for consistency with view namespace conventions; `<x-package-name::button />` is predictable and discoverable
- **WHY:** Register class-based components for reusable UI with PHP logic (computed properties, methods, attributes); use anonymous components for simple structural templates without behavior
- **WHY:** Use Spatie tools' `->hasViewComponent('prefix', Component::class)` for declarative component registration instead of manual `Blade::component()` calls
- **WHY:** Always register the view namespace with `loadViewsFrom()` even if only using class-based components; anonymous components and view rendering depend on proper namespace registration
- **WHY:** Make views publishable for themeable/stylable components; keep views in vendor for functional components whose structure shouldn't change

## Architecture Guidelines
- **Prefix Convention Pattern:** Use the package name (without vendor prefix) as the component namespace (e.g., `settings` for `my-org/settings`); consistent with view namespace conventions
- **Class-Based Default Pattern:** Register the most common components as class-based (enables logic encapsulation); use anonymous components for purely structural or single-use components
- **Component Library Pattern:** Package provides a set of related components (button, card, modal, alert, form inputs) all under the same namespace prefix for a cohesive design system
- **Override Pattern:** Allow consumers to override package views by publishing (`$this->publishes([$path => resource_path('views/vendor/package-name')])`); component classes remain in vendor and can't be overridden
- **Spatie Tools Pattern:** Use `->hasViews()` to register the view namespace and `->hasViewComponent('prefix', Component::class)` for each component class
- **Unique Namespace Prefix:** Ensure the namespace prefix is unique to prevent collisions; two packages using `admin` as a namespace will conflict
- **View Cache:** Run `php artisan view:cache` in deployment to compile all Blade templates (including package views) for optimal rendering performance

## Performance
- Registering 20+ view namespaces and 50+ components adds minimal boot time (microseconds); the cost is in array building, not file I/O
- `php artisan view:cache` compiles all registered view files (including package views) into cached Blade files, improving rendering performance
- Anonymous component resolution has a slight overhead (filesystem check for `name/index.blade.php` then `name.blade.php`); class components resolve faster because the class-view mapping is explicit
- View publishing adds no runtime performance overhead; published views are loaded from the application's resources directory instead of vendor

## Security
- Component views can contain user-rendered data; ensure proper escaping with `{{ }}` syntax (not `{!! !!}`) for user-provided content
- Class components should validate and sanitize constructor parameters (attributes passed to `<x-package::component attribute="value">` )
- Published views are in the application's resource directory and can be modified by the consumer; document security expectations for overridden views
- Anonymous components (Blade files only) have no PHP logic layer; all data escaping must happen in the parent view or passed data
- Never allow dynamic component namespace resolution based on user input; this can lead to view path traversal vulnerabilities

## Common Mistakes

### View namespace mismatch
- **Description:** Using `<x-package::name>` in Blade templates but registering a different namespace in `loadViewsFrom()`
- **Consequence:** Components render empty or throw "View not found" errors
- **Better Approach:** Ensure the namespace used in `loadViewsFrom()` matches exactly what's used in Blade component tags (e.g., `'package-name'` matches `<x-package-name::>`)

### Forgetting to register anonymous components
- **Description:** Not calling `loadViewsFrom()` for the package views directory
- **Consequence:** Anonymous components resolve to nothing; Blade can't find the component template at render time
- **Better Approach:** Always register the view namespace; anonymous components depend entirely on this registration

### Registering same namespace twice
- **Description:** Two packages using the same namespace prefix (e.g., both using `admin`)
- **Consequence:** The last registered namespace wins; components from the first package incorrectly render views from the second
- **Better Approach:** Always use the full package name as the namespace; verify uniqueness with a package registry or documentation

### Class component render() returns non-existent view
- **Description:** The component class's `render()` returns a view path that doesn't exist in the registered namespace
- **Consequence:** `ViewNotFoundException` is thrown at render time; component fails to display
- **Better Approach:** Test that the view path returned by `render()` exists; use named view references rather than string paths

### Not publishing view overrides when consumers expect them
- **Description:** Package components that are meant to be styled are not made publishable
- **Consequence:** Consumers cannot customize component appearance; must fork the package or override globally
- **Better Approach:** Make views publishable for themeable/stylable components; document the publishing command

## Anti-Patterns
- **Global component registration:** Registering components without a namespace prefix (`<x-button />` instead of `<x-package::button />`); risks naming collisions with other packages or the application
- **No view namespace registration for class components:** Registering class components but not `loadViewsFrom()`; class components need the view namespace for their rendered views
- **Overriding component classes:** Attempting to override class-based components by modifying vendor files; class components can't be overridden, only views can be published
- **Deep directory structure for anonymous components:** Using deeply nested directories for anonymous component templates; Blade's resolution algorithm checks limited paths
- **One namespace for everything:** Using the same namespace for components, views, and translations without considering conflicts; each resource type should use appropriate conventions

## Examples
- **Laravel UI / Breeze:** Packages that ship complete UI component sets with class-based and anonymous components under relevant namespaces
- **Filament Admin:** Complex component system with registered namespaces for form fields, tables, widgets, and layouts; demonstrates proper namespace isolation
- **Spatie/laravel-components:** Demonstrates both class-based and anonymous component registration patterns with Spatie Package Tools
- **Flux UI:** Component library using anonymous components with published views for theming

## Related Topics
- blade-component-namespacing (how Blade resolves component namespaces to view paths)
- package-service-provider-patterns (component registration happens in the service provider)
- spatie-laravel-package-tools (provides `hasViewComponent()` for declarative registration)
- inertia-component-integration-packages (Inertia components have separate registration from Blade)
- laravel-view-composers (view composers and creators for package views)

## AI Agent Notes
- Component prefix naming (`x-prefix::`) is the most common source of confusion for new package developers; always explicitly mention the namespace convention
- When a user reports "component not found," first check view namespace registration and namespace string consistency
- Anonymous components are simpler but offer no PHP logic layer; recommend class-based for any component with behavior
- Spatie tools' `->hasViewComponent()` handles namespace registration and component class registration in one call; prefer this over manual `Blade::component()`
- View publishing is only for view files; component classes cannot be overridden—this is a common misconception

## Verification
- [ ] `loadViewsFrom()` is called in the service provider with the correct namespace prefix
- [ ] Class-based components use `Blade::component()` or Spatie's `->hasViewComponent()` for registration
- [ ] Component namespace prefix is unique and doesn't conflict with other packages
- [ ] Anonymous component directories are accessible under the registered view namespace
- [ ] Class component `render()` methods return valid view paths within the registered namespace
- [ ] User-provided data in component views is properly escaped with `{{ }}` syntax
- [ ] Views are made publishable for themeable/stylable components
- [ ] View cache is rebuilt in deployment after package updates
- [ ] Component tests verify that tags render correctly and classes resolve
- [ ] `php artisan view:cache` succeeds without namespace conflicts
