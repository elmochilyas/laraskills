# Knowledge Unit: Inertia Component Integration in Packages

## Metadata
- **Subdomain:** Package Development & Shared Libraries
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** package-development-shared-libraries/inertia-component-integration-packages
- **Maturity:** Maturing
- **Related Technologies:** Inertia.js, Laravel, Vue.js, React, Spatie Package Tools, NPM packages

## Executive Summary

Laravel packages that provide frontend components via Inertia.js must handle server-side component registration (through routes, controllers, and data providers) and client-side component publishing (making Vue/React components available to the consuming application). The pattern typically involves: publishing Inertia pages to the consumer's `resources/js/` directory, registering routes that return Inertia responses, and providing client-side components that can be imported and used. Spatie Package Tools supports Inertia integration through `->hasInertiaComponents()` which handles the server-side view namespace registration and publishing of client-side components.

## Core Concepts

- **Inertia Pages:** Blade-like page components rendered by the client side; the package registers Inertia page paths that map to server-rendered routes
- **Client Component Publishing:** Package ships pre-built Vue/React components that must be published to the consumer's application for import
- **Server-Side Data Provider:** Controllers or actions that prepare data for the Inertia page (via `Inertia::render()`)
- **Component Bundling:** Whether the package ships compiled components (in `vendor/`) or source components that the consumer's build pipeline processes

## Mental Models

- **Inertia Page as a View:** Think of an Inertia page component as a Blade view's modern equivalent—it renders HTML but with client-side reactivity and state management
- **Package Component as Library Code:** The package's Inertia components are like `.js` library files that the consumer imports and uses in their own build pipeline
- **Server + Client as Two Registration Points:** Inertia packages require registration on both sides: Laravel service provider (routes, data) and the consumer's `app.js` (component imports)

## Internal Mechanics

1. **Inertia Component Registration:** Spatie's `->hasInertiaComponents()` registers the package's `resources/js/` directory as an Inertia page namespace, enabling `Inertia::render('PackageName::PageName')` from the package controllers.
2. **Client-Side Publishing:** The `vendor:publish` command with appropriate tags copies the package's Vue/React component files to the consumer's `resources/js/vendor/package-name/` directory.
3. **Consumer Import:** The consumer imports and registers the published components in their `app.js`: `import { PackageComponent } from './vendor/package-name'; Vue.component('package-component', PackageComponent);`
4. **Component Data Flow:** Consumer requests route → Package controller runs → Controller returns `Inertia::render('PackageName::Page', $data)` → Inertia resolves the page component from the published client code → Client renders the page with server-provided data.

## Patterns

- **Pre-Built vs Source Components:** Ship both pre-built (compiled) components for immediate use and source `.vue`/`.jsx` files for consumers who want to customize the build configuration.
- **Inertia Pages in Package Pattern:** Use `Inertia::render('PackageName::PageName')` syntax where `PackageName` matches the view namespace registered via `hasInertiaComponents()`.
- **Hybrid Inertia + Blade Pattern:** For packages that support both Inertia and Blade frontends, check the application's frontend stack and conditionally register the appropriate templates.
- **Component Composition Pattern:** Provide base Inertia components (Table, Form, Modal) that consumers can compose into their own pages, rather than providing complete pages that consumers cannot customize.
- **NPM Package Distribution:** For complex Inertia component libraries, distribute client components as an npm package in addition to publishing via Laravel package; this gives consumers flexibility in how they import components.

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Component distribution | Laravel publish vs npm package | Both: Laravel publish for simple setups; npm for build-pipeline heavy projects |
| Component format | Compiled JS vs source Vue/JSX | Source for consumer control; compiled for zero-config setup |
| Page vs Component API | Provide full pages vs individual components | Provide both: pages for out-of-box functionality, components for customization |
| Styling strategy | Tailwind classes vs CSS files vs CSS-in-JS | Tailwind utility classes (consistent with Laravel ecosystem) |

## Tradeoffs

