# 04-Standardized Knowledge: Laravel Starter Kits

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | code-generation-scaffolding |
| **Knowledge Unit** | laravel-starter-kits |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-breeze, laravel-jetstream, laravel-installer |
| **Framework/Language** | Laravel, Breeze, Jetstream, Livewire, Inertia, React, Vue, PHP |

## Overview

Laravel Starter Kits provide pre-built authentication, profile management, and team management scaffolding. Two primary kits exist: Breeze (minimal auth: login, registration, password reset, email verification) and Jetstream (advanced: adds teams, two-factor auth, API tokens via Sanctum, session management). Both offer Blade + Alpine, Livewire, React/Inertia, and Vue/Inertia stacks, using Tailwind CSS and Vite. Choice depends on project requirements: Breeze for simple auth, Jetstream for enterprise features.

## Core Concepts

- **Breeze**: minimal — auth-only, no teams or API tokens; best for simple applications
- **Jetstream**: full-featured — teams, 2FA, API tokens, session management, profile management
- **Stack Options**: Blade+Alpine, Livewire+Volt, React+Inertia, Vue+Inertia
- **Tailwind CSS**: utility-first CSS with dark mode; all kits use it
- **Vite**: asset bundling with HMR; configured by all kits
- **Inertia**: glue layer connecting Laravel with React/Vue for SPA-like experiences
- **Sanctum**: API token authentication used by Jetstream

## When to Use

- **Breeze**: most new Laravel web apps that need auth but not teams/2FA
- **Jetstream**: SaaS apps, multi-tenant apps, apps requiring teams and API tokens
- **No starter kit**: API-only backends, microservices, or custom auth implementations

## When NOT to Use

- Existing applications with custom authentication (starter kits overwrite files)
- Applications needing completely custom authentication flows
- Projects where generated code mass is disproportionate to needs
- Teams wanting to use different CSS frameworks or build tools

## Best Practices (WHY)

- **Choose kit based on needs**: Breeze for simple auth; Jetstream for teams/2FA/API tokens; none for API-only
- **Match stack to team skills**: Blade for backend-heavy; Livewire for interactive UIs; React/Vue for SPA experts
- **Extend, don't modify**: keep generated code in designated directories; extend rather than modify for future updates
- **Understand generated code**: don't use features without knowing how team scoping, permissions, midlleware work
- **Plan for customization**: starter kits are starting points — most production apps need custom auth flows beyond defaults

## Architecture Guidelines

- Start with Breeze for prototyping; upgrade to Jetstream if teams become necessary (documented migration path)
- Keep starter kit code in designated directories — your application code should be separate from scaffolding
- Replace generated code with application-specific implementations as the app evolves
- Configure through config (Jetstream::teams(), Fortify::authenticateUsing()) rather than modifying generated files
- For heavy custom auth, use Fortify directly instead of Jetstream's UI layers

## Performance Considerations

- Breeze adds ~20 files; Jetstream adds ~80+ files to a fresh installation
- NPM deps: Breeze ~300 packages; Jetstream ~400 — affects install and CI time
- Livewire components add round-trip overhead for interactivity
- Inertia serves all JS upfront — implement code splitting for large apps
- Starter kit code doesn't affect runtime performance significantly once deployed

## Security Considerations

- Starter kits implement basic security (CSRF, auth middleware, form validation)
- Production hardening needed: rate limiting, account lockout, HTTPS enforcement
- Jetstream includes Sanctum for API auth — configure token expiry appropriately
- Team data isolation must be enforced at the query level (not automatic)
- Enable MustVerifyEmail for production applications

## Common Mistakes

| Mistake | Description | Cause | Consequence | Better Approach |
|---------|-------------|-------|-------------|-----------------|
| Building entire app in starter kit | Features entangled with scaffolding | Not separating concerns | Hard to upgrade, maintain | Use starter kit as starting point only |
| Not understanding generated code | Using features blindly | Skipping documentation | Bugs when extending | Learn how team scoping, auth works |
| Mixing stacks | Livewire + React in same project | Not committing | Complexity | Pick one stack per project |
| Re-running install over custom code | Overwriting modifications | Forgetting to branch | Lost customizations | Use VCS before re-installing |
| Skipping frontend build | Missing compiled assets | Forgetting production build | Broken UI | Always run npm run build for production |

## Anti-Patterns

- **Starter Kit as Application Framework**: never modify starter kit files as if they're your application core
- **Ignoring Upgrade Compatibility**: not checking starter kit version compatibility with Laravel version
- **No Customization Boundary**: mixing custom code with generated code in the same files
- **Stack Regret**: building extensively on Blade then wanting SPA migration — costly
- **Kit for Everything**: using Jetstream for a simple blog adds unnecessary complexity

## Examples

```bash
# Breeze selection
laravel new my-app --breeze --stack=blade --pest

# Jetstream selection
laravel new my-app --jet --stack=livewire --teams

# No starter kit (API-only)
laravel new api-app --no-interaction --no-starterkit

# After any starter kit
npm install && npm run build
php artisan migrate
```

## Related Topics

- laravel-breeze — minimal auth scaffolding
- laravel-jetstream — advanced auth with teams and 2FA
- laravel-installer — project creation tool
- stub-customization-laravel — customizing scaffolding templates

## AI Agent Notes

- Starter kit concept introduced in Laravel 8.x (replaced `laravel/ui`)
- `php artisan install:` command pattern for kits introduced in Laravel 11.x
- Livewire stack added to Breeze in Laravel 10.x, reflecting Livewire's ecosystem growth
- When recommending to users, ask: simple auth? → Breeze. Teams/2FA? → Jetstream. API-only? → No kit

## Verification

- [ ] Correct starter kit selected based on project requirements
- [ ] Frontend stack matches team expertise
- [ ] Authentication flows work (login, register, password reset)
- [ ] Team features work (if Jetstream selected)
- [ ] Two-factor authentication works (if Jetstream selected)
- [ ] API tokens manageable (if Jetstream selected)
- [ ] Frontend assets compile and render correctly
- [ ] All published tests pass
- [ ] Generated code understood by development team
- [ ] Starter kit version compatible with Laravel version
