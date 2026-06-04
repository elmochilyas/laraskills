# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 08-environment-secrets-management
**Knowledge Unit:** vault-secrets-management
**Difficulty:** Advanced
**Category:** Secrets Management
**Last Updated:** 2026-06-03

# Overview

Vault secrets management covers third-party vault integration (Doppler, HashiCorp Vault, AWS Secrets Manager) for Laravel, `.env` lifecycle patterns, `config:cache` implications, CI secret injection, and secret rotation strategies. Vaults replace flat `.env` files with centralized, audited, access-controlled secret storage.

Vault integration exists because `.env` files scale poorly across teams, environments, and rotating secrets. The engineering value is centralized secret management with access audit trails, automated rotation, and environment separation.

# When To Use

- Multiple environments requiring different secrets
- Compliance requirements for secret access auditing
- Teams larger than 5 developers
- Automated secret rotation requirements

# When NOT To Use

- Single developer projects
- Simple applications with few secrets
- Teams without infrastructure to manage vault service

# Core Concepts

- **Doppler** — SaaS vault with native Laravel integration via SDK
- **HashiCorp Vault** — Self-hosted vault with dynamic secrets
- **AWS Secrets Manager** — AWS-native secret storage with automatic rotation
- **Secret Injection** — Injecting secrets at deploy time via CI/CD or runtime
- **config:cache Interplay** — Vault fetch timing relative to config cache

# Best Practices

**Use SDK Over CLI.** Use vault SDKs for runtime secret fetching rather than CLI calls in deployment.

**Cache Fetched Secrets.** Cache vault responses in Laravel cache to avoid latency on every request.

**Plan for Vault Outages.** Application should degrade gracefully if vault is unreachable, using cached secrets.

**Audit Vault Access.** Review vault access logs regularly for unauthorized access attempts.

# Related Topics

**Prerequisites:** Environment & Secret Management basics
**Closely Related:** CI/CD Secrets, AWS Secrets Manager, Doppler
**Advanced Follow-Ups:** Dynamic Secrets, Zero-Trust Architecture, Secretless Architecture
