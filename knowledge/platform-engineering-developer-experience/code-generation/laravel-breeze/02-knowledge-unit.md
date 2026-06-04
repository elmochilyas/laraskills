# Knowledge Unit: Laravel Breeze

## Metadata
- **Subdomain:** Code Generation & Scaffolding
- **Domain:** Platform Engineering & Developer Experience
- **KU ID:** code-generation-scaffolding/laravel-breeze
- **Maturity:** Mature
- **Related Technologies:** Laravel, Breeze, Blade, Alpine.js, Livewire, React, Vue, Tailwind CSS, Vite

## Executive Summary

Laravel Breeze is a minimal, lightweight implementation of Laravel's authentication features, providing a starting point for new Laravel applications with authentication scaffolding. It includes login, registration, password reset, email verification, and password confirmation views and controllers. Breeze offers multiple stack options: Blade with Alpine.js (default), Livewire (with Volt or classic), React with Inertia, and Vue with Inertia. All stacks use Tailwind CSS for styling and Vite for asset bundling. Breeze is designed as the simplest starting point—it provides authentication but nothing more, making it suitable for applications that need auth without the overhead of Team management, API support, or two-factor authentication that Jetstream includes. Breeze 2.x+ (Laravel 11+) uses starter kits installed via `php artisan install:breeze` instead of the earlier `composer require` approach.

## Core Concepts

- **Authentication Scaffolding:** Complete routes, controllers, requests, and views for login, registration, password reset, email verification, and password confirmation
- **Stack Choice:** Multiple frontend stack options: Blade (server-rendered with Alpine.js), Livewire (with Volt functional API or class API), React (Inertia), Vue (Inertia)
- **Tailwind CSS:** Pre-configured Tailwind CSS for styling; generated views use Tailwind utility classes
- **Vite Integration:** Pre-configured Vite configuration for asset bundling with hot module replacement (HMR) during development
- **Dark Mode:** Optional dark mode support (via `--dark` flag in Breeze 2.x) with Tailwind's dark mode utilities
- **Pest/Eloquent Testing:** Pre-configured authentication tests using Pest (default) or PHPUnit with model factories

## Mental Models

- **Breeze as Auth Foundation:** Breeze provides the authentication scaffolding (walls, doors, locks) but no interior furnishing—you build the application on top of a working auth system
- **Breeze as Boilerplate Reducer:** Where you'd spend 2-3 hours writing authentication views, routes, and controllers, Breeze generates them in seconds
- **Breeze as Reference Implementation:** The generated code follows Laravel best practices—form requests for validation, resource controllers, proper route naming—serving as a reference for the rest of the application

## Internal Mechanics

1. **Installation Flow:** `composer require laravel/breeze` → `php artisan breeze:install` → publish stubs, modify config, install NPM dependencies, compile assets
2. **Stub Publishing:** Breeze publishes authentication views, controllers, and routes from package stubs to the application's directories, overwriting defaults
3. **Stack-Specific Generation:** Based on the selected stack (`blade`, `livewire`, `react`, `vue`), Breeze generates different sets of files (Inertia pages, Livewire components, or Blade views)
4. **Middleware Setup:** `Authenticate` middleware is configured, `RedirectIfAuthenticated` is updated for the login flow, and guest/auth route groups are set up
5. **Asset Pipeline:** `npm install && npm run build` is triggered (or instructions shown) to compile Tailwind CSS and Vite assets for the chosen frontend stack
6. **Testing Scaffold:** Authentication tests are published: registration test, login test, password reset test, email verification test, password confirmation test

## Patterns

- **Minimal Start Pattern:** Use Breeze when you need authentication but want to avoid Jetstream's Teams and API features; start minimal and add features as needed
- **Stack Selection Pattern:** Choose stack based on team expertise: Livewire for backend-heavy teams; React/Vue for frontend-focused teams; Blade for simple, server-rendered apps
- **Dark Mode Pattern:** Use `--dark` during installation to get dark mode support; all views include Tailwind dark: variants
- **Esbuild/Vite Pattern:** Breeze sets up Vite with PostCSS and Tailwind; the `package.json` includes `dev` and `build` scripts for asset compilation
- **Testing Pattern:** Breeze publishes authentication tests that serve as templates for application tests; extend the same patterns (HTTP tests with actingAs)

## Architectural Decisions

| Decision | Options | Recommendation |
|---|---|---|
| Frontend stack | Blade vs Livewire vs React vs Vue | Blade for simple apps; Livewire for interactive UIs without SPA; React/Vue for SPA/API-driven apps |
| CSS framework | Tailwind CSS (default) vs Bootstrap vs custom | Tailwind (default, well-integrated with Vite/PostCSS) |
| Inertia version | Inertia v2 vs v1 | Inertia v2 (latest, included with Breeze 2.x) |
| Auth controller location | App\Http\Controllers\Auth vs App\Livewire | Controllers for Blade/Inertia; Livewire components for Livewire stack |
| Testing framework | Pest vs PHPUnit | Pest (default); PHPUnit available if already configured |

