# Skill: Select and Configure Laravel Starter Kits for Auth Scaffolding

## Purpose
Select the appropriate Laravel Starter Kit (Breeze, Jetstream, or custom Fortify) based on project needs and configure it for the chosen frontend stack.

## When To Use
- New Laravel project initialization
- Team standardization on a specific auth scaffolding approach
- Evaluating which starter kit matches project requirements

## When NOT To Use
- Existing projects with established auth
- Headless API-only applications
- When custom auth requirements justify a bespoke implementation

## Prerequisites
- Fresh Laravel application
- Understanding of project requirements (frontend stack, features needed)

## Workflow
1. Evaluate project requirements: frontend stack, API needs, teams, 2FA
2. Choose: Breeze (simple auth) or Jetstream (auth + API tokens + teams + 2FA)
3. For Breeze: `php artisan breeze:install` with stack choice (blade, livewire, react, vue)
4. For Jetstream: `php artisan jetstream:install livewire` or `inertia`
5. Configure Fortify features as needed
6. Run migrations, install npm, build frontend
7. Test all auth flows end-to-end

## Validation Checklist
- [ ] Starter kit selected based on project requirements
- [ ] Appropriate frontend stack chosen (Blade, Livewire, React, Vue)
- [ ] Auth flows tested (login, register, password reset)
- [ ] Additional features configured (2FA, teams, API tokens if Jetstream)
- [ ] Build pipeline works (npm, Vite, migrations)
