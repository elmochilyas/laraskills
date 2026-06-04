# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | Zero-Downtime API Key Rotation |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

API key rotation is the process of replacing an existing key with a new one without service disruption. Zero-downtime rotation uses a grace period where both the old and new keys are valid simultaneously, allowing clients to migrate from the old key to the new key. The primary tool is `laravel-locksmith` (`brainlet-ali/laravel-locksmith`), which provides Artisan commands for key rotation with dual-validity grace periods. Locksmith supports recipes for common services (AWS IAM, Twilio) and key pools for services without rotation APIs.

---

## Core Concepts

- **Grace Period**: A time window where both the old and new key are valid. Clients migrate during this window. After expiry, only the new key is valid.
- **Dual-Validity Validation**: Two keys checked for authentication. Old key allowed until grace period expires.
- **Key Generation**: Issue new key alongside existing key. Do not replace immediately (zero-downtime).
- **Key Revocation**: After grace period, the old key is revoked. Any client still using the old key loses access.
- **Key Pool**: A set of pre-generated keys. Used when the service doesn't support API-based key rotation — rotate by swapping the active key in the pool.

---

## When To Use

- Any production service using API keys for external service authentication
- Compliance requirements (periodic key rotation)
- Security incidents (key compromise requires immediate rotation)
- Multi-tenant applications where keys are per-tenant

## When NOT To Use

- Single-service applications with infrequent key changes (manual rotation is acceptable)
- Short-lived keys (expiring in hours/days — no grace period needed)
- Keys managed by external providers that handle rotation automatically

---

## Best Practices

- **Always Use Grace Periods**: Even for emergency rotations, a short grace period (minutes) prevents total service disruption.
- **Automate Rotation**: Schedule key rotation as a recurring task. Do not rely on manual rotation.
- **Monitor Key Usage After Rotation**: Track which clients are still using the old key. Alert if migration is incomplete before grace period expiry.
- **Rollback Plan**: If the new key has issues, have a process to reactivate the old key or generate another new key.
- **Audit Key Changes**: Log every key rotation event — who initiated, which key was replaced, when grace period expires.

---

## Architecture Guidelines

- Install `brainlet-ali/laravel-locksmith` or implement custom key rotation service
- Dual-validity: store two keys (current and previous) with expiry for the previous
- Grace period: configurable per service (hours for regular rotation, minutes for emergency)
- Key pool: pre-generate N keys; rotate by activating the next key in sequence
- Rotation command: `php artisan locksmith:rotate <service>` — generates new key, starts grace period

---

## Performance Considerations

- Key validation: two lookups during grace period (old + new) — negligible overhead
- After grace period: single key lookup
- Key pools: pre-generation is done offline — no runtime impact

---

## Security Considerations

- **Grace Period Length**: Too long exposes the old key longer. Too short risks client disruption. Standard: 24 hours for regular, 1 hour for emergency.
- **Key Storage**: Rotated keys must be stored as securely as active keys (encrypted at rest, Vault, or environment-specific).
- **Compromise Response**: For key compromise, shorten grace period. Notify clients to update immediately.
- **Audit Trail**: Every rotation is a security event. Log with timestamp, initiator, service, and expected migration window.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No grace period | Assuming all clients update immediately | Service disruption for clients still using old key | Always use a grace period with dual-validity |
| Too short grace period | Security-first mindset | Clients with cached keys experience downtime | Standard: 24 hours; emergency: 1 hour minimum |
| Not monitoring key usage | No migration tracking | Old key expires, clients fail silently | Track old key usage; alert on active usage before expiry |
| Manual rotation | No automation | Rotation is skipped or forgotten | Schedule rotation as automated task |

---

## Anti-Patterns

- **Immediate key replacement**: Guarantees service disruption for clients with cached keys
- **No rollback plan**: If new key has issues, service is down until old key is restored
- **Same key across environments**: Compromise in dev affects production — use separate keys per environment

---

## Examples

**Locksmith recipe configuration:**
```php
// config/locksmith.php
'recipes' => [
    'stripe' => [
        'service' => \App\Services\StripeService::class,
        'key_retrieval_method' => 'getApiKey',
        'key_update_method' => 'setApiKey',
        'grace_period' => 1440, // 24 hours in minutes
    ],
],
```

**Dual-validity key check:**
```php
// Service with dual-validity
class ApiKeyValidator
{
    public function validate(string $key): bool
    {
        return $key === config('services.current_api_key')
            || $key === config('services.previous_api_key');
    }
    
    public function isPreviousKey(string $key): bool
    {
        $expiresAt = config('services.previous_key_expires_at');
        return $key === config('services.previous_api_key')
            && now()->lessThan($expiresAt);
    }
}
```

---

## Related Topics

- Vault integration (HashiCorp Vault)
- Encrypted config values
- Secret scanning
- Envelope encryption (DEK/KEK)

---

## AI Agent Notes

- Key rotation with grace periods is standard practice for production API credentials. If the project has external API keys, rotation should be scheduled.
- Locksmith is the primary package but has limited adoption — evaluate reliability before relying on it for critical infrastructure.
- For services without rotation APIs, key pools are a viable alternative.

---

## Verification

- [ ] Key rotation process documented for each external service
- [ ] Grace period configured for each rotation (dual-validity)
- [ ] Rotation automated (scheduled task or CI/CD step)
- [ ] Key usage monitored — alerts for old key usage before grace period expiry
- [ ] Rollback plan documented
- [ ] Key changes logged (who, what, when, grace period expiry)
- [ ] Separate keys per environment
- [ ] Emergency rotation process documented (shorter grace period)
- [ ] Key pool implemented for services without rotation API support
