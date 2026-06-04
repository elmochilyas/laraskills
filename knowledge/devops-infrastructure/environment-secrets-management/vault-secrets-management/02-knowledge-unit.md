# Vault Secrets Management

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Environment & Secrets Management
- **Knowledge Unit:** Vault Secrets Management
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Vault secrets management covers third-party vault integration (Doppler, HashiCorp Vault, AWS Secrets Manager) for Laravel, `.env` lifecycle patterns, `config:cache` implications, CI secret injection, and secret rotation strategies. Vaults replace flat `.env` files with centralized, audited, access-controlled secret storage for production environments.

---

## Core Concepts

- **Doppler** — SaaS vault with native Laravel integration via SDK, CLI, and secret injection
- **HashiCorp Vault** — Self-hosted vault with dynamic secrets, leasing, and revocation
- **AWS Secrets Manager** — AWS-native secret storage with automatic rotation for RDS credentials
- **Secret Injection** — Injecting secrets at deploy time via CI/CD or at runtime via agent
- **config:cache Interplay** — Vault fetch timing relative to config cache determines when secrets are resolved

---

## Mental Models

- **Vault as Central Nervous System** — All secrets flow through the vault. Applications, CI/CD pipelines, and team members all request secrets from the vault rather than managing their own copies.
- **Dynamic Secrets** — Instead of static passwords, vault can generate short-lived, auto-rotating credentials for databases and services. A breach leaks credentials that expire in minutes.
- **Secret Fetch Timing** — Secrets are fetched either at deploy time (injected into environment) or at runtime (fetched by application). The choice affects security, caching strategy, and vault availability requirements.

---

## Internal Mechanics

When using a vault, the Laravel application or deployment script authenticates with the vault service (via API key, IAM role, OIDC token), requests the required secrets, and either writes them to `.env` at deploy time or caches them in memory at runtime. Doppler's SDK provides a Laravel configuration provider that fetches secrets at boot time and caches them. HashiCorp Vault requires authentication (token, AppRole, Kubernetes auth) before accessing secrets. AWS Secrets Manager uses IAM roles for authentication and returns secrets via API calls.

---

## Patterns

- **Use SDK Over CLI** — Use vault SDKs for runtime secret fetching rather than CLI calls in deployment scripts for better error handling and caching
- **Cache Fetched Secrets** — Cache vault responses in Laravel cache to avoid latency on every request and provide offline fallback
- **Plan for Vault Outages** — Application should degrade gracefully if vault is unreachable, using cached secrets with appropriate warnings
- **Audit Vault Access** — Review vault access logs regularly for unauthorized access attempts

---

## Architectural Decisions

- **Vault vs. .env Files** — Use vault for multiple environments, team access control, and compliance requirements; use `.env` for simple projects and local development
- **Doppler vs. HashiCorp Vault vs. AWS Secrets Manager** — Choose Doppler for Laravel-native SaaS with minimal setup; choose HashiCorp Vault for self-hosted control; choose AWS Secrets Manager for AWS-native integration
- **Deploy-Time vs. Runtime Injection** — Use deploy-time injection for simplicity and FastCGI compatibility; use runtime injection for dynamic secrets and reduced secret exposure in environment variables

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Centralized, audited secret storage | Vault infrastructure cost and maintenance | Must operate or pay for vault service |
| Dynamic secrets with auto-rotation | Secret fetch latency at startup | Application boot time increases |
| Access control per secret | vault service availability dependency | Application unavailable if vault is down (without caching) |
| Environment separation with different permissions | Integration complexity with config:cache | Cached config doesn't reflect runtime vault changes |

---

## Performance Considerations

Vault API calls add latency at application boot time — cache fetched secrets to avoid hitting vault on every request. AWS Secrets Manager has API rate limits (10,000 per second per region). HashiCorp Vault performance depends on cluster size and configuration. Doppler provides local caching for low-latency access. Cached secrets should have a TTL that balances security (freshness) against performance.

---

## Production Considerations

Implement graceful degradation for vault outages — application should continue serving requests with cached secrets. Store vault connection credentials (tokens, IAM roles) securely, separate from the secrets vault manages. Configure monitoring for vault health and access patterns. Implement secret rotation with automated testing. Use short-lived tokens where possible. Review vault access logs regularly for unauthorized access.

---

## Common Mistakes

- **No Cache Layer** — Fetching secrets from vault on every request instead of caching. Adds latency and risks rate limiting.
- **No Degradation Plan** — Application crashes or exposes errors when vault is unreachable. Implement cached fallback with monitoring alerts.
- **Secrets in Config Cache** — Config caching stores resolved secret values. Env changes require cache clear and re-fetch.
- **Over-reliance on Vault** — Making every secret dynamic when many could be static, adding unnecessary complexity and latency.

---

## Failure Modes

- **Vault Outage** — Vault service is unreachable at application startup. Detection: application fails to boot. Mitigation: implement cached secret fallback, monitor vault health.
- **Secret Rotation Breakage** — Automated rotation changes secrets while application holds the old value. Detection: authentication failures after rotation window. Mitigation: verify rotation timing with application deploy schedule, test rotation in staging.
- **Authentication Expiry** — Vault auth token expires without refresh. Detection: secret fetch fails with authentication error. Mitigation: implement token renewal, use short-lived tokens with auto-renewal.
- **Rate Limit Exceeded** — Too many secret fetch requests hit vault rate limits. Detection: secret fetch returns rate limit error. Mitigation: implement local caching, batch secret fetches.

---

## Ecosystem Usage

Doppler is the most popular vault for Laravel due to its native Laravel SDK and simple setup. HashiCorp Vault is common in enterprise Laravel deployments with compliance requirements. AWS Secrets Manager handles RDS credential rotation automatically. Vault integration is typically paired with CI/CD secret injection for pipeline access. The `config:cache` interplay is a critical consideration — vault secrets must be fetched before or during the cache build process.

---

## Related Knowledge Units

### Prerequisites
- Environment & Secret Management basics

### Related Topics
- CI/CD Secrets
- AWS Secrets Manager
- Doppler

### Advanced Follow-up Topics
- Dynamic Secrets
- Zero-Trust Architecture
- Secretless Architecture

---

## Research Notes

Vault provides centralized, audited secret storage for Laravel. Use SDKs over CLI for runtime secret fetching. Cache fetched secrets for performance and offline resilience. Plan for vault outages with graceful degradation. Doppler offers the simplest Laravel integration. HashiCorp Vault provides the most control. AWS Secrets Manager is best for AWS-native deployments. config:cache interplay requires careful consideration of secret fetch timing.
