# 04-Standardized Knowledge: Environment File Management

## Metadata

| Attribute | Value |
|-----------|-------|
| **Subdomain** | development-environments |
| **Knowledge Unit** | environment-file-management |
| **Domain** | platform-engineering-developer-experience |
| **Maturity** | Mature |
| **Difficulty** | Foundation |
| **Dependencies** | laravel-sail, docker-compose-for-laravel, automated-environment-setup-scripts |
| **Framework/Language** | Laravel, .env, PHP, Dotenv |

## Overview

Environment file management in Laravel uses `.env` files and `vlucas/phpdotenv` for configuration across environments (local, testing, staging, production). `.env` for sensitive/environment-specific values (never committed), `.env.example` as template (committed), `config/` files with `env()` fallbacks. Environment-specific `.env` files (`.env.testing`, `.env.dusk.local`). Environment detection via `APP_ENV`.

## Core Concepts

- **.env File**: environment-specific config in project root; NOT committed; contains sensitive values
- **.env.example**: template file committed with placeholder values
- **env() Helper**: reads env vars with default: `env('DB_CONNECTION', 'mysql')`
- **Config Files**: `config/` files use `env()` calls for environment-aware defaults
- **APP_ENV**: determines running environment (local, production, testing)
- **config() Helper**: access configuration values; use in app code instead of env()
- **Config Caching**: `php artisan config:cache` bakes env() values; env() stops working after caching

## When to Use

- Every Laravel project
- Managing configuration across multiple environments
- Storing secrets (API keys, passwords) outside version control

## When NOT to Use

- Hard-coded configuration that doesn't vary by environment (use config files directly)
- Configuration that changes at runtime (env is for bootstrap-time only)

## Best Practices (WHY)

- **env() only in config files**: application code uses `config()` — ensures config caching works
- **Cache config in production**: `php artisan config:cache` resolves env() calls and speeds bootstrap
- **Never cache in development**: env changes need config:clear to take effect
- **Keep .env.example updated**: add new required variables immediately
- **Validate required vars at bootstrap**: fail early if critical env vars are missing
- **Gitignore .env**: add to `.gitignore` immediately on project creation
- **Use environment-specific files**: `.env.testing` for tests, `.env.dusk.local` for Dusk

## Architecture Guidelines

- `env()` only in `config/` files; `config()` everywhere else
- Base values in config files; overrides in `.env`; server env vars for deployment platforms
- Production: always cache config. Development: never cache config
- Same .env structure (same keys), different values per environment

## Performance Considerations

- Config caching: reduces bootstrap by 10-30ms in production
- env() call overhead: negligible in config files (loaded once)
- config() calls cached in memory after first access
- Reading .env on every request (uncached): 1-3ms file I/O

## Security Considerations

- Never commit `.env` to version control
- Rotate APP_KEY carefully — old encrypted data becomes unreadable
- Never log environment variable values
- Use deployment platform's encrypted storage for production secrets

## Common Mistakes

| Mistake | Description | Consequence | Better Approach |
|---------|-------------|-------------|-----------------|
| env() in app code | config caching breaks it | env() returns null after cache | Use config() in app code |
| Committing .env | Secrets in repository | Data exposure | Gitignore .env immediately |
| Stale .env.example | New vars not documented | Devs don't know required vars | Update .env.example with each addition |
| Config cache in dev | env changes don't apply | Dev confusion | Only cache in production |
| Skipping APP_KEY generation | Placeholder or copied key | Insecure encryption | Generate fresh APP_KEY per project |

## Anti-Patterns

- **Hard-coding secrets in config files**: defeats purpose of environment-based configuration
- **Multiple .env files in production**: production should use platform env vars, not .env files

## Examples

```php
// config/app.php - env() in config file only
'name' => env('APP_NAME', 'Laravel'),
'env' => env('APP_ENV', 'production'),
'debug' => (bool) env('APP_DEBUG', false),

// Controller - config() in app code
$appName = config('app.name');
```

## Related Topics

- laravel-sail — Sail's .env bridge to Docker containers
- docker-compose-for-laravel — .env substitution in Compose
- automated-environment-setup-scripts — automated dev setup

## AI Agent Notes

- Always generate APP_KEY when scaffolding projects
- Keep `.env.example` as the single source of truth for required vars

## Verification

- [ ] `.env` in `.gitignore`
- [ ] `.env.example` committed and up-to-date
- [ ] `env()` only in config files
- [ ] `config()` used in app code
- [ ] Config cached in production
- [ ] Required variables validated at bootstrap
- [ ] APP_KEY unique per project