- **Published Components vs npm Package:** Publishing from vendor is simple (no npm needed) but updates require `vendor:publish --force` which overwrites customizations. npm package gives version management and tree-shaking but adds npm dependency.
- **Source vs Compiled Components:** Source components require the consumer to have the correct build setup (Vite config, presets) but allow customization. Compiled components work immediately but can't be customized.
- **Tight vs Loose Coupling to Inertia:** Deep Inertia integration provides a seamless experience for Inertia users but excludes applications using Blade-only or Livewire frontends. Support multiple frontend stacks if the target audience is mixed.
- **Single Monolithic Package vs Separate Frontend Package:** One package handling both server and client concerns is simpler to distribute but versioning is coupled. Separate packages allow independent versioning but increase maintenance overhead.

## Performance Considerations

- **Client Bundle Size:** The package's Inertia components add to the consumer's JavaScript bundle. Use tree-shaking, lazy loading, and code splitting to minimize impact.
- **Server Data Transfer:** Inertia components receive data from the server on each request; optimize the data payload size to match what the components actually render.
- **Component Compilation:** If shipping source components, the consumer's Vite build compiles them; this adds to build time but has no runtime performance impact.
- **Asset Publishing Size:** Published asset files (compiled JS, source files) should be minimal; exclude development files, tests, and documentation from the published set.

## Production Considerations

- **Version Compatibility:** The package's Inertia components must match the consumer's Inertia version (v2 vs v1). Declare peer dependencies and test across supported versions.
- **Build Pipeline Requirements:** Document the consumer's required build configuration: Vite plugin, alias configuration, and any Babel/TypeScript presets needed to compile package source components.
- **Component Security:** Inertia components receive server data directly; ensure the package doesn't expose sensitive data through components that are published and potentially inspected by consumers.
- **TypeScript Support:** If shipping source `.vue`/`.tsx` components, include TypeScript type definitions; consumers using TypeScript need type-safe component imports.

## Common Mistakes

- **Skipping client-side registration documentation:** Consumers install the package but don't know they need to import Inertia components in app.js; always document both server and client setup steps
- **Hardcoded asset paths in Inertia components:** Using relative paths to images, fonts, or other package assets that break when components are published to a different directory structure
- **Not testing with both Vue and React:** Packages supporting both should have automated tests for each frontend framework; Inertia rendering behavior differs between Vue and React
- **Breaking changes in component APIs:** Changing props or slot names in published components between PATCH versions; follow SemVer for client-side component API changes
- **Forgetting to exclude unnecessary files from publishing:** Publishing node_modules, development mixins, or test fixtures as part of package assets; always configure .gitattributes export-ignore

## Failure Modes

- **Component Import Path Broken:** Package update changes the expected import path for client components. Mitigate: maintain consistent import paths across versions; document any paths changes in changelog.
- **Inertia Version Mismatch:** Package compiled for Inertia v2 but consumer uses Inertia v1. Mitigate: peer dependency declaration in composer.json; npm peer dependency for client packages.
- **Published Component Overwrite:** `vendor:publish --force` overwrites consumer's customizations to published components. Mitigate: use a merge strategy (publish to a separate directory and import) rather than overwrite approach.
- **Build Error on Source Components:** Consumer's Vite configuration doesn't support package's build requirements (JSX, TypeScript, Vue plugins). Mitigate: document build requirements clearly; provide pre-built alternatives.

## Ecosystem Usage

- **Laravel Jetstream:** The official Laravel starter kit uses Inertia for its Livewire and Team management pages; demonstrates server-side + client-side Inertia package architecture
- **Laravel Telescope:** Telescope's UI is moving toward Inertia; demonstrates profiling data visualization through Inertia pages
- **Laravel Pulse:** Uses Inertia for real-time dashboard rendering with server-sent events; shows Inertia component pattern for data-heavy applications
- **Filament Inertia:** Third-party package bridging Filament components with Inertia; demonstrates complex Inertia component composition

## Related Knowledge Units

- view-component-registration-packages
- blade-component-namespacing
- laravel-pulse
- spatie-laravel-package-tools

## Research Notes

- Inertia component support in packages is relatively new (2023-2025); Spatie Package Tools added `hasInertiaComponents()` in 2024
- The majority of Inertia packages still require manual configuration; standardized Inertia package patterns are still emerging
- The decision between shipping compiled vs source components is the most debated aspect of Inertia package development
- As Inertia v2 adoption grows (2025+), package developers are increasingly publishing Inertia-first packages rather than Blade-first with Inertia support as an afterthought
