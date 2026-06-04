# Knowledge Unit: Secure Secrets & Configuration Management

## Metadata

- **ID:** ku-03
- **Subdomain:** AI Safety & Security
- **Slug:** secure-secrets---configuration-management
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Secure secrets and configuration management covers the storage, distribution, rotation, and auditing of sensitive credentials used throughout an AI system â€” API keys, model endpoints, database credentials, encryption keys, and signing secrets. In AI systems, the blast radius of a leaked credential is particularly severe: an attacker with LLM provider access can exhaust budgets, exfiltrate data via prompts, or impersonate the application. This KU focuses on the practices and architecture for keeping secrets safe in a Laravel AI deployment.

## Core Concepts

- **Secret:** Any credential or sensitive value that, if exposed, could compromise system security (API keys, tokens, passwords, certificates).
- **Secrets Manager:** A dedicated service for storing, rotating, and auditing secrets (Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager).
- **Configuration vs. Secrets:** Configuration is non-sensitive (log levels, feature flags, model names). Secrets require encryption and access control.
- **Encryption at Rest:** Secrets stored in encrypted form using envelope encryption (KEK/DEK) or platform-managed keys.
- **Encryption in Transit:** All secrets transmitted over TLS; never over unencrypted channels.
- **Access Audit:** Logging every read/rotate/revoke action on secrets for compliance and incident response.
- **Rotation:** Periodic replacement of secrets to limit the window of exposure if leaked.

## Mental Models

- **Secret:** Any credential or sensitive value that, if exposed, could compromise system security (API keys, tokens, passwords, certificates).
- **Secrets Manager:** A dedicated service for storing, rotating, and auditing secrets (Vault, AWS Secrets Manager, Azure Key Vault, GCP Secret Manager).
- **Configuration vs. Secrets:** Configuration is non-sensitive (log levels, feature flags, model names). Secrets require encryption and access control.


## Internal Mechanics

The internal mechanics of Secure Secrets & Configuration Management follow established patterns within the AI Safety & Security domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Never commit secrets to version control.** Use `.gitignore` for `.env` files; scan repos for accidentally committed secrets.
- **Use a dedicated secrets manager** rather than environment variables or encrypted config files for production.
- **Rotate secrets regularly** (every 30-90 days) and immediately on compromise.
- **Apply least privilege:** each service, application, and environment should have its own credentials with minimum required permissions.
- **Audit all secret access.** Know who accessed what secret, when, and from where.
- **Implement emergency revocation** â€” the ability to revoke a compromised secret within seconds across all services.

## Patterns

- **Never commit secrets to version control.** Use `.gitignore` for `.env` files; scan repos for accidentally committed secrets.
- **Use a dedicated secrets manager** rather than environment variables or encrypted config files for production.
- **Rotate secrets regularly** (every 30-90 days) and immediately on compromise.
- **Apply least privilege:** each service, application, and environment should have its own credentials with minimum required permissions.
- **Audit all secret access.** Know who accessed what secret, when, and from where.
- **Implement emergency revocation** â€” the ability to revoke a compromised secret within seconds across all services.

## Architectural Decisions

- Applications should **fetch secrets at startup** and cache them securely (in-memory, encrypted) for the lifetime of the process.
- Secrets should be **injected via environment variables** in containerized deployments, read from mounted volumes in Kubernetes, or fetched via the secrets manager API.
- In Laravel, use the **config system with encrypted stores**: `config/ai-keys.php` reads from vault, not hardcoded values.
- Implement a **secret rotation handler** that listens for rotation events (webhook or poll) and refreshes in-memory cache without restart.
- Separate **configuration** (non-sensitive, in config files) from **secrets** (in vault). Don't mix them.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Secrets manager API calls add 5-50ms latency. Cache aggressively with 5-15 minute TTL.
- Cache invalidation on rotation must be near-instant (<1s). Use pub/sub or short TTLs.
- Encryption/decryption overhead is negligible (<1ms) for symmetric keys.
- Batch secret fetching: fetch all secrets at startup in a single API call rather than individual fetches.
- For high-availability, cache secrets in local memory with a fallback to fetch on cache miss.

## Production Considerations

- **Leak detection:** Scan code, logs, and error messages for accidental secret exposure. Set up automated scanning (git secrets, truffleHog).
- **Incident response:** Have a runbook for secret compromise: revoke immediately, rotate all related secrets, audit access logs, notify stakeholders.
- **Shared secrets:** Minimize shared secrets. Each service should have its own unique credentials.
- **Secret sprawl:** Regularly audit secrets in the vault â€” remove unused or expired secrets.
- **Developer access:** Developers should not need production secrets in their local environment. Use local mock/stub credentials.

## Common Mistakes

- Storing secrets in `.env` files that are committed to git or shared via email/chat.
- Using the same API key across all environments (dev, staging, production).
- Not rotating secrets â€” a year-old secret is almost certainly compromised.
- Logging secrets in application logs or error messages.
- Hardcoding fallback values in config files when the vault is unreachable â€” creates a leak vector.

## Failure Modes

- **Config Files as Secrets:** Encrypting config files and committing them to git. Prefer a secrets manager with dynamic secrets.
- **Hardcoded Defaults:** `config('ai.openai_key') ?? 'sk-...'` â€” never put real keys as defaults.
- **Shared Service Account:** One set of credentials shared across all microservices. Each service gets its own identity.
- **Vault as a File System:** Storing entire config files (not just secrets) in the vault. Keep it small and focused.
- **No Offboarding:** When a developer leaves, their access to secrets should be revoked immediately with the rest of their access.

## Ecosystem Usage

### Laravel Secret Provider
```php
class VaultServiceProvider extends ServiceProvider {
    public function register(): void {
        $this->app->singleton(SecretManager::class, function ($app) {
            return new VaultSecretManager(
                vault: new VaultClient(config('vault.address')),
                cache: $app['cache']->store(),
                ttl: 300, // 5 minutes
            );
        });
    }
}
```

### Configuration Reading from Vault
```php
// config/ai-keys.php
return [
    'openai' => [
        'key' => env('OPENAI_API_KEY', fn() => app(SecretManager::class)->get('openai/production/api_key')),
        'organization' => env('OPENAI_ORG_ID', fn() => app(SecretManager::class)->get('openai/production/org_id')),
    ],
];
```

## Related Knowledge Units

- ai-middleware-gateway/ku-03: API key management in the gateway.
- ku-05 (Rate Limiting & Abuse Prevention): Using secrets for authenticated rate limiting.
- ku-06 (Secure Output Handling): Ensuring secrets don't leak in LLM output.
- cost-management-observability/ku-04: Secure cost reporting.
- local-llm-development/ku-02: Local secret management for development.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

