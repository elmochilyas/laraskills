# Decomposition: Vault Secrets Management

## Topic Overview
Environment and secret management for Laravel across dev/staging/production. Covers `.env` patterns, vault integration (Doppler, Vault, AWS SM), `config:cache` implications, CI secret injection, and secret rotation strategies.

## Decomposition Strategy
1. **`.env` lifecycle** — creation, distribution, rotation, backup
2. **`config:cache` mechanics** — env resolution timing, null returns, caching pitfalls
3. **Vault integration** — Doppler, HashiCorp Vault, AWS Secrets Manager — patterns per tool
4. **CI/CD secret injection** — GitHub Secrets, GitLab Variables, masked variables
5. **Secret rotation** — DB password rotation, APP_KEY management, API key renewal
6. **Platform-specific management** — Forge, Vapor, K8s External Secrets Operator

## Proposed Folder Structure
```
environment-secrets-management/
├── vault-secrets-management/
│   ├── 02-knowledge-unit.md
│   ├── 03-decomposition.md
│   ├── 04-standardized-knowledge.md
│   └── templates/
│       ├── .env.example
│       ├── doppler-integration.php
│       └── secrets-manager-bootstrap.php
```

## Knowledge Unit Inventory
- KU-021: Vault Secrets Management — env/config/secret management patterns
- (Already has 02+03: Environment & Secret Management — base KU)

## Dependency Graph
- **Prerequisites:** Laravel config system, .env mechanics
- **Related:** Forge (env dashboard), Vapor (env push/pull), CI/CD (secret injection), K8s (External Secrets)
- **Extends:** Hardcoded secrets → .env files → vault-managed → automatic rotation

## Boundary Analysis
- **In scope:** .env management, config:cache, vault integration, CI secrets, rotation, platform-specific management
- **Out of scope:** Application-level encryption (Laravel's built-in encryption), network-level secrets (TLS certs)

## Future Expansion Opportunities
- Dynamic secrets with HashiCorp Vault for DB credentials
- Git-secret scanning integration in CI/CD
- Secrets management for microservice architectures
- Zero-trust secret delivery patterns
