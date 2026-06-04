# Metadata

Domain: Data & Storage Systems
Subdomain: Connection Management & Pooling
Knowledge Unit: 10.1 Connection lifecycle (connect, query, disconnect, reconnect)
Difficulty Level: Foundational
Last Updated: 2026-06-02

---

# Executive Summary

PHP connects to MySQL/PostgreSQL via TCP: connect (handshake, auth, SSL) → query → fetch → disconnect. Connect/disconnect overhead is 50-200ms per request. Connection pooling amortizes this cost across requests. PHP-FPM connects per request. Octane connects per worker lifetime.

---

# Core Concepts

- **PHP-FPM**: New process per request. New TCP connection per request. Connect at request start, disconnect at request end. No connection reuse.
- **Octane**: Worker lives for many requests. Connection persists. First request connects, subsequent requests reuse.
- **Connection stages**: TCP handshake → Authentication → SSL negotiation → `SET NAMES`/`SET search_path` → Query → Fetch → Close.

---

# Patterns

**Persistent connections**: `PDO::ATTR_PERSISTENT = true` — PHP reuses connections across requests. Risky (stale connections, transaction state leakage). Prefer Octane or connection pooler.

**Connection warmup**: In Octane, warm up connections during worker boot. Pre-warm minimizes first-request latency.

---

# Common Mistakes

**Connection per request in high-traffic apps**: 500 req/s × 50ms connect overhead = 25 seconds of connection time per second. Pooling eliminates this.

---

# Related Knowledge Units

10.4 Laravel Octane connections | 10.7 Connection count management
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

