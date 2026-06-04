# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | .env Management and APP_KEY |
| Difficulty Level | Foundation |
| Last Updated | 2026-06-02 |
| Status | Stable |

---

## Overview

The `.env` file is Laravel's configuration source of truth for environment-specific settings. The `APP_KEY` is a 32-character random string (AES-256-CBC) used by Laravel's encryption (`Crypt` facade), session encryption, and cookie encryption. `APP_KEY` must be generated via `php artisan key:generate` — never hardcoded or committed to version control. Best practices include environment-specific `.env` files, never committing `.env` to git, rotating `APP_KEY` for security, and using `.env.example` as a template.

---

## Core Concepts

- **`.env` File**: Environment-specific configuration. Not committed to version control. Each environment (local, staging, production) has its own.
- **`APP_KEY`**: 32-character base64-encoded random string. Used as the encryption key for Laravel's `Crypt` facade, encrypted cookies, session data encryption, and signed URLs.
- **`php artisan key:generate`**: Generates a new `APP_KEY` in `.env`. Always use this command — never manually create the key.
- **Key Rotation**: Changing `APP_KEY` invalidates all encrypted data (sessions, cookies, encrypted model fields, signed URLs). Plan rotation carefully.
- **`.env.example`**: Committed template file showing all required environment variables with placeholder values. Used by new developers to create their `.env`.

---

## When To Use

- Every Laravel project — `.env` is the standard configuration mechanism
- Environment-specific configuration (different values per environment)
- Storing secrets that should never be in version control (API keys, database passwords)

## When NOT To Use

- Secrets that need centralized management (use Vault)
- Configuration that should be identical across all environments (set defaults in `config/` files)
- Secrets for third-party services with rotation requirements (Vault or secrets manager is preferred)

---

## Best Practices

- **Never Commit `.env`**: Add `.env` to `.gitignore` from project initialization.
- **Use `.env.example`**: Maintain a complete `.env.example` with placeholder/example values. Document each variable.
- **Generate APP_KEY Properly**: Always use `php artisan key:generate` — never copy from another environment or create manually.
- **Cache Config in Production**: `php artisan config:cache` improves performance and prevents direct `.env` file access in production.
- **Environment-Specific Files**: Use `.env.production`, `.env.staging` with deployment-specific values.

---

## Architecture Guidelines

- `.env` files are per-environment and per-developer — never shared
- `config/` files read from `.env` via `env()` helper — use `env()` only in config files, not application code
- Cached config (`config:cache`) reads from `.env` at cache time — changes require re-caching
- `APP_KEY` can be set as an environment variable (server-level) instead of `.env` for higher security

---

## Performance Considerations

- `env()` helper is slow — only use in `config/` files. Use `config()` in application code.
- `config:cache` loads all config into a single file — eliminates `env()` calls at runtime
- After `config:cache`, `.env` is no longer read until cache is cleared

---

## Security Considerations

- **APP_KEY Compromise**: If `APP_KEY` is leaked, an attacker can decrypt all encrypted data (sessions, cookies, encrypted model fields, signed URLs).
- **Committed Secrets**: A committed `.env` file exposes all secrets to anyone with repository access. Use `.gitignore` and secret scanning.
- **Key Rotation Impact**: Changing `APP_KEY` invalidates all existing encrypted data. Plan rotation windows carefully.
- **Debug Mode**: `APP_DEBUG=true` in production exposes `.env` values in error pages — always set `APP_DEBUG=false` in production.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Committing `.env` to version control | Forgetting .gitignore | All secrets exposed in repository | Add `.env` to `.gitignore` immediately |
| Using the same APP_KEY across environments | Copying .env files | Development can decrypt production data | Generate unique APP_KEY per environment |
| Not regenerating APP_KEY from template | Copying production values | Production credentials in local env | Use `.env.example` with placeholder values |
| Using env() in application code | Convenience | Cannot cache config; env() is slow | Use config() helper (cacheable) |
| Debug mode enabled in production | Forgetting to change | Exposes .env values in error pages | Always set APP_DEBUG=false in production |

---

## Anti-Patterns

- **Hardcoding secrets in `config/` files**: Bypasses environment-specific configuration
- **Sharing `.env` across team members**: Each developer should have their own `.env`
- **Using `APP_KEY` from another Laravel installation**: Each app needs its own unique key

---

## Examples

**Generating APP_KEY:**
```bash
php artisan key:generate
# Application key set successfully.
```

**.gitignore entry:**
```
# Laravel .env files
.env
.env.*.local
```

**Config caching:**
```bash
php artisan config:cache
# Configuration cached successfully.
```

**Safe config file pattern:**
```php
// config/app.php — reads from .env
'key' => env('APP_KEY'),
// Application code — reads from config
$appKey = config('app.key');
```

---

## Related Topics

- Vault integration (HashiCorp Vault)
- Encrypted config values
- API key rotation
- Secret scanning

---

## AI Agent Notes

- `.env` committed to version control is a critical security finding. Check `.gitignore` immediately.
- `APP_DEBUG=true` in production is a common and dangerous misconfiguration.
- `config:cache` is mandatory in production — verify it's part of the deployment process.

---

## Verification

- [ ] `.env` in `.gitignore` (never committed)
- [ ] `.env.example` exists with all required variables documented
- [ ] Unique `APP_KEY` per environment, generated via `key:generate`
- [ ] `APP_DEBUG=false` in production
- [ ] `config:cache` run in production deployment
- [ ] `env()` only used in `config/` files (not application code)
- [ ] `.env` file permissions restricted (600 or similar)
- [ ] Key rotation plan documented (if needed)
- [ ] Secrets scanning configured to detect committed `.env` files