## Tradeoffs

- **Breeze vs Jetstream:** Breeze is intentionally minimal—auth only, no teams, no API tokens, no two-factor auth. Jetstream includes these features. Choose Breeze for simple apps; Jetstream for apps needing teams and advanced features.
- **Blade vs Inertia:** Blade is simpler (server-rendered, no SPA overhead) but less dynamic for interactive UIs. Inertia provides SPA-like experience with shared state management but adds complexity. Choose based on UI interactivity requirements.
- **Livewire vs React/Vue:** Livewire keeps logic in PHP (no JavaScript frameworks to learn) but has limitations for highly dynamic UIs. React/Vue are more powerful for complex frontends but require JavaScript expertise.

## Performance Considerations

- **Compiled Asset Size:** Breeze with Tailwind generates ~2-4MB of CSS (before purge). Tailwind's purge (via PostCSS) reduces this to ~10-20KB in production. Always run `npm run build` for production.
- **Alpine.js vs Livewire vs React:** Alpine.js adds ~10KB (minified); Livewire adds ~50KB; React adds ~130KB. Each additional stack dependency affects initial page load time.
- **Inertia SPA Overhead:** Inertia stacks load all page components upfront on first request. For apps with many routes, consider code splitting or lazy loading for non-critical pages.
- **HMR Performance:** Vite's HMR in development is fast (sub-second updates) but consumes ~200-400MB RAM for the dev server.

## Production Considerations

- **Auth Controller Hardening:** Breeze's generated controllers are a starting point. In production, add: rate limiting on login/register, account lockout after failed attempts, CSRF protection (already included), and HTTPS enforcement.
- **Email Verification:** Breeze includes email verification scaffolding. Enable `MustVerifyEmail` on the User model for production apps requiring verified accounts. Configure email (Mailpit for dev, SES/Sendmail for production).
- **Password Policies:** Breeze uses default password validation (minimum 8 characters). For production, extend with: password history, complexity requirements, or 2FA (which Jetstream provides).
- **Session Configuration:** Configure `config/session.php` for production: secure cookies (HTTPS), SameSite cookie policy, and appropriate session driver (Redis, Database).
- **Asset Caching:** In production, version compiled assets (Vite's `manifest.json` handles this). Use CDN for serving compiled assets at scale.

## Common Mistakes

- **Installing Breeze on an existing app with partial auth:** Breeze overwrites user-related controllers, views, and routes; install on fresh apps or carefully manage conflicts
- **Not running npm install/build after installation:** Breeze generates views that depend on Tailwind CSS; skipping asset compilation results in unstyled pages
- **Selecting the wrong stack initially:** Changing the frontend stack after building on top of Breeze is difficult; choose carefully based on team skills and project requirements
- **Over-customizing Breeze files directly:** Modifying Breeze's generated files and then running `breeze:install` again overwrites changes; customize derived files, not generated ones
- **Not handling the --dark flag:** Installing without `--dark` and later wanting dark mode requires manual addition of dark mode variants to all views

## Failure Modes

- **NPM Dependency Conflicts:** Version conflicts between Breeze's required Node packages and existing project dependencies. Mitigate: install Breeze on a fresh Laravel application or manage versions carefully.
- **Vite Configuration Conflicts:** Existing Vite configuration conflicts with Breeze's published vite.config.js. Mitigate: back up existing config before installation.
- **Auth Controller Conflicts:** Existing custom auth controllers conflict with Breeze's published controllers. Mitigate: use `--force` with caution or manually merge changes.
- **Tailwind Configuration Overwrites:** Breeze publishes `tailwind.config.js` which overwrites custom Tailwind configuration. Mitigate: back up existing config or reapply customizations after installation.

## Ecosystem Usage

- **Laravel Docs:** Breeze is the recommended starting point for all new Laravel applications in the official documentation
- **Laravel Bootcamp:** The Laravel Bootcamp uses Breeze as the starting point for building the Chirper application (available in Blade, Livewire, and React/Inertia stacks)
- **Laravel Forge:** Forge's new project creation offers Breeze as an option, automatically running the installation during provisioning
- **Laravel Shift:** Shift's Laravel upgrades include Breeze integration to update authentication scaffolding when upgrading between Laravel versions
- **Laravel Cloud (Launch):** New Laravel Cloud projects default to Breeze for authentication scaffolding

## Related Knowledge Units

- laravel-jetstream
- laravel-starter-kits
- stub-customization-laravel
- custom-artisan-make-commands

## Research Notes

- Breeze was introduced in Laravel 8.x alongside Jetstream, replacing the earlier `ui` package (auth scaffolding) that was deprecated
- Breeze 2.x (Laravel 11+) changed from `composer require laravel/breeze` + `php artisan breeze:install` to the new `php artisan install:laravel/breeze` approach
- The Livewire stack with Breeze uses Livewire 3.x and Volt (functional Livewire components) in the latest version
- Inertia 2.x added form helper improvements that are utilized in Breeze's React/Vue stacks, including form validation error handling
