# Skill: Deploy Laravel Jetstream with Fortify and Sanctum Integration

## Purpose
Set up Laravel Jetstream, which provides a complete application scaffolding combining Fortify (auth backend), Sanctum (API auth), Livewire or Inertia frontend, team management, and 2FA.

## When To Use
- New Laravel applications wanting a feature-complete starting point
- Projects needing authentication, API tokens, teams, and 2FA out of the box
- Teams wanting a standardized application scaffold

## When NOT To Use
- Existing projects (Jetstream is for new projects only)
- Minimal applications (use Breeze for lightweight scaffolding)
- API-only applications (no UI components needed)

## Prerequisites
- Fresh Laravel application
- Node.js and npm
- Database configured

## Workflow
1. Install Jetstream: `composer require laravel/jetstream`
2. Run installer: `php artisan jetstream:install livewire` (or `inertia`)
3. Configure team support if needed
4. Run migrations: `php artisan migrate`
5. Install NPM: `npm install && npm run build`
6. Configure Fortify features in `config/fortify.php`
7. Configure Sanctum for API token support
8. Test auth flows, 2FA setup, team management, and API tokens

## Validation Checklist
- [ ] Jetstream installed with chosen stack
- [ ] Auth routes work (login, register, password reset)
- [ ] 2FA setup and verification functional
- [ ] API token generation and management works
- [ ] Team management features functional (if enabled)
- [ ] Email verification configured (if enabled)
