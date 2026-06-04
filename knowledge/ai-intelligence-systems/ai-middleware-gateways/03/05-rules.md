---
id: ku-03
title: "API Key Management - Rules"
subdomain: "ai-middleware-gateway"
ku-type: "security"
date-created: "2026-06-02"
---

## Rules for API Key Management

### R1: Never store API keys in source code, .env files committed to git, or config files in version control
- **Category:** Security
- **Rule:** Store all API keys in a dedicated secrets manager (Vault, AWS Secrets Manager, Azure Key Vault) and inject them at runtime; scan repositories periodically for accidentally committed keys.
- **Reason:** Keys in source code or committed `.env` files are exposed to anyone with repository access, including CI/CD logs, deployment artifacts, and historical git blames.
- **Bad Example:** An `.env.example` file containing placeholder keys `OPENAI_API_KEY=sk-your-key-here` that gets committed and used as-is.
- **Good Example:** Production keys fetched from Vault at application boot via a `VaultServiceProvider`; `.env` contains only development-mock keys.
- **Exceptions:** None — this is a non-negotiable security requirement.
- **Consequences of Violation:** API key leakage leading to unauthorized LLM usage, unexpected bills (potentially $10K+), and data exposure through attacker-controlled API calls.

### R2: Implement automatic key rotation on a maximum 90-day schedule
- **Category:** Security
- **Rule:** Configure automated key rotation at least every 90 days, using the secrets manager's built-in rotation (if available) or a scheduled job; never rotate keys manually.
- **Reason:** The longer a key exists, the higher the probability of undetected exposure. Manual rotation is unreliable — it's skipped during busy periods, and expired keys cause incidents.
- **Bad Example:** API keys that haven't been rotated in 18 months because "it's too much work to update all services."
- **Good Example:** A `php artisan keys:rotate` command that generates new keys, validates them against the provider, updates all services, and revokes old keys.
- **Exceptions:** Provider-managed keys with forced rotation schedules.
- **Consequences of Violation:** Key compromise window extends indefinitely; provider-enforced rotation without automation causes unexpected service disruption.

### R3: Cache API keys in memory with TTL, never fetch from the vault on every request
- **Category:** Performance
- **Rule:** Fetch API keys from the secrets manager at application startup and cache them in-memory with a 5-15 minute TTL; implement a cache invalidation mechanism for emergency revocation.
- **Reason:** Secrets manager API calls add 5-50ms latency. Fetching keys on every request adds unacceptable overhead to every AI call. Caching reduces overhead to microseconds per lookup.
- **Bad Example:** A key retrieval function that calls `$vault->getSecret()` for every streaming request, adding 50ms overhead to each TTFT.
- **Good Example:** A singleton `KeyManager` that loads all keys into an in-memory array at boot with a refresh schedule.
- **Exceptions:** Compliance requirements that mandate real-time key validation.
- **Consequences of Violation:** Every AI request incurs 5-50ms additional latency from vault calls, adding 10-25% overhead to the request path for no security benefit.
