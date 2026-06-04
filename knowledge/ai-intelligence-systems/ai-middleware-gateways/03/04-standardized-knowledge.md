---
id: ku-03
title: "API Key Management"
subdomain: "ai-middleware-gateway"
ku-type: "security"
date-created: "2026-06-02"
domain-maturity: "mature"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/ai-middleware-gateway/ku-03/04-standardized-knowledge.md"
---

# API Key Management

## Overview

API key management encompasses the secure storage, rotation, distribution, and revocation of credentials used to authenticate with LLM providers. In a multi-provider AI system, each provider may require multiple API keys (for different applications, environments, or rate limit tiers). Centralized key management ensures that keys are never exposed in logs, client-side code, or version control, and that key rotation and revocation happen smoothly across the entire fleet of services.

## Core Concepts

- **Key Vault:** A secure store for API keys (Vault, AWS Secrets Manager, Azure Key Vault, or encrypted database).
- **Key Rotation:** Periodic replacement of API keys to limit the blast radius of a leak. Providers may enforce rotation schedules.
- **Per-Key Quotas:** Usage limits assigned to each key (max requests/minute, max tokens/day, cost cap).
- **Key Scoping:** Keys may have different permissions (read-only, write, admin) or be restricted to specific models.
- **Key Pooling:** Multiple keys for the same provider, rotated or load-balanced to increase aggregate rate limits.
- **Audit Trail:** Log of which key was used for each request, when it was created/rotated/revoked.
- **Environment Isolation:** Separate keys for development, staging, and production environments.

## When To Use

- Any production system using paid LLM APIs (protect credentials at all costs).
- Multi-provider setups requiring centralized credential management.
- Teams needing fine-grained usage attribution (per application, per team, per user).
- Compliance-mandated environments requiring audit trails for API access.

## When NOT To Use

- Local development with free/limited APIs that don't require keys.
- Single-user, single-provider hobby projects — environment variables suffice.
- When the provider's authentication mechanism is not key-based (OAuth, managed identity).

## Best Practices

- **Never store keys in code, config files, or environment variables** committed to version control. Use a secrets manager.
- **Encrypt keys at rest** and in transit. Use the secrets manager's built-in encryption, not custom AES.
- **Implement key rotation automation.** Schedule rotations (every 30-90 days) and validate new keys before removing old ones.
- **Use a separate key per application or environment.** A leak in one app shouldn't compromise all apps.
- **Monitor key usage anomalies.** Sudden spikes may indicate a compromised key. Set up alerts.

## Architecture Guidelines

- The gateway fetches keys from the vault **at startup and caches them** (in-memory with TTL). Avoid vault calls on the request path.
- Implement a **key refresh mechanism** that detects rotation (via TTL expiry or webhook) and reloads keys without restarting.
- For key pooling, use a **round-robin or least-used selection** strategy across available keys.
- Store **key metadata** alongside the key value: provider, environment, quota limits, expiry date, owner, and allowed models.
- In Laravel, use the **config system with encrypted storage** as a lightweight alternative to a full vault for smaller deployments.

## Performance Considerations

- Vault reads add 10-50ms latency. Cache keys aggressively with a TTL of 5-15 minutes.
- Key rotation should be **event-driven, not time-based.** Rotate on key expiry notifications or security events.
- For high-throughput systems, use **local memory cache** for keys with periodic refresh from the vault.
- Key pooling with 10+ keys requires efficient selection to avoid O(n) scans. Use an index of available keys.

## Security Considerations

- **Compromised key response:** Have a runbook for key compromise — immediate revocation, audit log review, and rotation of all keys in the same vault.
- **Key leak detection:** Scan code repositories, logs, and error messages for accidental key exposure.
- **Least privilege:** Each key should have the minimum permissions needed (e.g., read-only models, no fine-tuning access).
- **Revocation propagation:** When a key is revoked, the change must propagate to all gateway instances within seconds (not minutes).
- **Audit log integrity:** Key access logs must be append-only and immutable for compliance.

## Common Mistakes

- Hardcoding API keys in source code and committing to git.
- Sharing a single production key across development and staging environments.
- Not setting usage quotas — an application with a bug can burn through the monthly budget in minutes.
- Caching keys without TTL — a rotated key continues to be used until the cache is cleared.
- Logging request bodies that contain API keys in headers or authentication fields.

## Anti-Patterns

- **Keys in .env Files:** `.env` files committed to shared repositories or backed up to cloud storage are a leak vector.
- **One Key to Rule Them All:** A single key with full access used everywhere. Implement key scoping and separation.
- **Manual Rotation:** Relying on humans to rotate keys every 90 days. Automate with cron jobs or vault schedules.
- **Key Hoarding:** Keeping expired or unused keys in the vault. Regularly audit and revoke unused keys.
- **Client-Side Keys:** Embedding API keys in mobile apps or SPAs. Use a gateway as a proxy.

## Examples

### Key Vault Adapter
```php
interface KeyVault {
    public function get(string $keyId): ?ProviderKey;
    public function rotate(string $keyId): ProviderKey;
    public function revoke(string $keyId): void;
    public function list(): array;
}

class VaultAdapter implements KeyVault {
    public function __construct(private Cache $cache, private VaultClient $vault) {}

    public function get(string $keyId): ?ProviderKey {
        return $this->cache->remember("key:$keyId", 300, fn() =>
            $this->vault->read("secret/ai-keys/$keyId")
        );
    }
}
```

### Key Pooling
```php
class KeyPool {
    /** @param ProviderKey[] $keys */
    public function __construct(private array $keys) {}

    public function next(): ProviderKey {
        $key = $this->keys[array_rand($this->keys)]; // or round-robin
        if ($key->isQuotaExhausted()) {
            return $this->next(); // skip exhausted keys
        }
        return $key;
    }
}
```

## Related Topics

- ku-01 (AI Gateway Fundamentals): The gateway that consumes these keys.
- ku-05 (Observability & Monitoring): Monitoring key usage and anomalies.
- ai-safety-security/ku-03: Secrets management and injection prevention.
- cost-management-observability/ku-01: Key-level cost tracking.

## AI Agent Notes

- When asked to implement key management, first check existing secrets infrastructure (Vault, AWS, Azure) before building custom.
- For key-related issues, check: cache TTL (stale keys), vault connectivity, and quota exhaustion.
- Never include API keys in any generated code, examples, or test fixtures.
- Prefer reading the key vault adapter interface before the implementation — the abstraction reveals the security model.

## Verification

- [ ] API keys are stored in a secrets manager, not in code or config files.
- [ ] Keys are encrypted at rest and in transit.
- [ ] Key rotation is automated with configurable schedule (default 90 days).
- [ ] Separate keys exist for each environment (dev, staging, production).
- [ ] Per-key usage quotas are configured and enforced.
- [ ] Key usage is logged for audit trails.
- [ ] Key revocation propagates to all gateway instances with <10s delay.
