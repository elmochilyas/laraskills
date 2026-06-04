# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** clickhouse-driver-tradeoffs
**Difficulty:** Intermediate
**Category:** Driver Architecture
**Last Updated:** 2026-06-03

---

# Overview

ClickHouse access from PHP/Laravel is primarily via HTTP-based drivers (using Guzzle/Curl to ClickHouse's HTTP interface), but alternative approaches exist: TCP native protocol drivers and FFI (Foreign Function Interface) drivers that bridge directly to the ClickHouse C++ client library.

The choice between HTTP and non-HTTP drivers involves tradeoffs in latency, throughput, connection management, feature support, and deployment complexity. For Laravel applications, the HTTP driver (`laravel-clickhouse/laravel-clickhouse`) is the production standard, but understanding the alternatives reveals scenarios where non-HTTP approaches yield material benefits.

Engineers must care because driver selection directly affects query latency, connection overhead, and the set of ClickHouse features available from Laravel. The wrong choice can add 10-50ms of overhead per query or limit access to critical ClickHouse features.

---

# Core Concepts

## HTTP Driver

Uses ClickHouse's HTTP REST interface. Requests are sent as HTTP POST with SQL in the body. Responses come back as JSON, CSV, or TabSeparated. Connection management is via HTTP connection pooling. Feature support: all ClickHouse SQL features are available through the HTTP interface. The standard for Laravel.

## TCP Native Protocol Driver

Uses ClickHouse's native binary TCP protocol. More efficient wire format with less overhead per query. Supports server-side compression, query progress reporting, and cancel queries. Requires a PHP extension or custom implementation.

## FFI Driver

Uses PHP's FFI (Foreign Function Interface) to bind directly to the ClickHouse C++ client library. Potentially lowest latency because there is no HTTP stack or TCP overhead. Complex to deploy (requires compiled C++ library). Experimental in PHP.

## Connection Pooling

HTTP drivers rely on HTTP/1.1 keep-alive or HTTP/2 multiplexing for connection reuse. TCP native drivers can use dedicated connection pools. FFI drivers share a single C++ client instance across PHP requests.

---

# When To Use

- HTTP driver: Default for all Laravel analytics applications. Simple, well-supported, sufficient performance.
- TCP driver: High-throughput pipelines (> 1000 queries/second). Applications sensitive to per-query latency overhead.
- FFI driver: Extremely latency-sensitive applications. Experimental projects.

---

# When NOT To Use

- HTTP driver: Applications requiring extreme query throughput (> 10K/sec). Consider TCP or FFI.
- TCP driver: First-time ClickHouse integration. Start with HTTP, optimize if needed.
- FFI driver: Production applications. The approach is experimental and deployment complexity is high.

---

# Best Practices

## Default to HTTP

Start with the HTTP-based ClickHouse driver for all Laravel applications. It is well-documented, community-tested, and supports all ClickHouse features. Migrate to TCP only if HTTP performance is a measured bottleneck.

## Use Persistent Connections

Configure HTTP keep-alive and connection pooling to avoid per-query TCP handshake overhead. The HTTP driver should reuse connections for multiple queries.

## Batch Queries

Regardless of driver, batch multiple SQL statements into a single request when possible. This reduces round-trip overhead and improves throughput.

---

# Architecture Guidelines

## Layer Placement

The driver is an infrastructure concern. Application code should not know which driver is used. Abstract driver selection behind a repository or query builder interface.

## Connection Configuration

HTTP driver: configure connection pool size, timeout, retry strategy. TCP driver: configure socket options, compression, and buffer sizes. FFI: configure C++ client options.

## Multi-Environment Strategy

Use HTTP driver in development (simpler, no native extensions). Consider TCP driver in production if benchmarks show improvement.

---

# Performance Considerations

- HTTP driver overhead: 1-5ms per query in the same datacenter. Negligible for most analytics workloads.
- TCP driver overhead: 0.1-1ms per query. Matters at 1000+ queries/second.
- FFI driver overhead: 0.01-0.1ms per query. Only relevant for sub-millisecond query requirements.
- Connection establishment adds 10-50ms on first query. Always use persistent connections.

---

# Security Considerations

- HTTP driver exposes ClickHouse HTTP port. Use firewall rules to restrict access to application servers only.
- TCP native protocol requires authentication. Use ClickHouse user accounts with minimal permissions.
- FFI driver runs in-process. A security vulnerability in the C++ library compromises the PHP process.
- All drivers: never expose ClickHouse credentials in application configuration files. Use environment variables.

---

# Common Mistakes

## Mistake: No Connection Pooling

Using the HTTP driver without connection keep-alive. Each query opens a new TCP connection. The overhead of TCP handshake + TLS negotiation adds 10-50ms per query.

**Better approach:** Configure HTTP connection pooling. Use persistent connections with keep-alive.

## Mistake: Premature Optimization to TCP

Switching to TCP native protocol before measuring HTTP performance. HTTP is sufficient for 99% of Laravel analytics workloads. TCP adds deployment complexity without measured benefit.

**Better approach:** Benchmark HTTP first. Only switch to TCP if HTTP is a verified bottleneck.

## Mistake: FFI in Production

Using the FFI driver in production without understanding the deployment implications. The C++ client library must be compiled for the production architecture. PHP FFI has stability risks.

**Better approach:** Reserve FFI for experimental projects. Use HTTP or TCP for production.

---

# Anti-Patterns

## Driver Coupling in Application Code
`ClickHouse::query()` is called directly in controllers or services. Switching from HTTP to TCP requires changing every call site.

**Solution:** Abstract the ClickHouse client behind an interface. The driver choice is a configuration detail, not an application concern.

## No Retry Strategy
The driver has no retry configuration. A transient network error causes query failure. The dashboard shows an error to the user.

**Solution:** Configure retry strategy on the driver. HTTP drivers should retry on 5xx responses. TCP drivers should retry on connection errors.

## Ignoring Compression
HTTP driver sends uncompressed query results. Large result sets saturate network bandwidth. Query latency increases due to network transfer time.

**Solution:** Enable HTTP compression (gzip) in the ClickHouse server configuration. The HTTP driver automatically handles compressed responses.
