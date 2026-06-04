# Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Security & Identity Engineering |
| Subdomain | Secrets Management |
| Knowledge Unit | HashiCorp Vault Integration |
| Difficulty Level | Advanced |
| Last Updated | 2026-06-02 |
| Status | Maturing |

---

## Overview

HashiCorp Vault integration in Laravel stores and retrieves secrets dynamically rather than relying on `.env` files. Vault manages secrets (API keys, database credentials, certificates) with access policies, audit logging, automatic rotation, and lease-based expiration. Primary integration packages: `deepdigs/laravel-vault-suite` (comprehensive) and `thetribeofdan/laravel_vault` (simpler). Vault supports multiple auth methods (token, Kubernetes, AppRole, LDAP) and secret engines (KV, database, PKI, transit, AWS).

---

## Core Concepts

- **Vault Server**: Centralized secrets management service. Stores, controls access to, and rotates secrets.
- **Auth Methods**: How the application authenticates to Vault — token mode (static token), AppRole (role ID + secret ID), Kubernetes (service account), LDAP.
- **Secret Engine**: KV (static key-value secrets), Database (dynamic database credentials), PKI (TLS certificates), Transit (encryption-as-a-service).
- **Lease**: Temporary credentials with automatic expiry and renewal. Database engine creates dynamic credentials with configurable TTL.
- **Policy**: Vault access control — defines which paths an authenticated application can read/write/list.
- **Token Mode vs File Mode**: Token mode authenticates via a long-lived token. File mode uses a JSON file with Vault credentials.

---

## When To Use

- Production deployments with centralized secrets management
- Compliance requirements (audit trail for secret access, rotation policies)
- Dynamic credentials (database passwords that auto-rotate, PKI certificates)
- Multi-service/microservice architecture where secrets must be shared across services

## When NOT To Use

- Single-server deployments — `.env` with proper permissions is sufficient
- Small teams without Vault operations expertise
- Development environments (Vault overhead is unnecessary)
- When secret rotation is not required

---

## Best Practices

- **Start with `.env` for Simplicity**: Only introduce Vault when operational complexity is justified.
- **Use Dynamic Database Credentials**: Vault's database engine can generate per-service database credentials with automatic rotation.
- **Policy of Least Privilege**: Each application/service gets Vault policies granting access only to the secrets it needs.
- **Lease Renewal**: Implement lease renewal for dynamic secrets. Monitor expiry.
- **Audit Vault Access**: Enable Vault audit logging. Monitor for unexpected secret access patterns.

---

## Architecture Guidelines

- Install vault client package: `deepdigs/laravel-vault-suite` or `thetribeofdan/laravel_vault`
- Configure Vault address, auth method, and path prefix in app config
- Map Vault secrets to Laravel config values at boot time (service provider)
- Use AppRole auth for production workloads (machine-to-machine auth)
- Use token auth for development/simple setups
- Cache Vault secrets in Laravel cache with short TTL to reduce Vault load

---

## Performance Considerations

- Vault reads add 10-50ms HTTP round-trip per secret
- Cache secrets in memory/Redis with cache TTL (5-60 minutes)
- Batch secret reads where possible (single Vault request with multiple paths)
- Connection pooling: reuse Vault HTTP connections

---

## Security Considerations

- **Authentication Token**: The Vault auth token is a secret itself — store in environment variable, not in code.
- **Secrets in Memory**: Vault secrets loaded into application memory are as sensitive as env vars — secure memory dumps.
- **Lease Expiry**: Dynamic credentials expire. If the lease expires mid-request, the application loses access. Implement graceful handling.
- **Audit Trail**: Vault provides access logs. Correlate with application logs for incident response.

---

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Vault for everything, even simple config | Over-engineering | Unnecessary latency and complexity | Use `.env` for non-secret configuration; Vault for actual secrets |
| Not caching Vault secrets | Direct Vault read on every request | 50ms+ added to every request | Cache secrets with appropriate TTL |
| Vault token in version control | Convenience | Token exposed to all developers | Use environment variable or CI/CD secrets for the token |
| No lease renewal handling | Static credential mindset | Application loses access when dynamic credentials expire | Implement lease renewal or short-TTL caching |

---

## Anti-Patterns

- **Hardcoding Vault path in controllers**: Centralize in service provider — change path in one place
- **Sharing Vault tokens across environments**: Separate Vault policies per environment
- **No fallback when Vault is down**: Application should have cached secrets or graceful degradation

---

## Examples

**Laravel Vault Suite configuration:**
```php
// config/vault.php
return [
    'address' => env('VAULT_ADDR', 'https://vault.example.com:8200'),
    'token' => env('VAULT_TOKEN'),
    'prefix' => env('VAULT_PREFIX', 'secret/data/laravel'),
    'cache_ttl' => env('VAULT_CACHE_TTL', 300), // 5 minutes
];
```

**Loading secrets in service provider:**
```php
// AppServiceProvider::boot()
public function boot(): void
{
    if (app()->environment('production')) {
        $vault = app(VaultService::class);
        
        config([
            'services.stripe.secret' => $vault->get('stripe/secret_key'),
            'services.sendgrid.api_key' => $vault->get('sendgrid/api_key'),
        ]);
    }
}
```

---

## Related Topics

- .env management and APP_KEY
- Encrypted config values
- API key rotation
- Secret scanning

---

## AI Agent Notes

- Vault integration is maturing but not yet standard in the Laravel ecosystem. Evaluate operational readiness before adopting.
- The most common use case is dynamic database credentials — Vault generates temporary DB passwords with automatic rotation.
- For small teams, `.env` with good practices is often more practical than Vault.

---

## Verification

- [ ] Vault server operational and reachable from application
- [ ] Vault client package configured (deepdigs/laravel-vault-suite or similar)
- [ ] Auth method configured (AppRole for production, token for dev)
- [ ] Vault secrets mapped to Laravel config in service provider
- [ ] Secrets cached with appropriate TTL (not read on every request)
- [ ] Lease renewal implemented for dynamic credentials
- [ ] Vault audit logging enabled and monitored
- [ ] Graceful fallback when Vault is unavailable
- [ ] Vault token/credentials stored securely (environment variable, not config file)
