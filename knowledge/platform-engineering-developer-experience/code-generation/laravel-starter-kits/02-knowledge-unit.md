# Knowledge Unit: Laravel Starter Kits

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/laravel-starter-kits
- **Maturity:** Mature
- **Related Technologies:** Laravel, Breeze, Jetstream, Livewire, Inertia, React, Vue, PHP

## Executive Summary

Laravel Starter Kits are official application scaffolding packages that provide pre-built authentication, profile management, and team management for new Laravel applications. The two primary starter kits are Laravel Breeze (minimal authentication scaffolding) and Laravel Jetstream (advanced authentication with teams, two-factor auth, and API tokens). Both kits are installable via Composer and offer multiple frontend stacks: Blade with Alpine.js, Livewire with Volt, and Inertia with React or Vue. All kits use Tailwind CSS for styling and Vite for asset bundling. The starter kits follow Laravel's "Convention over Configuration" philosophy—generated code uses best practices including form requests, policies, and service classes. The choice between Breeze and Jetstream depends on the application's requirements: Breeze for simple authentication needs; Jetstream for applications needing teams, 2FA, and API token management.

## Core Concepts

- **Breeze:** Minimal starter kit with login, registration, password reset, email verification, and password confirmation—auth-only, no teams or API tokens
- **Jetstream:** Feature-rich starter kit with all Breeze features plus teams, two-factor authentication, API token management (Sanctum), session management, and profile management
- **Stack Options:** Blade (server-rendered with Alpine.js interactivity), Livewire (backend-driven reactive components), React with Inertia, Vue with Inertia
- **Tailwind CSS:** All starter kits use Tailwind for consistent, utility-first styling with dark mode support
- **Vite Integration:** Pre-configured Vite for asset bundling with hot module replacement (HMR) in development
- **Inertia:** A glue layer that connects Laravel backends with React/Vue frontends, providing SPA-like experiences without building a separate API
- **Sanctum:** API token authentication used by Jetstream for token management and SPA authentication

## Mental Models

- **Kit as Operating System:** Like choosing an operating system (Windows vs macOS vs Linux), choosing a starter kit determines the ecosystem and conventions for the entire application
- **Kit as Decision Accelerator:** Starter kits codify the decisions that every Laravel project needs to make (auth, frontend, styling), so you can start building features immediately
- **Kit as Conventions Package:** Each kit packages a set of conventions (component organization, route structure, styling approach) that guide the application's architecture

## Internal Mechanics

1. **Installation via Installer:** `laravel new project --breeze` or `laravel new project --jet` triggers Composer installation and configuration
2. **Stub Publishing:** The starter kit publishes stub files (controllers, views, components, routes, tests) into the application's directory structure
3. **Configuration Publishing:** Configuration files for the starter kit (Jetstream config, Sanctum config, Fortify config) are published to `config/`
4. **Asset Setup:** Tailwind CSS, PostCSS, and Vite configuration files are created; `npm install && npm run build` compiles frontend assets
5. **Authentication Route Registration:** Auth routes (login, register, password reset, email verification) are registered via included route files or service providers
6. **Service Provider Registration:** Starter kit service providers (JetstreamServiceProvider, FortifyServiceProvider) are registered in `config/app.php` or via auto-discovery
7. **Database Migration:** Team tables (for Jetstream) and other starter kit tables are created via published migrations

## Patterns

- **Feature Discovery Pattern:** Start with Breeze for initial prototyping, then upgrade to Jetstream if teams/2FA become necessary; Breeze→Jetstream migration is documented
- **Stack Migration Pattern:** Start with Blade for rapid development, then migrate to Livewire or Inertia as interactivity needs grow; the Blade views serve as reference for the migration
- **Customization Boundary Pattern:** Keep starter kit-generated code in designated directories; extend rather than modify generated files to simplify future updates
- **Testing Foundation Pattern:** Use the starter kit's published tests as templates for application tests; follow the same patterns (HTTP tests, authentication setup, factories)
- **Configuration Override Pattern:** Override starter kit behavior through configuration (Jetstream::teams(), Fortify::authenticateUsing()) rather than modifying generated code

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Kit selection | Breeze vs Jetstream vs none | Breeze for simple auth; Jetstream for teams/2FA; none for API-only |
| Frontend stack | Blade vs Livewire vs React vs Vue | Match team's strongest skill; Blade for simplicity; Livewire for interactivity; React/Vue for SPA |
| CSS framework | Tailwind (default) vs Bootstrap vs custom | Stick with Tailwind (deep integration, purging, dark mode) |
| Authentication backend | Built-in controllers vs Fortify vs custom | Built-in controllers for Breeze; Fortify (used by Jetstream) for customization |
| Testing framework | Pest vs PHPUnit | Pest for Breeze; Jetstream supports both |

## Tradeoffs

