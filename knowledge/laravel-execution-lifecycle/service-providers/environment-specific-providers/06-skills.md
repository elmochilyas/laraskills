# Skill: Conditionally Register Environment-Specific Providers

## Purpose

Register service providers only in the environments where they are needed (e.g., Debugbar and Telescope in local, not production) using compile-time exclusion for zero overhead in non-target environments.

## When To Use

- Registering development-only tooling (Debugbar, Telescope, IDE helpers).
- Excluding heavy profiling providers from production.
- Configuring different service implementations per environment (e.g., mail logging in dev, SES in production).
- Any provider whose presence is only appropriate in certain `APP_ENV` values.

## When NOT To Use

- Providers that affect production behavior (auth, encryption, routing) — must always be registered.
- When `APP_ENV` is unreliable or environment detection is inconsistent.
- Deferred providers (environment guards inside deferred providers create non-deterministic behavior).

## Prerequisites

- Provider Fundamentals
- Understanding of `APP_ENV` and environment configuration
- `dont-discover` configuration in `composer.json`

## Inputs

- Provider class name to conditionally register
- Target environments where provider should load
- `composer.json` (for `dont-discover` exclusions)

## Workflow

1. If the provider is auto-discovered, add it to `extra.laravel.dont-discover` in root `composer.json`.
2. In a proxy provider (e.g., `AppServiceProvider`), guard the registration:
   ```php
   public function register(): void
   {
       if ($this->app->environment('local')) {
           $this->app->register(TelescopeServiceProvider::class);
       }
   }
   ```
3. Prefer config-driven checks over environment string hard-coding:
   ```php
   if (config('app.debug')) { ... }
   ```
4. Verify the provider is NOT registered in production: run `php artisan about --json` and inspect providers.
5. Validate that environment detection works correctly in all target environments (local, staging, production).

## Validation Checklist

- [ ] Development provider excluded from auto-discovery via `dont-discover`
- [ ] Conditional registration uses compile-time exclusion (not runtime guard inside the provider itself)
- [ ] Provider does NOT appear in production provider list (`php artisan about --json`)
- [ ] Provider IS registered in target environment (local/staging)
- [ ] Config-driven guard preferred over hard-coded environment string
- [ ] No development provider registered in production when `APP_ENV=production`

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Provider still loads in production | `dont-discover` not configured; or provider listed in `bootstrap/providers.php` |
| Provider loads but does nothing | Runtime guard inside provider instead of compile-time exclusion; provider still instantiated |
| `APP_ENV=production` but provider still registers | Config cache has stale value — run `php artisan config:cache` after changing `.env` |
| Conditional registration in deferred provider | Environment-check inside deferred provider — manifest build and load time environments may differ |

## Decision Points

- **Compile-Time vs Runtime Guard**: Can you avoid registering the provider entirely? → Prefer compile-time. Must keep provider registered but conditionally bind? → Use runtime guard.
- **Environment String vs Config**: Will this condition ever need to change without code deploy? → Use config-driven guard. Must match `APP_ENV` exactly? → Use environment string.

## Performance Considerations

- Compile-time exclusion saves PHP class loading, instantiation, `register()`, `boot()`, and memory.
- Runtime guards still pay instantiation cost (~0.1-0.5ms per guard).
- Heavy providers like Laravel Debugbar add 5-15ms bootstrap time — excluding them in production is significant.
- Conditional `$app->register()` is the most performant guard — zero overhead in excluded environments.

## Security Considerations

- Development providers in production leak stack traces, config values, queries.
- Ensure `APP_ENV` is correctly set to `production` in production environments.
- Config cache locks `config('app.debug')` — runtime changes don't take effect until cache is rebuilt.
- Audit `bootstrap/cache/packages.php` for unintended development providers.

## Related Rules

