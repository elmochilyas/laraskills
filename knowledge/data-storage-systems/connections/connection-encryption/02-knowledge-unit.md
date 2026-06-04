# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.13 Connection encryption (TLS/SSL between app and database)
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Database connections should be encrypted in transit, especially for cross-region or external connections (RDS public, non-VPC). MySQL/PostgreSQL support TLS connections. Laravel config: `'ssl' => ['mode' => 'required', 'ca' => storage_path('...'), ...]`. TLS adds 10-30% connection overhead (handshake) but negligible per-query overhead.

---

# Core Concepts

- **SSL modes**: `prefer` (try SSL, fall back to plain), `required` (reject plain connections), `verify_ca` (verify server certificate), `verify_identity` (verify cert matches hostname).
- **Certificate files**: `ssl_ca` (CA certificate), `ssl_cert` (client cert for mutual TLS), `ssl_key` (client key).
- **Performance impact**: SSL handshake adds 10-50ms to connection time. Per-query overhead: minimal (symmetric encryption after handshake).

---

# Patterns

**RDS SSL enforcement**: RDS CA certificate bundle. Set `'ssl' => ['mode' => 'required', 'ca' => 'path/to/rds-ca-2019-root.pem']`. Enforce SSL on RDS side via parameter group.

**Mutual TLS (mTLS)**: Client presents certificate. Database verifies. Used for PostgreSQL `cert` authentication.

---

# Common Mistakes

**SSL without verification**: `'ssl' => ['mode' => 'prefer']` — falls back to plain if SSL fails. No MITM protection. Use `'required'` or `'verify_ca'`.

---

# Related Knowledge Units

10.1 Connection lifecycle | 10.11 Connection string management
## Ecosystem Usage

pgBouncer is the standard PostgreSQL connection pooler. ProxySQL provides MySQL connection pooling. Laravel Octane requires connection pooling to prevent exhaustion.

## Failure Modes

Transaction pooling breaks SET session state. Connection starvation when all pool connections used. Pooler restart drops all connections.

## Performance Considerations

Pooling reduces connection overhead from 1-2ms to microseconds. Optimal pool size is 2x core_count plus spindle_count.

## Production Considerations

Monitor pool utilization. Use session pooling for Laravel compatibility. Configure max_client_conn for burst tolerance.

## Research Notes

pgBouncer transaction pooling is incompatible with Laravel session-state operations. ProxySQL query rules enable proxy-level read/write splitting.

## Internal Mechanics

pgBouncer maintains pre-established connections. Session pooling assigns connections for session duration. Transaction pooling returns connections after each transaction.

## Architectural Decisions

pgBouncer for PostgreSQL only. ProxySQL for MySQL/MariaDB with read/write split. Pgpool-II for PostgreSQL with read/write split.

## Tradeoffs

Benefit: Reduced connection overhead. Cost: Additional infrastructure. Benefit: Burst absorption. Cost: Pool sizing complexity.

## Mental Models

Connection pooling is valet parking. The valet keeps connections ready. Without a valet, each request fetches its own car from the garage.

