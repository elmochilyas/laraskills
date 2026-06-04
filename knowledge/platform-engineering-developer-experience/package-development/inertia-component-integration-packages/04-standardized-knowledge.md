# Experience Curation: Inertia Component Integration in Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/inertia-component-integration-packages
- **Maturity:** Maturing
- **Related Technologies:** Inertia.js, Laravel, Vue.js, React, Spatie Package Tools, NPM packages
- **Difficulty:** Foundation
- **Decomposition:** Atomic

## Overview
Laravel packages that provide frontend components via Inertia.js must handle server-side component registration (through routes, controllers, and data providers) and client-side component publishing (making Vue/React components available to the consuming application). The pattern typically involves: publishing Inertia pages to the consumer's `resources/js/` directory, registering routes that return Inertia responses, and providing client-side components that can be imported and used. Spatie Package Tools supports Inertia integration through `->hasInertiaComponents()` which handles the server-side view namespace registration and publishing of client-side components.

## Core Concepts
- **Inertia Pages:** Blade-like page components rendered by the client side; the package registers Inertia page paths that map to server-rendered routes
- **Client Component Publishing:** Package ships pre-built Vue/React components that must be published to the consumer's application for import
- **Server-Side Data Provider:** Controllers or actions that prepare data for the Inertia page (via `Inertia::render()`)
- **Component Bundling:** Whether the package ships compiled components (in `vendor/`) or source components that the consumer's build pipeline processes
- **Inertia Page as a View:** An Inertia page component is a Blade view's modern equivalent—it renders HTML but with client-side reactivity and state management
- **Server + Client as Two Registration Points:** Inertia packages require registration on both sides: Laravel service provider (routes, data) and the consumer's `app.js` (component imports)

## When To Use
- Packages that provide complete UI pages rendered through Inertia (dashboards, settings panels, admin interfaces)
- Packages that offer reusable Inertia components (Tables, Forms, Modals) that consumers compose into their own pages
- Packages targeting modern Laravel applications using Inertia as their frontend stack
- Packages that need to provide both server-side logic and client-side interactive UI

## When NOT To Use
- Blade-only frontend packages (use Blade component registration instead)
- API-only packages that don't render UI
- Packages targeting applications using Livewire or other non-Inertia frontend stacks
- Simple packages where a single Blade view with Alpine.js would suffice

## Best Practices
- **WHY:** Ship both pre-built (compiled) components for immediate use and source `.vue`/`.jsx` files for consumers who customize the build; this accommodates both zero-config and advanced use cases
- **WHY:** Document both server and client setup steps clearly; consumers often miss the client-side import step and wonder why components don't render
- **WHY:** Use `Inertia::render('PackageName::PageName')` syntax where `PackageName` matches the view namespace registered via `hasInertiaComponents()` or `loadViewsFrom()`
- **WHY:** Provide base Inertia components (Table, Form, Modal) that consumers can compose into their own pages, rather than providing complete pages that consumers cannot customize
- **WHY:** For complex Inertia component libraries, distribute client components as an npm package in addition to publishing via Laravel package; this gives consumers flexibility in how they import components

## Architecture Guidelines
- **Pre-Built vs Source Components:** Ship both compiled and source components; pre-built for immediate use, source for consumers who customize the build pipeline
- **Inertia Pages in Package Pattern:** Use `Inertia::render('PackageName::PageName')` where `PackageName` matches the registered view namespace
- **Hybrid Inertia + Blade Pattern:** For packages supporting both frontends, check the application's frontend stack and conditionally register the appropriate templates
- **Component Composition Pattern:** Provide base components (Table, Form, Modal) for composition rather than complete locked-in pages
- **NPM Package Distribution:** For complex libraries, distribute client components as an npm package in addition to Laravel package publishing
- **Server-Side Registration:** Register routes, controllers, and data providers in the Laravel service provider
- **Client-Side Publishing:** Publish Vue/React components to `resources/js/vendor/package-name/` for consumer import

## Performance
- The package's Inertia components add to the consumer's JavaScript bundle; use tree-shaking, lazy loading, and code splitting to minimize impact
- Inertia components receive data from the server on each request; optimize the data payload size to match what the components actually render
- If shipping source components, the consumer's Vite build compiles them; this adds to build time but has no runtime performance impact
- Published asset files (compiled JS, source files) should be minimal; exclude development files, tests, and documentation
- Version compatibility with Inertia (v2 vs v1) must be declared and tested

