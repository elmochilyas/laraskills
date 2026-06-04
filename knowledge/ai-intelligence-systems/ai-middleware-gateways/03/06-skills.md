# Skill: Manage API Keys Securely

## Purpose
Securely store, rotate, distribute, and revoke LLM provider API keys using a secrets manager with automated rotation, per-key quotas, centralized caching, and audit logging — preventing key leakage and limiting blast radius.

## When To Use
- Any production system using paid LLM APIs (protect credentials at all costs)
- Multi-provider setups requiring centralized credential management
- Teams needing fine-grained usage attribution (per application, per team, per user)
- Compliance-mandated environments requiring audit trails for API access

## When NOT To Use
- Local development with free/limited APIs that don't require keys
- Single-user, single-provider hobby projects — environment variables suffice
- When the provider's authentication mechanism is not key-based (OAuth, managed identity)

## Prerequisites
- KU-01 (AI Gateway Fundamentals) — understanding of gateway key consumption
- Secrets manager (Vault, AWS Secrets Manager, Azure Key Vault)
- Provider accounts with API key generation capability
- Redis or in-memory cache for key caching

## Inputs
- Provider API keys (one per provider per environment)
- Key metadata (provider, environment, quota limits, expiry date, allowed models)
- Key rotation schedule (default 90 days)
- Key pool configuration (multiple keys per provider for load distribution)
- Emergency revocation procedure

## Workflow
1. **Store keys in secrets manager**: Write all API keys to the secrets manager with metadata (provider, environment, owner, allowed models, quota limits, expiry). Never store keys in code, config files, or .env files committed to git.
2. **Implement key vault adapter**: Create a `KeyVault` interface with `get(keyId)`, `rotate(keyId)`, `revoke(keyId)`, `list()`. Implement for your chosen secrets manager (Vault, AWS, Azure).
3. **Cache keys in memory**: At application startup, fetch all keys from the vault and cache in-memory with a 5-15 minute TTL. Implement a refresh mechanism for emergency revocation.
4. **Configure key pooling**: For providers with multiple keys (for higher rate limits), implement a `KeyPool` with round-robin or least-used selection. Skip keys that have exhausted their quota.
5. **Implement per-key quota enforcement**: Track usage per key (requests, tokens, cost). Enforce limits before dispatching requests. Alert when a key approaches its quota.
6. **Automate key rotation**: Schedule key rotation every 90 days (or as required by provider). The rotation process: generate new key → validate against provider → update vault → wait for cache TTL expiry → revoke old key.
7. **Log key usage**: Log which key was used for each request, including key ID (not the key value), provider, timestamps, and usage metrics.
8. **Implement key revocation**: Create a revocation procedure that immediately invalidates a compromised key: update vault → set short cache TTL (30s) → force cache refresh on all instances → verify old key is no longer used.
9. **Monitor key health**: Set up alerts for: quota exhaustion, key expiry within 30 days, unusual usage spikes (potential compromise), failed rotation attempts.
10. **Audit key access**: Regularly review key inventory, revoke unused keys, and verify that no keys are hardcoded or exposed in repositories (automated scanning).

## Validation Checklist
- [ ] API keys are stored in a secrets manager, not in code or config files
- [ ] Keys are encrypted at rest and in transit
- [ ] Key rotation is automated with configurable schedule (default 90 days)
- [ ] Separate keys exist for each environment (dev, staging, production)
- [ ] Per-key usage quotas are configured and enforced
- [ ] Key usage is logged for audit trails
- [ ] Key revocation propagates to all gateway instances with <10s delay

## Common Failures
- **Key leaked through CI/CD logs**: Keys passed as build args or environment variables in CI/CD pipeline logs. Fix: use secrets manager in CI/CD, never echo or log keys.
- **Rotation causes service disruption**: New key doesn't match provider's expected format or permissions. Fix: validate new keys against the provider before revoking old ones.
- **Cache staleness after revocation**: Old key cached in memory for up to 15 minutes. Fix: implement a force-refresh webhook or short-circuit TTL on revocation events.
- **Key pool imbalance**: One key in the pool exhausts its quota while others have capacity. Fix: use least-used selection strategy and track quota exhaustion per key.
- **Quota exceeded on expensive model**: A key with shared quota across all models gets exhausted by cheap model usage. Fix: enforce model-specific quotas per key.

## Decision Points
- **Secrets manager choice**: Vault for self-hosted (full control, free). AWS Secrets Manager for AWS-native (managed, auto-rotation). Azure Key Vault for Azure-native.
- **Cache TTL**: 5 minutes for fast revocation propagation. 15 minutes to reduce vault load. Use 5 minutes if rapid revocation is needed.
- **Single key vs. key pool**: Single key per provider for simplicity. Key pool (multiple keys) when exceeding a single key's rate limit or for load distribution.

## Performance Considerations
- Vault read: 10-50ms. Cache aggressively with in-memory storage — key lookup should be <1ms
- Key rotation: event-driven (on expiry or security event), not time-based polling
- Key pool selection: O(1) with round-robin, O(n) with quota-aware selection
- Cache refresh: scheduled TTL expiry, not per-request vault calls
- Memory: keys cached in memory, typically <10KB total for all keys

## Security Considerations
- Never log API keys, even masked — key fragments can be used for brute force
- Use separate keys per environment — a dev key leak shouldn't affect production
- Implement least privilege: each key should have minimum permissions (specific models, read-only if applicable)
- Revocation must propagate to all gateway instances within seconds
- Git-secret scanning: use tools (truffleHog, git-secrets) to detect committed keys
- Runbook for key compromise: immediate revocation → audit log review → rotate all keys in the same vault

## Related Rules
- Never store API keys in source code, .env files committed to git, or config files in version control
- Implement automatic key rotation on a maximum 90-day schedule
- Cache API keys in memory with TTL, never fetch from the vault on every request

## Related Skills
- Skill: Set Up an AI Gateway with Routing, Caching, and Failover (ku-01)
- Skill: Load Balance Across AI Providers (ku-02)
- Skill: Monitor and Observe AI Gateway Performance (ku-05)

## Success Criteria
- Zero API keys committed to version control or exposed in logs
- Key rotation completes automatically within schedule (every 90 days) with zero downtime
- Key revocation propagates to all gateway instances within 10 seconds
- Per-key quotas prevent any single application from exceeding budget
- Key usage is fully auditable (which key, which request, which provider, when)
- Compromised key response (detect → revoke → rotate) completes within 5 minutes
- 100% of production keys are stored in secrets manager with encryption at rest