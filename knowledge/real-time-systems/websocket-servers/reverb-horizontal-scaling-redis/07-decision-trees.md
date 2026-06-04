# Metadata

**Domain:** Real-Time Systems
**Subdomain:** WebSocket Servers
**Knowledge Unit:** Reverb Horizontal Scaling via Redis
**Generated:** 2026-06-03

---

# Decision Inventory

* Scaling Driver Selection: Redis vs Database
* Redis Client Selection: phpredis vs Predis
* Scaling Channel Strategy: Unique per Environment vs Shared

---

# Architecture-Level Decision Trees

---

## Scaling Driver Selection: Redis vs Database

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

Reverb needs a scaling driver to coordinate multiple processes. The traditional Redis driver uses pub/sub for inter-instance events. Laravel 13+ introduced a database driver that stores connection state in SQL tables. The engineer must choose the appropriate driver for their architecture.

---

## Decision Criteria

* performance considerations — Redis pub/sub latency (1-5ms) vs database polling overhead
* architectural considerations — single-server vs multi-server deployments
* security considerations — Redis removes CVE-2026-23524 attack surface
* maintainability considerations — Redis adds operational complexity

---

## Decision Tree

Which scaling driver should be used?
↓
Is the deployment multi-server (horizontal scaling)?
YES → [Redis scaling driver — database driver does not support cross-server]
NO → Is the deployment single-server with multiple processes?
    YES → Is Laravel 13+ used?
        YES → [Database scaling driver — simpler; no Redis dependency]
        NO → [Redis scaling driver — only option for Laravel <13]
    NO → [Single process — no scaling driver needed]

---

## Rationale

The database driver (Laravel 13+) is the preferred choice for single-server deployments because it eliminates Redis as a dependency, removing the CVE-2026-23524 attack surface and reducing operational complexity. However, the database driver does not support cross-server coordination—it stores state in a local database table that cannot be shared across servers. For multi-server deployments, Redis pub/sub remains the only option. The Redis driver must be on v1.7.0+ (patched) and properly hardened.

---

## Recommended Default

**Default:** Database scaling driver for single-server (Laravel 13+); Redis scaling driver for multi-server
**Reason:** Database driver is simpler and more secure for single-server; Redis is required for multi-server

---

## Risks Of Wrong Choice

Redis driver on single-server adds unnecessary complexity and attack surface. Database driver on multi-server causes isolated Reverb instances that cannot share events.

---

## Related Rules

Always Enable `REVERB_SCALING_ENABLED=true` for Multi-Instance Setups (05-rules.md)

---

## Related Skills

Scale Reverb Horizontally with Redis Pub/Sub (06-skills.md)

---

## Redis Client Selection: phpredis vs Predis

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

PHP offers two Redis clients: `phpredis` (native C extension) and `predis` (pure PHP library). For Reverb's pub/sub scaling, the performance difference is significant.

---

## Decision Criteria

* performance considerations — phpredis is 2-3x faster for pub/sub
* architectural considerations — extension installation vs library dependency
* security considerations — no security difference
* maintainability considerations — extension management vs Composer dependency

---

## Decision Tree

Which Redis client should be used?
↓
Is this a production environment?
YES → [phpredis — 2-3x faster pub/sub; native C extension]
NO → Is this a development environment?
    YES → [Predis — acceptable; no extension installation needed]
    NO → [phpredis for production performance testing]
↓
Can `phpredis` be installed on the server?
YES → [Install via PECL: pecl install redis]
NO → [Use Predis — acceptable for dev; optimize for production]

---

## Rationale

`phpredis` is 2-3x faster than Predis for pub/sub operations because it's a native C extension without the overhead of PHP's object system and autoloading. For Reverb's scaling channel, where every broadcast event passes through Redis pub/sub, this performance difference directly impacts broadcast latency and throughput. Predis is acceptable for development environments where installation convenience matters more than performance.

---

## Recommended Default

**Default:** `phpredis` in production; Predis in development
**Reason:** 2-3x pub/sub performance in production; simpler setup for development

---

## Risks Of Wrong Choice

Predis in production adds 2-3x latency to every broadcast event. `phpredis` installation may not be possible on all hosting platforms.

---

## Related Rules

Always Use `phpredis` in Production Over Predis (05-rules.md)

---

## Related Skills

Scale Reverb Horizontally with Redis Pub/Sub (06-skills.md)

---

## Scaling Channel Strategy: Unique per Environment vs Shared

---

## Decision Context

When would an engineer face this choice? What problem is being solved?

The `REVERB_SCALING_CHANNEL` is the Redis channel name where Reverb instances publish and subscribe. Sharing the same channel name across environments causes cross-environment message leakage.

---

## Decision Criteria

* performance considerations — no performance impact
* architectural considerations — environment isolation
* security considerations — cross-environment data leakage prevention
* maintainability considerations — naming convention consistency

---

## Decision Tree

How should the scaling channel be named?
↓
Are there multiple deployment environments (staging, production)?
YES → [Unique scaling channel per environment: e.g., reverb-staging, reverb-production]
NO → Is there only one environment?
    YES → [Single channel name is acceptable: e.g., reverb-production]
    NO → [Use environment-specific naming for future-proofing]
↓
Is the naming convention consistent?
YES → Current convention: [reverb-{environment} — clear, auditable]
NO → [Adopt reverb-{environment} naming for consistency]

---

## Rationale

The scaling channel must be unique per environment to prevent cross-environment message leakage. If staging and production share the same channel name, a staging broadcast event is received by production clients and vice versa. This can cause staging test data to appear in production dashboards or, worse, production events to be missed because they're interleaved with staging traffic. The naming convention `reverb-{environment}` is simple, auditable, and prevents accidental collisions.

---

## Recommended Default

**Default:** `REVERB_SCALING_CHANNEL=reverb-production` in production; `reverb-staging` in staging
**Reason:** Environment isolation prevents cross-environment message leakage; clear naming convention

---

## Risks Of Wrong Choice

Shared channel across environments causes staging events to reach production clients. Inconsistent naming causes confusion during debugging.

---

## Related Rules

Always Use a Unique Scaling Channel Per Environment (05-rules.md)

---

## Related Skills

Scale Reverb Horizontally with Redis Pub/Sub (06-skills.md)
