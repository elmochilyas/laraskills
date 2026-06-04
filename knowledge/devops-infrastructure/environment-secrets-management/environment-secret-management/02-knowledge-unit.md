# Environment & Secret Management

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Environment & Secrets Management
- **Knowledge Unit:** Environment & Secret Management
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Environment and secret management encompasses how Laravel applications handle configuration across environments and how sensitive values are stored, transmitted, and rotated. The Laravel ecosystem supports `.env` files, first-party tools (Forge, Vapor), third-party vaults (Doppler, HashiCorp Vault), and cloud-native solutions (AWS Secrets Manager, SSM Parameter Store). Secret mismanagement is the leading cause of Laravel security incidents.

---

## Core Concepts

- **.env File** — Per-environment configuration file, never committed to Git
- **.env.example** — Template with placeholder values documenting required environment variables
- **config:cache** — Compiles configuration into a single file for performance; must be refreshed on env changes
- **Vault Integration** — Doppler, HashiCorp Vault, AWS Secrets Manager for centralized secret storage
- **Secret Rotation** — Periodic credential replacement to limit exposure window of compromised secrets
- **CI/CD Secrets** — Platform-specific secret storage for pipeline variables

---

## Mental Models

- **Secrets Are Not Code** — Secrets (passwords, API keys, tokens) should never be treated like application code. They should never enter the repository, never be in logs, and never be shared outside the team.
- **Environment as Configuration Boundary** — Each environment (local, staging, production) has its own configuration. The same code deployed to different environments behaves differently based on configuration — never share `.env` files across environments.
- **Defense in Depth for Secrets** — Multiple layers protect secrets: `.gitignore` prevents commits, `.env.example` documents without exposing values, vaults add encryption and access control, rotation limits breach impact.

---

## Internal Mechanics

Laravel's configuration system loads values from the `.env` file at boot time via the `Dotenv` library. Configuration files in `config/` reference `env()` helper to read environment variables. When `php artisan config:cache` is executed, all configuration values are resolved from `.env` and compiled into a single `bootstrap/cache/config.php` file. After caching, `env()` calls outside configuration files return `null`. Vault integrations (Doppler SDK, AWS Secrets Manager SDK) fetch secrets at runtime and cache them in the Laravel cache store.

---

## Patterns

- **Never Commit .env** — Add `.env` to `.gitignore`. Use `.env.example` for documentation with placeholder values.
- **Use config:cache in Production** — All environments except local should run `config:cache` for performance and security.
- **One .env Per Environment** — Don't share `.env` files across environments. Each environment has unique credentials.
- **Rotate APP_KEY** — Rotate application key on security incident or team member departure.
- **Audit Secret Access** — Regularly review who has access to production secrets.

---

## Architectural Decisions

- **.env vs. Vault** — Use `.env` for simple projects and small teams; use vault (Doppler, Vault, AWS Secrets Manager) for multiple environments, compliance requirements, and team access auditing
- **config:cache vs. No Cache** — Always use `config:cache` in production for performance; skip only when env values must change without deployment
- **Environment Variables vs. Config Files** — Use environment variables for deployment-specific values; use config files with defaults for application defaults

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Simple, well-understood `.env` workflow | No access control or audit trail | Anyone with server access can read secrets |
| config:cache improves performance | Cached values don't reflect runtime env changes | Env changes require cache clear and config reload |
| Vault provides centralized, audited storage | Vault infrastructure and integration cost | Additional latency and operational complexity |
| Secret rotation limits breach impact | Rotation automation complexity | Manual rotation is often skipped |

---

## Performance Considerations

`config:cache` significantly improves performance by eliminating file parsing on every request. Vault SDK calls add latency — cache fetched secrets in Laravel cache. AWS Secrets Manager and Parameter Store have API rate limits. Doppler provides local caching for offline access. Environment variable access via `env()` is fast but still slower than cached config access.

---

## Production Considerations

Implement `.env` file permissions to 600. Use `config:cache` in all non-local environments. Never expose `.env` contents in logs, error pages, or debug output. Use vault integration for production secrets with access auditing. Implement secret rotation procedures. Store CI/CD secrets in the platform's encrypted secret store. Review production secret access quarterly.

---

## Common Mistakes

- **Committed .env Files** — The most common Laravel security incident. Credentials exposed in public repositories due to missing `.gitignore` or force-push.
- **Shared .env Across Environments** — Staging shares production `.env`, causing accidental production database modification from staging.
- **No config:cache in Production** — Each request parses all config files, degrading performance and exposing configuration structure.
- **Hardcoded Secrets in Code** — API keys and passwords in source code that bypass environment variable management entirely.

---

## Failure Modes

- **Committed Secret Exposure** — `.env` file accidentally committed to public repository. Detection: credential scanning alert or security disclosure. Mitigation: rotate all exposed secrets immediately, scrub from Git history, add pre-commit hooks for `.env` detection.
- **Cache Stale Configuration** — `config:cache` not re-run after environment variable change. Detection: application uses old configuration values. Mitigation: always run `config:cache` after env changes.
- **Vault Unavailability** — Vault service is unreachable at deployment time. Detection: deployment fails because secrets cannot be fetched. Mitigation: implement local fallback with cached secrets, design for graceful degradation.
- **Expired Certificate/Key** — TLS certificate or API key expires without rotation. Detection: application returns authentication or SSL errors. Mitigation: implement expiry monitoring and automated rotation.

---

## Ecosystem Usage

Laravel's environment management is built into the framework core. The `.env` file system works out of the box. Forge and Vapor provide dashboard-based environment variable management. Doppler provides a Laravel SDK with `doppler` CLI integration and runtime secret injection. HashiCorp Vault integrates via community packages. AWS Secrets Manager and SSM Parameter Store integrate through Laravel's configuration system or custom providers.

---

## Related Knowledge Units

### Prerequisites
- Laravel configuration system

### Related Topics
- Vault Secrets Management (advanced secret storage)
- CI/CD Secrets (pipeline secret management)
- Deployment Strategies (how secrets move between environments)

### Advanced Follow-up Topics
- Secrets Rotation Automation
- Zero-Trust Secret Delivery
- Compliance Engineering

---

## Research Notes

Secret mismanagement is the leading cause of Laravel security incidents. Never commit `.env` files — this is the most common and most damaging mistake. Always use `config:cache` in production. Use `.env.example` for documentation. Vault integration adds complexity but provides access control and audit trail. Rotate secrets on incident or team member departure. Audit secret access regularly.