## Security
- Inertia components receive server data directly; ensure the package doesn't expose sensitive data through components that are published and potentially inspected by consumers
- Server-side data providers should validate and sanitize data before passing to Inertia components
- Component props should be validated on the server side before being passed to Inertia responses
- Published client components can be modified by consumers; don't rely on client-side code for security enforcement
- Follow Inertia's best practices for server-side authorization checks before rendering components

## Common Mistakes

### Skipping client-side registration documentation
- **Description:** Package documents only the Laravel installation but not the client-side component import step
- **Consequence:** Consumers install the package but components don't render; missing import in app.js
- **Better Approach:** Document both server and client setup steps; provide copy-paste import code for app.js

### Hardcoded asset paths in Inertia components
- **Description:** Using relative paths to images, fonts, or other package assets in Vue/React components
- **Consequence:** Paths break when components are published to a different directory structure
- **Better Approach:** Use dynamic paths or configuration for asset references; document how consumers should configure asset paths

### Not testing with both Vue and React
- **Description:** Package supports both Vue and React but only tests one framework
- **Consequence:** Subtle rendering differences between Vue and React cause issues in untested framework
- **Better Approach:** Run automated tests for each supported frontend framework; Inertia rendering behavior differs between Vue and React

### Breaking changes in component APIs
- **Description:** Changing props or slot names in published components between PATCH versions
- **Consequence:** Consumers' code breaks on package update; unexpected component behavior
- **Better Approach:** Follow SemVer for client-side component API changes; deprecate before removing props

### Forgetting to exclude unnecessary files from publishing
- **Description:** Publishing node_modules, development mixins, or test fixtures as part of package assets
- **Consequence:** Large, unnecessary files increase package size and may include development-only code
- **Better Approach:** Use targeted publish paths and `.gitattributes` export-ignore rules

## Anti-Patterns
- **Inertia-only without Blade fallback:** Building exclusively for Inertia when the package could also support Blade; limits adoption to Inertia-using projects only
- **Locked-in full pages:** Providing complete, non-customizable Inertia pages that consumers cannot modify or compose into their own layouts
- **No pre-built option:** Requiring a build pipeline even for basic usage; zero-config should work out of the box
- **Coupled server-client versioning:** Versioning both server and client code together when they may need different release cadences; consider separate packages for complex setups
- **Ignoring npm ecosystem:** Relying solely on Laravel `vendor:publish` for client components when npm would provide better dependency management and tree-shaking

## Examples
- **Laravel Jetstream:** Uses Inertia for authentication scaffolding and team management; demonstrates server-side + client-side Inertia package architecture
- **Laravel Pulse:** Uses Inertia for real-time dashboard rendering with server-sent events; shows Inertia component pattern for data-heavy applications
- **Laravel Telescope:** UI moving toward Inertia; demonstrates profiling data visualization through Inertia pages
- **Filament Inertia:** Third-party package bridging Filament components with Inertia; demonstrates complex Inertia component composition

## Related Topics
- view-component-registration-packages (Inertia components vs Blade component registration)
- blade-component-namespacing (namespace conventions for Inertia vs Blade components)
- package-asset-publishing (Inertia components are published as frontend assets)
- spatie-laravel-package-tools (provides `hasInertiaComponents()` for registration)
- laravel-pulse (example of Inertia-heavy package architecture)

## AI Agent Notes
- Inertia component support in packages is relatively new (2023-2025); standardized patterns are still emerging
- The decision between shipping compiled vs source components is the most debated aspect of Inertia package development
- Always document both server and client setup steps; the client-side import is the most commonly missed step
- For organizations, consider whether Inertia-first packages exclude Blade-only projects; support both stacks when possible
- As Inertia v2 adoption grows, package developers are increasingly publishing Inertia-first packages rather than Blade-first

## Verification
- [ ] Server-side registration (routes, controllers, data providers) is complete in the service provider
- [ ] Client-side components are publishable and include import documentation
- [ ] Pre-built (compiled) components are available for zero-config setup
- [ ] Source components (`.vue`/`.jsx`) are available for consumers who customize the build
- [ ] Component props and API follow SemVer for client-side changes
- [ ] Both Vue and React are tested if both are supported
- [ ] Asset paths in components are not hardcoded in a way that breaks after publishing
- [ ] Unnecessary files (node_modules, tests) are excluded from publishing
- [ ] Inertia version compatibility (v2 vs v1) is declared and tested
- [ ] Server-side data providers validate and sanitize data before passing to components
