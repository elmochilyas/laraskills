# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** automated-migration-deployment
**Difficulty:** Intermediate
**Category:** Database Deployment
**Last Updated:** 2026-06-03

# Overview

Automated migration deployment runs database migrations as part of the CI/CD pipeline. Migrations must be idempotent, run with `--force` to bypass production prompts, and execute in the correct order relative to code deployment. The fundamental tension is that new code needs new schema, but during deployment both old and new code may run simultaneously.

Automated migration deployment exists because manual migration execution is forgotten, skipped, or run in wrong order. The engineering value is ensuring schema and code stay synchronized with zero manual intervention.

# When To Use

- All production deployments with database changes
- CI/CD pipelines where automated steps prevent human error
- Multi-environment workflows requiring consistent migration execution

# When NOT To Use

- Development-only applications without staging/production
- Applications with read-only databases

# Core Concepts

- **Idempotent Migrations** — Safe to run multiple times without error
- **--force Flag** — Suppresses production confirmation in `artisan migrate`
- **Migration Ordering** — Run before symlink swap (for zero-downtime) or after (for maintenance)
- **Migration Tracking** — `migrations` table tracks which migrations have been applied

# Best Practices

**Always Use --force.** Production deploy scripts must include `--force` to skip confirmation prompt.

**Test Migrations in CI.** Run migrations against a test database in CI to catch errors before production.

**Make Migrations Reversible.** Always implement both `up` and `down` methods.

**Separate Schema from Data.** Schema migrations should be reversible and fast. Data migrations are separate and require additional testing.

# Related Topics

**Prerequisites:** Laravel migrations, CI/CD basics
**Closely Related:** Database Migration CI, Zero-Downtime Migration, Rollback Strategies
**Advanced Follow-Ups:** Online Schema Change, Database Versioning
