# ClickHouse Driver Tradeoffs

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 04-data-warehousing
- **Knowledge Unit:** clickhouse-driver-tradeoffs
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

ClickHouse access from PHP/Laravel is primarily via HTTP-based drivers (using ClickHouse's HTTP interface), but alternative approaches exist: TCP native protocol and FFI (Foreign Function Interface) drivers. The standard HTTP driver is sufficient for 99% of Laravel analytics workloads, but understanding the alternatives reveals when TCP or FFI yields material benefits for high-throughput pipelines.

---

## Core Concepts

- **HTTP Driver:** Uses ClickHouse's HTTP REST interface — requests are HTTP POST with SQL in the body, responses as JSON/CSV/TabSeparated — connection management via HTTP connection pooling — all ClickHouse features available
- **TCP Native Protocol Driver:** Uses ClickHouse's native binary TCP protocol — more efficient wire format, supports server-side compression, query progress reporting, cancel queries — requires PHP extension or custom implementation
- **FFI Driver:** Uses PHP's FFI to bind directly to ClickHouse C++ client library — potentially lowest latency — complex deployment (requires compiled C++ library) — experimental in PHP
- **Connection Pooling:** HTTP drivers rely on HTTP/1.1 keep-alive or HTTP/2 multiplexing; TCP drivers use dedicated connection pools; FFI shares single C++ client instance across requests

---

## Mental Models

- **Driver as Transportation:** HTTP driver is a commercial airline — reliable, well-supported, works for almost everyone. TCP driver is a private jet — faster, more flexible, but requires more expertise. FFI is a rocket — theoretically fastest but experimental and complex.
- **Abstraction as Power Strip:** The driver is the power strip connecting the application to ClickHouse. The application should only see the power outlet (interface), not care whether the power comes from the wall (HTTP), a generator (TCP), or solar panels (FFI).

---

## Internal Mechanics

HTTP driver sends SQL queries as HTTP POST requests to ClickHouse's HTTP port (8123 by default). ClickHouse executes the query and returns results in the requested format. The driver parses the response (JSON, TabSeparated, etc.) into PHP data structures. TCP driver uses ClickHouse's native protocol over TCP port (9000), which supports binary encoding, compression, and server-side state tracking. FFI driver bridges directly to ClickHouse's C++ client, eliminating network stack overhead entirely.

---

## Patterns

- **Default to HTTP:** Start with HTTP driver for all Laravel applications — well-documented, community-tested, supports all ClickHouse features — migrate to TCP only if HTTP is a measured bottleneck
- **Use Persistent Connections:** Configure HTTP keep-alive and connection pooling to avoid per-query TCP handshake overhead
- **Abstract Behind Interface:** Abstract the ClickHouse client behind a repository or query builder interface — driver choice is an infrastructure detail, not an application concern

---

## Architectural Decisions

Use HTTP driver as the default for all Laravel analytics applications. Use TCP driver for high-throughput pipelines (> 1000 queries/second) where per-query latency overhead matters. Avoid FFI driver in production — the approach is experimental and deployment complexity is high. Use HTTP driver in development (simpler, no native extensions), consider TCP in production if benchmarks show improvement.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| HTTP: simple, well-supported, all features | 1-5ms added latency per query | Negligible for most analytics workloads |
| TCP: lower latency (0.1-1ms) | Requires PHP extension, more complex setup | Benefits only visible at 1000+ queries/sec |
| FFI: lowest latency (0.01-0.1ms) | Experimental, complex deployment | Not recommended for production |
| Connection pooling reduces overhead | Pool configuration adds complexity | Without pooling, each query opens new TCP connection |

---

## Performance Considerations

HTTP driver overhead: 1-5ms per query in the same datacenter — negligible for most analytics workloads. TCP driver overhead: 0.1-1ms per query — matters at 1000+ queries/second. FFI driver: 0.01-0.1ms — only relevant for sub-millisecond query requirements. Connection establishment adds 10-50ms on first query — always use persistent connections.

---

## Production Considerations

HTTP driver exposes ClickHouse HTTP port — use firewall rules to restrict access to application servers only. TCP native protocol requires authentication — use ClickHouse user accounts with minimal permissions. FFI driver runs in-process — a security vulnerability in the C++ library compromises the PHP process. Never expose ClickHouse credentials in application configuration files — use environment variables.

---

## Common Mistakes

- **No Connection Pooling:** HTTP driver without keep-alive — each query opens new TCP connection, TCP handshake + TLS adds 10-50ms per query. Better: configure HTTP connection pooling with keep-alive.
- **Premature Optimization to TCP:** Switching to TCP before measuring HTTP performance — HTTP is sufficient for 99% of workloads. Better: benchmark HTTP first, only switch if verified bottleneck.
- **FFI in Production:** FFI driver without understanding deployment implications — C++ library must be compiled for production architecture, PHP FFI has stability risks. Better: reserve FFI for experimental projects.

---

## Failure Modes

- **Driver Coupling in Application Code:** ClickHouse::query() called directly in controllers — switching drivers requires changing every call site. Mitigation: abstract behind interface, driver choice is configuration detail.
- **No Retry Strategy:** Driver has no retry configuration — transient network error causes query failure. Mitigation: configure retry strategy — HTTP drivers retry on 5xx, TCP on connection errors.
- **Ignoring Compression:** HTTP driver sends uncompressed query results — large result sets saturate network bandwidth. Mitigation: enable HTTP compression in ClickHouse server, driver handles compressed responses.

---

## Ecosystem Usage

The `laravel-clickhouse/laravel-clickhouse` package is the standard HTTP driver for Laravel. It provides a ClickhouseBuilder, Eloquent-like query syntax, and integration with Laravel's database configuration. The driver choice is configured in `config/database.php` and accessed through `DB::connection('clickhouse')`. Community packages exist for TCP protocol support but are less mature.

---

## Related Knowledge Units

### Prerequisites
- ClickHouse MergeTree — Understanding ClickHouse fundamentals before driver selection

### Related Topics
- pg_clickhouse FDW — Alternative integration pattern via PostgreSQL FDW
- Snowflake/BigQuery Drivers — Comparison with other cloud warehouse drivers

### Advanced Follow-up Topics
- ClickHouse Codecs — Column compression affects query data transfer size
- Warehouse Cost Optimization — Driver connection pooling affects resource usage

---

## Research Notes

The HTTP driver is the standard for Laravel-ClickHouse integration because of its simplicity and sufficient performance. The 1-5ms overhead per query is negligible compared to analytics query execution times (typically 100ms-10s). The TCP protocol driver offers meaningful benefits only at very high query volumes (> 1000/sec), which is rare in Laravel analytics applications. The FFI approach, while theoretically fastest, is not production-ready due to PHP FFI stability concerns and deployment complexity.
