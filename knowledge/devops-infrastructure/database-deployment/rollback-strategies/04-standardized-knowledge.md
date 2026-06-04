# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** rollback-strategies
**Difficulty:** Advanced
**Category:** Database Deployment
**Last Updated:** 2026-06-03

# Overview

Rollback strategies for Laravel database deployments define how to safely revert schema changes when a deployment fails. The core challenge is that code rollback is instant (symlink swap) but database rollback is complex (data may have been transformed or deleted). Strategies include reversible migrations, expand-migrate-contract patterns, and automated rollback scripts.

This topic exists because database rollback is fundamentally different from code rollback — you cannot "un-delete" data. The engineering value is ensuring every deployment has a tested, safe database rollback path.

# When To Use

- All production deployments with database changes
- Zero-downtime deployment workflows
- CI/CD pipelines with automated rollback

# When NOT To Use

- Read-only databases
- Ephemeral environments where data loss is acceptable

# Core Concepts

- **Reversible Migration** — `up` and `down` methods that can undo schema changes
- **Expand-Migrate-Contract** — Three-phase pattern for safe destructive changes
- **Checkpoint Migrations** — Savepoints before high-risk schema changes
- **Automated Rollback** — CI/CD pipeline rollback trigger for database changes

# Best Practices

**Always Implement down().** Every migration should have a tested `down` method.

**Test Rollback in Staging.** Run `migrate:rollback` in staging to verify it works.

**Automate Rollback in CI/CD.** Include rollback step in deployment pipeline.

**Document Irreversible Changes.** Some changes (data pruning) are irreversible by design. Document and warn before deployment.

# Related Topics

**Prerequisites:** Laravel migrations, deployment basics
**Closely Related:** Zero-Downtime Migration, Automated Migration Deployment, Database Migration CI
**Advanced Follow-Ups:** Online Schema Change, Point-in-Time Recovery
