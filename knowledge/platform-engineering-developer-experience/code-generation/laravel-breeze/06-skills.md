# Skill: Scaffold Laravel Authentication with Breeze

## Purpose
Install and configure Laravel Breeze to scaffold minimal authentication (login, registration, password reset, email verification) with the appropriate frontend stack for the project.

## When To Use
- New Laravel applications needing authentication (most web apps)
- Projects requiring auth but not teams, API tokens, or two-factor authentication
- Prototyping and MVP development

## When NOT To Use
- Existing apps with custom auth (Breeze overwrites auth files)
- Apps needing teams/workspaces (use Jetstream)
- Apps needing two-factor authentication or API tokens (use Jetstream)
- API-only backends (no auth UI needed)

## Prerequisites
- Fresh Laravel application
- Composer and NPM installed
- Node.js and Vite for frontend asset compilation

## Inputs
- Composer (for Breeze package)
- Terminal (for artisan commands)

## Workflow

1. **Install Breeze:** Run `composer require laravel/breeze --dev`.

2. **Choose Stack:** Run `php artisan breeze:install` and select the stack: `blade` (default, Alpine.js), `livewire` (Volt or classic), `react` (Inertia), or `vue` (Inertia). Match stack to team skills.

3. **Use Dark Mode (Optional):** Add `--dark` flag during installation for dark mode support. Adding dark mode later is more complex.

4. **Install NPM Dependencies:** Run `npm install && npm run build`. Without this step, Tailwind CSS styles won't apply and pages will appear unstyled.

5. **Run Migrations:** Execute `php artisan migrate` to create users and password reset tables.

6. **Enable Email Verification:** Implement `MustVerifyEmail` on the User model for production apps requiring verified accounts. Configure mail and queue for sending verification emails.

7. **Add Rate Limiting:** Add rate limiting on login and registration routes for production hardening. Use Laravel's built-in `RateLimiter` facade.

## Validation Checklist

- [ ] Breeze installed with correct stack
- [ ] NPM dependencies installed and built
- [ ] Login, registration, password reset pages render correctly
- [ ] Dark mode working (if `--dark` flag used)
- [ ] Email verification flow works (if `MustVerifyEmail` enabled)
- [ ] Rate limiting configured on auth routes
- [ ] Session driver configured for production (Redis/Database)

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| `npm run build` not run | Pages appear unstyled (missing Tailwind CSS) |
| Dark mode not enabled at install | Manual dark mode addition is more complex |
| No rate limiting | Auth endpoints vulnerable to brute force |
| Email verification not configured | Unverified users can access verified-only features |

## Decision Points

- **Choose stack based on team skills** — Blade for backend teams; Livewire for interactive UIs; React/Vue for SPA
- **Install on fresh Laravel apps only** — Never on existing apps with custom auth
- **Use Breeze for most new Laravel web apps** needing auth but not teams/2FA
- **Use Jetstream for apps needing teams, API tokens, or two-factor authentication**

## Performance/Security Considerations

- **Rate limiting:** Add on login (5 attempts/minute) and registration routes
- **Session driver:** Configure Redis/Database for production; don't use file driver on multi-server setups
- **Email verification:** Enable for production; prevents unverified account usage
- **CSRF protection:** Breeze includes CSRF tokens in forms by default

## Related Rules

- BREEZE-RULE-001: Choose stack based on team skills
- BREEZE-RULE-002: Use `--dark` during install
- BREEZE-RULE-003: Run `npm install && npm run build`
- BREEZE-RULE-004: Enable `MustVerifyEmail`
- BREEZE-RULE-005: Add rate limiting

## Related Skills

- Scaffold Laravel with Jetstream
- Choose Laravel Starter Kit
- Create Custom Artisan Make Commands

## Success Criteria

- Authentication features (login, register, password reset) work correctly
- Frontend renders properly with Tailwind CSS styling
- Email verification and rate limiting configured for production
- Stack choice matches team skills and project requirements