- Rule 1: Prefer Compile-Time Exclusion Over Runtime Guards
- Rule 2: Use Config-Driven Guards Over Hard-Coded Environment Strings
- Rule 3: Use `dont-discover` for Development Packages, Then Conditionally Register
- Rule 4: Audit Production Provider List to Exclude Development Providers
- Rule 5: Never Use Environment Guards Inside Deferred Providers

## Related Skills

- Audit Production Provider List for Development Providers
- Configure Package Discovery for a New Package

## Success Criteria

- Development providers are registered in local but absent from production provider list.
- Zero bootstrap overhead from excluded providers in production.
- Provider registration uses compile-time exclusion (not runtime guards).
- CI/CD pipeline validates that no development providers are registered in production.
---

# Skill: Audit Production Provider List for Development Providers

## Purpose

Verify that no development-only service providers (Debugbar, Telescope, IDE helpers, profilers) are registered in the production environment, preventing sensitive data leakage and performance overhead.

## When To Use

- As a CI/CD deployment gate step.
- Before a production release.
- After adding new packages or dependencies.
- Quarterly security review.

## When NOT To Use

- Local or staging environments where development tooling is intentional.
- Small projects with no development tooling packages installed.

## Prerequisites

- Access to the production build or staging environment with production configuration
- List of known development-only provider class name patterns

## Inputs

- `bootstrap/providers.php` contents (manual providers)
- `bootstrap/cache/packages.php` contents (auto-discovered providers)
- List of blocked provider substrings: `['Debugbar', 'Telescope', 'Clockwork', 'IdeHelper', 'Debug']`

## Workflow

1. Read all registered providers: merge manual (`bootstrap/providers.php`) and discovered (`bootstrap/cache/packages.php`).
2. Check each provider class name against the blocked list.
3. If any blocked provider is found, determine how it was registered:
   - Auto-discovered → add to `dont-discover` in `composer.json`.
   - Manually listed in `bootstrap/providers.php` → remove and use conditional registration.
   - Listed in proxy provider → ensure conditional guard is correct.
4. Fix the registration and re-run the audit.
5. Add the audit to CI/CD pipeline as a deployment gate.

## Validation Checklist

- [ ] All registered provider class names collected (manual + discovered)
- [ ] Each provider checked against blocked list
- [ ] No blocked providers found in production environment
- [ ] Any found issues are fixed (dont-discover, conditional registration, or removal)
- [ ] CI/CD step enforces audit on every deploy

## Common Failures

| Failure | Likely Cause |
|---------|--------------|
| Audit passes but provider still loads | Only checked manual providers, missed auto-discovered ones |
| Provider name changed between versions | Blocked list stale — update with new pattern matches |
| Custom development provider not caught | Custom provider not in blocked list — add application-specific names |
| Audit passes locally but fails in production | Different packages installed in production (no `--no-dev` flag on `composer install`) |

## Decision Points

- **Block or Guard**: For auto-discovered packages → `dont-discover`. For manually registered → conditional `$app->register()`.
- **Audit in CI vs Manual**: CI enforcement catches regressions; manual audit is for initial cleanup.

## Performance Considerations

- CI audit is deployment-time only — no runtime overhead.
- Regular audits prevent gradual performance degradation from development providers.
- Finding and removing a heavy development provider (5-15ms) from production bootstrap is a significant optimization.

## Security Considerations

- Development providers leak: config values, database queries, stack traces, server variables.
- Telescope exposes all application data (users, jobs, mail, queries) to anyone with access.
- Even "read-only" development providers can expose security-critical information.
- Production `APP_ENV` must equal `production` — misconfiguration is the most common root cause.

## Related Rules

- Rule 3: Use `dont-discover` for Development Packages, Then Conditionally Register
- Rule 4: Audit Production Provider List to Exclude Development Providers

## Related Skills

- Conditionally Register Environment-Specific Providers
- Enforce Provider Budget in CI

## Success Criteria

- CI/CD pipeline fails deployment if any blocked development provider is registered.
- Production environment loads zero development-only providers.
- Quarterly security reviews include provider list inspection.
