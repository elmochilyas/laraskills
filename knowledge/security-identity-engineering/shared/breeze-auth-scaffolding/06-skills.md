# Skill: Scaffold Authentication with Laravel Breeze

## Purpose
Quickly scaffold complete authentication UI using Laravel Breeze with the chosen frontend stack (Blade, Livewire, React, Vue) for rapid application bootstrapping.

## When To Use
- New Laravel projects needing authentication scaffolding
- Rapid prototyping with login, registration, password reset
- Projects wanting a standard, upgrade-safe auth UI

## When NOT To Use
- Custom authentication requirements not covered by Breeze (use Fortify directly)
- Headless API-only applications (no UI needed)
- Existing projects with established auth infrastructure

## Prerequisites
- Fresh Laravel application
- Node.js and npm for frontend stack
- Database configured

## Workflow
1. Install Breeze: `composer require laravel/breeze --dev`
2. Run installer: `php artisan breeze:install` (choose stack: blade, livewire, react, vue)
3. Run migrations: `php artisan migrate`
4. Install NPM dependencies: `npm install && npm run build`
5. Verify auth routes: login, register, password reset, email verification, profile
6. Customize views/components to match application design
7. Configure mail for email verification and password reset
8. Add custom fields to registration form as needed

## Validation Checklist
- [ ] Breeze installed with chosen frontend stack
- [ ] Auth routes functional (login, register, password reset)
- [ ] Email verification configured and working
- [ ] Profile update page functional
- [ ] NPM dependencies installed and built
- [ ] Blade/Livewire/React/Vue components customized as needed
