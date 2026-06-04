# Knowledge Unit: API Key Management

## Metadata

- **ID:** ku-03
- **Subdomain:** AI Middleware & Gateways
- **Slug:** api-key-management
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

API key management encompasses the secure storage, rotation, distribution, and revocation of credentials used to authenticate with LLM providers. In a multi-provider AI system, each provider may require multiple API keys (for different applications, environments, or rate limit tiers). Centralized key management ensures that keys are never exposed in logs, client-side code, or version control, and that key rotation and revocation happen smoothly across the entire fleet of services.

## Core Concepts

- **Key Vault:** A secure store for API keys (Vault, AWS Secrets Manager, Azure Key Vault, or encrypted database).
- **Key Rotation:** Periodic replacement of API keys to limit the blast radius of a leak. Providers may enforce rotation schedules.
- **Per-Key Quotas:** Usage limits assigned to each key (max requests/minute, max tokens/day, cost cap).
- **Key Scoping:** Keys may have different permissions (read-only, write, admin) or be restricted to specific models.
- **Key Pooling:** Multiple keys for the same provider, rotated or load-balanced to increase aggregate rate limits.
- **Audit Trail:** Log of which key was used for each request, when it was created/rotated/revoked.
- **Environment Isolation:** Separate keys for development, staging, and production environments.

## Mental Models

- **Key Vault:** A secure store for API keys (Vault, AWS Secrets Manager, Azure Key Vault, or encrypted database).
- **Key Rotation:** Periodic replacement of API keys to limit the blast radius of a leak. Providers may enforce rotation schedules.
- **Per-Key Quotas:** Usage limits assigned to each key (max requests/minute, max tokens/day, cost cap).


## Internal Mechanics

The internal mechanics of API Key Management follow established patterns within the AI Middleware & Gateways domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Never store keys in code, config files, or environment variables** committed to version control. Use a secrets manager.
- **Encrypt keys at rest** and in transit. Use the secrets manager's built-in encryption, not custom AES.
- **Implement key rotation automation.** Schedule rotations (every 30-90 days) and validate new keys before removing old ones.
- **Use a separate key per application or environment.** A leak in one app shouldn't compromise all apps.
- **Monitor key usage anomalies.** Sudden spikes may indicate a compromised key. Set up alerts.

## Patterns

- **Never store keys in code, config files, or environment variables** committed to version control. Use a secrets manager.
- **Encrypt keys at rest** and in transit. Use the secrets manager's built-in encryption, not custom AES.
- **Implement key rotation automation.** Schedule rotations (every 30-90 days) and validate new keys before removing old ones.
- **Use a separate key per application or environment.** A leak in one app shouldn't compromise all apps.
- **Monitor key usage anomalies.** Sudden spikes may indicate a compromised key. Set up alerts.

## Architectural Decisions

- The gateway fetches keys from the vault **at startup and caches them** (in-memory with TTL). Avoid vault calls on the request path.
- Implement a **key refresh mechanism** that detects rotation (via TTL expiry or webhook) and reloads keys without restarting.
- For key pooling, use a **round-robin or least-used selection** strategy across available keys.
- Store **key metadata** alongside the key value: provider, environment, quota limits, expiry date, owner, and allowed models.
- In Laravel, use the **config system with encrypted storage** as a lightweight alternative to a full vault for smaller deployments.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Vault reads add 10-50ms latency. Cache keys aggressively with a TTL of 5-15 minutes.
- Key rotation should be **event-driven, not time-based.** Rotate on key expiry notifications or security events.
- For high-throughput systems, use **local memory cache** for keys with periodic refresh from the vault.
- Key pooling with 10+ keys requires efficient selection to avoid O(n) scans. Use an index of available keys.

## Production Considerations

- **Compromised key response:** Have a runbook for key compromise â€” immediate revocation, audit log review, and rotation of all keys in the same vault.
- **Key leak detection:** Scan code repositories, logs, and error messages for accidental key exposure.
- **Least privilege:** Each key should have the minimum permissions needed (e.g., read-only models, no fine-tuning access).
- **Revocation propagation:** When a key is revoked, the change must propagate to all gateway instances within seconds (not minutes).
- **Audit log integrity:** Key access logs must be append-only and immutable for compliance.

## Common Mistakes

- Hardcoding API keys in source code and committing to git.
- Sharing a single production key across development and staging environments.
- Not setting usage quotas â€” an application with a bug can burn through the monthly budget in minutes.
- Caching keys without TTL â€” a rotated key continues to be used until the cache is cleared.
- Logging request bodies that contain API keys in headers or authentication fields.

## Failure Modes

- **Keys in .env Files:** `.env` files committed to shared repositories or backed up to cloud storage are a leak vector.
- **One Key to Rule Them All:** A single key with full access used everywhere. Implement key scoping and separation.
- **Manual Rotation:** Relying on humans to rotate keys every 90 days. Automate with cron jobs or vault schedules.
- **Key Hoarding:** Keeping expired or unused keys in the vault. Regularly audit and revoke unused keys.
- **Client-Side Keys:** Embedding API keys in mobile apps or SPAs. Use a gateway as a proxy.

## Ecosystem Usage

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

## Related Knowledge Units

- ku-01 (AI Gateway Fundamentals): The gateway that consumes these keys.
- ku-05 (Observability & Monitoring): Monitoring key usage and anomalies.
- ai-safety-security/ku-03: Secrets management and injection prevention.
- cost-management-observability/ku-01: Key-level cost tracking.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

