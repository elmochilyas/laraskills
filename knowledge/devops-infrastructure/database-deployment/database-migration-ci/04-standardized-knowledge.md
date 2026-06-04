# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** database-migration-ci
**Difficulty:** Intermediate
**Category:** Database Deployment
**Last Updated:** 2026-06-03

# Overview

Database Migration in CI covers running Laravel migrations as part of the CI/CD pipeline, ensuring schema changes are tested and applied consistently. Migrations must be idempotent, use `--force`, and handle the timing challenge of new code needing new schema while old code runs simultaneously during zero-downtime deployments.

This topic exists because database schema changes are the highest-risk part of any deployment. The engineering value is catching migration errors in CI before they affect production data.

# When To Use

- Any Laravel project with automated deployments
- Teams practicing CI/CD with database changes
- Multi-environment workflows

# When NOT To Use

- Read-only database applications
- Prototypes without CI/CD

# Core Concepts

- **Forward-Compatible Migrations** — Schema changes that work with both old and new code
- **Migration Timing** — Run before code deploy (ZDD) or during maintenance window
- **CI Test Database** — Isolated database for migration testing in pipeline
- **Migration Locking** — Preventing concurrent migration execution

# Best Practices

**Test Migrations with Production-Like Data Volume.** Small test databases don't catch performance issues in migrations.

**Run Migrations in Staging First.** Apply migrations to staging before production to catch issues.

**Use Migration Lock.** `php artisan migrate --isolated` prevents concurrent migration execution.

**Monitor Migration Duration.** Long-running migrations may need online schema change tools.

# Related Topics

**Prerequisites:** Laravel migrations, CI/CD basics
**Closely Related:** Automated Migration Deployment, Zero-Downtime Migration
**Advanced Follow-Ups:** pt-online-schema-change, gh-ost
