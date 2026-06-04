# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 08-environment-secrets-management
**Knowledge Unit:** environment-secret-management
**Difficulty:** Intermediate
**Category:** Secrets Management
**Last Updated:** 2026-06-03

# Overview

Environment and secret management encompasses how Laravel applications handle configuration across environments (local, staging, production) and how sensitive values (API keys, database passwords, app keys) are stored, transmitted, and rotated. The Laravel ecosystem supports `.env` files, first-party tools (Forge, Vapor), third-party vaults (Doppler, HashiCorp Vault), and cloud-native solutions (AWS Secrets Manager, SSM Parameter Store).

This topic exists because secret mismanagement is the leading cause of Laravel security incidents. The engineering value is preventing credential exposure through systematic secret lifecycle management.

# When To Use

- All Laravel applications in production
- Multi-environment deployments
- Team-based development workflows

# When NOT To Use

- Single-user personal projects
- Applications with no sensitive credentials

# Core Concepts

- **.env File** — Per-environment configuration, never committed to Git
- **.env.example** — Template with placeholder values for developer reference
- **config:cache** — Compiles configuration into a single file for performance
- **Vault Integration** — Doppler, Vault, AWS Secrets Manager for centralised secrets
- **Secret Rotation** — Periodic credential replacement to limit exposure window
- **CI/CD Secrets** — Platform-specific secret storage for pipeline variables

# Best Practices

**Never Commit .env.** Add `.env` to `.gitignore`. Use `.env.example` for documentation.

**Use config:cache in Production.** All environments except local should run `config:cache`.

**One .env Per Environment.** Don't share `.env` files across environments.

**Rotate APP_KEY.** Rotate application key on security incident or team member departure.

**Audit Secret Access.** Regularly review who has access to production secrets.

# Common Mistakes

**Committed .env Files.** The most common Laravel security incident. Credentials exposed in public repositories.

**Shared .env Across Environments.** Staging shares production `.env`, causing accidental production database modification from staging.

**No config:cache in Production.** Each request parses all config files, degrading performance.

**Hardcoded Secrets in Code.** API keys and passwords in source code that bypass environment variable management.

# Related Topics

**Prerequisites:** Laravel configuration system
**Closely Related:** Vault Secrets Management, CI/CD Secrets, Deployment Strategies
**Advanced Follow-Ups:** Secrets Rotation Automation, Zero-Trust Secret Delivery
**Cross-Domain Connections:** Security Hardening, Compliance Engineering
