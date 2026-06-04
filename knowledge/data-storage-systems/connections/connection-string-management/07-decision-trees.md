# 10.11 Connection String Management - Decision Trees

## Environment Variables vs Secrets Manager vs Database URL

---

## Decision Context

Choosing the right mechanism for managing database credentials — balancing simplicity, security, and rotation requirements.

---

## Decision Criteria

* performance: env vars are free; secrets manager adds 20-200ms at boot
* architectural: secrets manager enables zero-downtime rotation
* maintainability: DATABASE_URL is simplest; individual env vars are explicit
* security: never hardcode; encrypt per-tenant credentials at rest

---

## Decision Tree

How to manage connection strings?

↓

Regulatory compliance requiring credential rotation?

YES → Use secrets manager (AWS Secrets Manager, Vault)

    ↓
    Fetch secrets at boot: ~20-200ms overhead
    Implement runtime rotation: config()->set() + DB::purge() + DB::reconnect()
    Cache secrets locally with TTL for high-traffic apps
    
    ↓
    NEVER cache credentials in Laravel config cache
    config:cache would freeze stale credentials

NO → Simple deployment with single database?

    YES → Use DATABASE_URL
        
        ↓
        Single env var instead of 5-6
        Standardized format across tools
        Parsed in config/database.php
        
        ↓
        Example: DATABASE_URL=mysql://user:pass@host:3306/db

NO → Multi-tenant with per-tenant databases?

    → Individual env vars for base config + encrypted tenant credentials in DB
    Base connection: environment variables
    Tenant connections: encrypted with Crypt::encryptString()
    Resolved and decrypted in middleware

---

## Recommended Default

**Default:** DATABASE_URL for simple deployments; secrets manager for compliance-sensitive apps
**Reason:** DATABASE_URL reduces config surface area. Secrets manager is necessary when credential rotation must be automated.

---

## Credential Rotation Without Downtime

---

## Decision Context

Implementing database credential rotation that doesn't require application restart or cause connection errors.

---

## Decision Criteria

* performance: rotation adds 1-50ms purge/reconnect latency
* architectural: must handle both planned rotation and emergency rotation
* maintainability: automated rotation via cron or secrets manager
* security: immediately invalidate old credentials after rotation

---

## Decision Tree

Rotating database credentials?

↓

Using secrets manager?

YES → Detect credential change → update config → purge → reconnect

    ↓
    1. Secrets manager rotates password
    2. Application detects change (via health check failure or webhook)
    3. config()->set() new credentials
    4. DB::purge() removes stale PDO
    5. DB::reconnect() establishes new connection
    
    ↓
    Test new connection: DB::connection()->select('SELECT 1')
    If test fails: log error, retry, don't invalidate old credentials yet

NO → Manual rotation?

    YES → Update .env → restart Octane workers / PHP-FPM
    
        ↓
    Simple but causes brief connection disruption
    Acceptable for low-availability environments
    
    NO → IAM-based auth (RDS IAM)?
    
        → No credential rotation needed
        IAM token generated automatically, expires in 15 minutes
        Most secure option — eliminates passwords entirely

---

## Recommended Default

**Default:** IAM-based auth where available; otherwise secrets manager with automated rotation
**Reason:** IAM eliminates credential management entirely. Secrets manager is the next best option for zero-downtime rotation.

---

## Related Rules

* Rule 10-5-1: Always Purge After Config Change
* Rule 10-2-4: Consider Architecture Guidelines

---

## Related Skills

* Manage Dynamic Connection Configuration
* Manage Connection Purging and Reconnection
