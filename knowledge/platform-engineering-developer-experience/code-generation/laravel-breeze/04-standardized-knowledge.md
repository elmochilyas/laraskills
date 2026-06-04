# 04-Standardized Knowledge: Laravel Breeze

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-breeze |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-jetstream, laravel-starter-kits, stub-customization-laravel |
| **Framework/Language** | Laravel, Breeze, Blade, Alpine.js, Livewire, React, Vue, Tailwind CSS, Vite |

## Overview

Laravel Breeze is a minimal authentication scaffolding for Laravel applications, providing login, registration, password reset, email verification, and password confirmation. It offers multiple frontend stacks: Blade with Alpine.js (default), Livewire (Volt or classic), React with Inertia, and Vue with Inertia. All stacks use Tailwind CSS and Vite. Breeze is intentionally minimal — auth only, no teams, no API tokens, no two-factor authentication.

## Core Concepts

- **Authentication Scaffolding**: routes, controllers, requests, views for auth features
- **Stack Choice**: Blade + Alpine, Livewire + Volt, React + Inertia, Vue + Inertia
- **Tailwind CSS**: pre-configured with utility class-based styling
- **Vite Integration**: HMR during development, manifest.json for production
- **Dark Mode**: optional via `--dark` flag with Tailwind dark: variants
- **Testing**: pre-configured auth tests using Pest (default) or PHPUnit

## When to Use

- New Laravel applications needing authentication (most web apps)
- Projects where Jetstream's teams/API/2FA features are unnecessary overhead
- Teams wanting a starting point that follows Laravel best practices
- Applications where you want to build custom features on a minimal auth foundation

## When NOT to Use

- Applications needing teams/workspaces out of the box (use Jetstream)
- Applications needing API token management (use Jetstream or Laravel Passport/Sanctum)
- Applications needing two-factor authentication (use Jetstream)
- Installing on an existing app with custom auth (Breeze overwrites auth files)

## Best Practices (WHY)

- **Choose stack based on team skills**: Blade for backend teams; Livewire for interactive UIs; React/Vue for SPA
- **Use `--dark` during install**: adding dark mode later requires manual Tailwind variant additions to all views
- **Run `npm install && npm run build`**: Breeze views depend on Tailwind CSS — skipping leaves pages unstyled
- **Enable `MustVerifyEmail` on User model**: for production apps requiring verified accounts
- **Add rate limiting**: Breeze controllers need rate limiting on login/register for production hardening

## Architecture Guidelines

- Install Breeze on fresh Laravel applications, never on existing apps with custom auth
- Customize derived files (your own controllers/views), not Breeze's generated scaffolding
- For multi-tenant apps, use Jetstream instead of Breeze for built-in team support
- Configure session driver (Redis/Database) for production; Breeze defaults to file
- Add password policies (history, complexity) for production security

## Performance Considerations

- Tailwind CSS compiled size: ~10-20KB in production after purge (from 2-4MB unoptimized)
- Alpine.js adds ~10KB minified; Livewire ~50KB; React ~130KB
- Vite HMR dev server consumes ~200-400MB RAM
- Inertia SPA loads all page components upfront — consider code splitting for large apps

## Security Considerations

- Add rate limiting on login/register routes (default Breeze doesn't include it)
- Configure HTTPS enforcement and secure cookies in production
- Breeze includes CSRF protection — verify it's active in production
- Enable `MustVerifyEmail` on User model for email verification
- Consider two-factor authentication (use Jetstream if needed)

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Installing on existing app | Breeze overwrites auth files | Not knowing | Lost existing auth customizations | Install on fresh app only |
| Not running npm build | Unstyled Tailwind pages | Forgetting setup step | Broken UI | Always run npm install && npm run build |
| Wrong stack selection | Changing stack after building on Breeze | Not evaluating upfront | Difficult migration | Choose stack carefully at start |
| Direct Breeze file customization | Overwritten on re-install | Editing generated files | Lost customizations | Customize derived files, not generated |
| No --dark flag | Wanting dark mode later | Not knowing flag exists | Manual dark: variant addition | Use --dark during initial install |

## Anti-Patterns

- **Breeze on Existing Apps**: running breeze:install on a project with existing auth implementation
- **Skipping Asset Compilation**: forgetting `npm run build` and leaving unstyled auth pages
- **Over-Customization of Auth**: spending weeks modifying Breeze instead of building application features
- **Ignoring Generated Tests**: Breeze publishes auth tests — removing them reduces test coverage
- **Stack Regret**: building extensively on Blade then wanting SPA (Inertia) — difficult migration

## Examples

```bash
# Minimal installation (no starter kit)
laravel new my-app

# Breeze with Blade + Alpine (default)
composer require laravel/breeze
php artisan breeze:install

# Breeze with Livewire + Volt + dark mode
php artisan breeze:install livewire --dark

# Breeze with React + Inertia + Pest
php artisan breeze:install react --pest

# After installation
npm install
npm run build
php artisan migrate
```

## Related Topics

- laravel-jetstream — teams, API tokens, 2FA
- laravel-starter-kits — comparison and selection
- stub-customization-laravel — customizing scaffolding templates
- custom-artisan-make-commands — extending Laravel's make commands

## AI Agent Notes

- Breeze 2.x (Laravel 11+) uses `php artisan install:laravel/breeze` instead of the older `composer require` approach
- Livewire stack uses Livewire 3.x with Volt (functional components) in latest versions
- Inertia 2.x includes form helper improvements for error handling
- When scaffolding apps for users, suggest Blade/Livewire for simpler stacks, React/Vue for SPA needs

## Verification

- [ ] Authentication routes work (login, register, password reset)
- [ ] Selected frontend stack renders correctly
- [ ] `npm run build` compiles assets without errors
- [ ] Tailwind CSS purged (production build < 20KB)
- [ ] Auth tests pass (Pest or PHPUnit)
- [ ] Email verification flow works (if enabled)
- [ ] Dark mode toggle works (if `--dark` used)
- [ ] Rate limiting configured on login/register
- [ ] Session configured for production use
