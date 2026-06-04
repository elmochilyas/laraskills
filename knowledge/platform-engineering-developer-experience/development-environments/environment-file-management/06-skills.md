# Skill: Manage Laravel Environment Files

## Purpose
Configure and manage Laravel `.env` files across different environments with proper security, config caching, and environment-specific overrides.

## When To Use
- Every Laravel project for environment-specific configuration
- Setting up new projects with proper .env management
- Configuring environment-specific files for testing, Dusk, etc.

## When NOT To Use
- Projects not using Laravel's configuration system
- When all environments have identical settings (use config defaults)

## Prerequisites
- Laravel project with `vlucas/phpdotenv` (included by default)
- `.env` file created (from `.env.example`)

## Inputs
- `.env` — environment-specific configuration (never committed)
- `.env.example` — template file (committed)
- `config/` files using `env()` helper

## Workflow

1. **Create .env File:** Copy `.env.example` to `.env`. Generate `APP_KEY` with `php artisan key:generate`. Immediately add `.env` to `.gitignore`.

2. **Configure .env.example:** Maintain `.env.example` as a committed template with placeholder values. Add new required variables immediately when adding config. Document each variable with comments.

3. **Use env() Only in Config Files:** Call `env()` exclusively in `config/*.php` files. Application code must use `config()` helper. This ensures config caching works correctly.

4. **Validate Required Variables:** At application bootstrap (e.g., `AppServiceProvider`), validate that critical env vars are present. Use `throw new \RuntimeException(...)` with clear messages for missing vars.

5. **Cache Config in Production:** Run `php artisan config:cache` in deployment. This resolves all `env()` calls into concrete values and speeds up application bootstrap.

6. **Never Cache in Development:** Config caching breaks `env()` calls — changes to `.env` won't take effect until `config:clear` is run.

7. **Create Environment-Specific Files:** Use `.env.testing` for test configuration overrides, `.env.dusk.local` for Dusk browser tests. Laravel auto-detects these based on `APP_ENV`.

## Validation Checklist

- [ ] `.env` in `.gitignore`
- [ ] `.env.example` committed with all required variables documented
- [ ] `env()` only called in `config/` files
- [ ] Application code uses `config()` helper
- [ ] Config caching works in production
- [ ] Critical env vars validated at bootstrap
- [ ] Environment-specific files created for testing/Dusk

## Common Failures

| Failure | Early Detection |
|---------|----------------|
| `.env` committed | Secrets exposed in version control |
| `env()` in application code | Config caching breaks at runtime |
| `.env.example` not updated | New team members miss required config |
| Config cached in dev | `.env` changes don't take effect |

## Decision Points

- **Every Laravel project** must use `.env` for environment-specific configuration
- **Never commit `.env`** to version control
- **Never hard-code secrets in config files** — Always use `env()` with `.env` overrides

## Performance/Security Considerations

- **Config caching:** Reduces bootstrap time by 50-100ms; always cache in production
- **Secrets:** API keys, DB passwords, and app keys go in `.env`, never in committed files
- **Validation:** Fail early on bootstrap if critical env vars are missing

## Related Rules

- ENV-RULE-001: `env()` only in config files
- ENV-RULE-002: Cache config in production
- ENV-RULE-003: Never cache in development
- ENV-RULE-004: Keep .env.example updated
- ENV-RULE-005: Validate required vars at bootstrap

## Related Skills

- Set Up Docker Compose for Laravel
- Configure Laravel Sail
- Set Up Automated Environment Setup Scripts

## Success Criteria

- `.env` files are properly managed with `.env.example` as template
- Config caching works in production without issues
- `env()` calls are restricted to `config/` files
- Environment-specific overrides work correctly for testing and Dusk
