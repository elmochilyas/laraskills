# Anti-Patterns: Vault Secrets Management

## AP-VAULT-001: Vault CLI in Production
**Description:** Running `vault kv get` or `doppler run` in production deployment scripts.
**Consequences:** Every request that reads secrets invokes a subprocess. Latency increases, deployment coupling tightens.
**Remediation:** Use vault SDK for runtime access. Cache secrets. Use CI/CD injection for deploy-time secrets.

## AP-VAULT-002: Vault as Single Point of Failure
**Description:** No fallback when vault is unreachable. Application crashes if vault is down.
**Consequences:** Full application outage during vault maintenance or outage.
**Remediation:** Implement secret caching with fallback. Application should start with last-known-good secrets.

## AP-VAULT-003: Over-Rotation
**Description:** Rotating secrets too frequently without ensuring all consumers can update.
**Consequences:** Application downtime after rotation because secrets changed before all consumers fetched new values.
**Remediation:** Implement dual credential periods. Rotate with staggered consumer update windows.