- **Breeze vs Jetstream:** Breeze is simpler, generates less code, and is easier to understand but lacks teams, 2FA, and API tokens. Jetstream is more powerful and production-ready but generates significantly more code and has a steeper learning curve.
- **Blade vs Inertia:** Blade is simpler (no JavaScript framework) and faster to develop with but less capable for interactive UIs. Inertia provides SPA-class interactivity but requires frontend framework knowledge and adds build step complexity.
- **Livewire vs React/Vue:** Livewire keeps logic in PHP (no API endpoints, no JavaScript state management) but is less suited for highly interactive client-side experiences. React/Vue excel at complex frontends but require API endpoints and frontend testing.
- **Built-in vs Fortify Auth:** Breeze's built-in auth controllers are transparent and easily customized. Jetstream uses Fortify (headless auth backend) which provides more customization points but adds abstraction complexity.

## Performance Considerations

- **Generated Code Mass:** Breeze adds ~20 files to a fresh Laravel installation; Jetstream adds ~80+ files. Each file adds to project complexity and potential maintenance surface area.
- **NPM Dependencies:** Breeze adds ~300 npm packages (devDependencies); Jetstream adds ~400. This affects `npm install` time (30-60s) and CI pipeline duration.
- **Livewire Component Overhead:** Each Livewire component in Jetstream adds a round-trip request for interactivity. For apps with many interactive components, consider the cumulative request overhead.
- **Inertia Page Size:** Inertia serves all JavaScript for the SPA upfront. For large applications, implement code splitting to reduce initial bundle size.

## Production Considerations

- **Removing Starter Kit Code:** Starter kit-generated code is a starting point. As the application evolves, replace generated code with application-specific implementations. Don't treat starter kit code as immutable.
- **Upgrade Path Between Versions:** When upgrading Laravel, starter kit components may need updating. Follow the upgrade guide for Breeze/Jetstream to handle structural changes.
- **Custom Authentication Requirements:** Most production applications need custom authentication flows beyond starter kit defaults (SSO, social auth, MFA enforcement, custom registration flows). Plan extensions early.
- **Security Hardening:** Starter kits implement basic security (rate limiting is included in Jetstream) but production applications may need: account lockout policies, suspicious login detection, IP-based access controls.

## Common Mistakes

- **Staying on starter kit for too long:** Building the entire application within the starter kit's generated files; starter kits are starting points, not application frameworks
- **Not understanding generated code:** Using features without understanding how they work (team scoping, permission checks, authentication middleware); leads to bugs when extending features
- **Mixing stacks within the same project:** Adding Livewire components to a Blade+Breeze project without understanding the implications; creates maintenance complexity
- **Overwriting starter kit files with updates:** Running `breeze:install` or `jetstream:install` again after customizing generated files; backups or branch management are essential
- **Ignoring the frontend build step:** Developing with starter kits but not running `npm run build` for production; compiled assets are missing or stale

## Failure Modes

- **Starter Kit Version Mismatch:** Using a starter kit version that's incompatible with the installed Laravel version. Mitigate: check compatibility in the starter kit's documentation.
- **NPM Dependency Conflict:** Starter kit NPM dependencies conflict with custom NPM packages added to the project. Mitigate: manage dependencies carefully; use `npm ls` to identify conflicts.
- **Authentication Flow Customization Breakage:** Modifying authentication controllers to match custom requirements but breaking expected routes or redirect paths. Mitigate: test all auth flows after customization.
- **Team Data Leakage:** Jetstream team scoping not applied to all models; users can access data from other teams. Mitigate: enforce team scoping with middleware or global scopes.

## Ecosystem Usage

- **Laravel Bootcamp:** The official bootcamp uses Breeze as the starting point for each stack variation (Blade, Livewire, React/Inertia)
- **Laravel Forge:** Forge offers Breeze/Jetstream as options during new site creation, running the installation automatically
- **Laracasts:** Multiple Laracasts series build on Breeze/Jetstream as the project foundation
- **Laravel News:** Starter kit announcements and updates are covered on Laravel News with tutorials for each stack
- **Laravel Cloud:** New cloud projects default to Breeze for authentication scaffolding, with Jetstream available as an upgrade option

## Related Knowledge Units

- laravel-breeze
- laravel-jetstream
- laravel-installer
- stub-customization-laravel

## Research Notes

- The starter kit concept was introduced in Laravel 8.x with the deprecation of `laravel/ui` (the older auth scaffolding package)
- Breeze and Jetstream evolved from "scaffolding" to "starter kits" in Laravel 11+, reflecting their role as project foundations rather than just auth generators
- The Livewire stack was added to Breeze in Laravel 10.x, reflecting Livewire's growing adoption in the Laravel ecosystem
- The `php artisan install:` command pattern for starter kits was introduced in Laravel 11.x, replacing the previous Composer-based installation flow
