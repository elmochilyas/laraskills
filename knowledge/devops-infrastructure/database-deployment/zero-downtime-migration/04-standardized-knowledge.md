# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 09-database-deployment
**Knowledge Unit:** zero-downtime-migration
**Difficulty:** Advanced
**Category:** Database Deployment
**Last Updated:** 2026-06-03

# Overview

Zero-downtime migration strategies enable schema changes on production databases without locking tables or causing application downtime. MySQL (and most relational databases) lock tables during DDL operations on large datasets, blocking reads and writes. The primary tools are `pt-online-schema-change` (Percona Toolkit) and `gh-ost` (GitHub).

This topic exists because standard Laravel migrations lock tables for the duration of the `ALTER TABLE` statement, which can take hours on large tables. The engineering value is schema evolution without application downtime.

# When To Use

- Tables larger than 1 million rows requiring schema changes
- 24/7 applications with no maintenance windows
- ALTER TABLE operations expected to take > 5 seconds
- Adding indexes on large tables

# When NOT To Use

- Small tables (< 100k rows) where standard migrations complete instantly
- Applications with scheduled maintenance windows
- Schema changes on tables that are never write-heavy

# Core Concepts

- **Shadow Table Pattern** — Create a copy of the table, apply changes to copy, swap
- **Triggers for Sync** — Keep original and shadow tables synchronized during migration
- **pt-online-schema-change** — Percona Toolkit tool using triggers
- **gh-ost** — GitHub's triggerless online schema change tool
- **Throttling** — Rate-limit migration to avoid production impact

# Best Practices

**Benchmark First.** Test online schema change on staging with production-sized data.

**Use Throttling.** Set replication lag and load thresholds to slow migration during peak traffic.

**Monitor Progress.** Track migration progress, replication lag, and server load.

**Have Fallback Plan.** If migration fails, ensure the original table is untouched.

**Test Rollback.** Practice killing and restarting online migration to verify safety.

# Related Topics

**Prerequisites:** MySQL/PostgreSQL DDL, replication concepts
**Closely Related:** Database Migration CI, Automated Migration Deployment, Rollback Strategies
**Advanced Follow-Ups:** Database Versioning, Schema Change Management
