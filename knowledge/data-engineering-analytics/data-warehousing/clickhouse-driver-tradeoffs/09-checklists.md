# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 04-data-warehousing
**Knowledge Unit:** clickhouse-driver-tradeoffs
**Generated:** 2026-06-03

---

# Quick Checklist

- [ ] HTTP-based vs TCP native vs FFI ClickHouse driver tradeoffs understood
- [ ] HTTP driver (laravel-clickhouse/laravel-clickhouse) evaluated as production default
- [ ] TCP native protocol driver latency advantage quantified for use case
- [ ] FFI driver deployment complexity assessed (requires ClickHouse C++ client library)
- [ ] Connection pooling strategy evaluated per driver type
- [ ] Driver choice independent of MergeTree table design (K012) and codec selection (K035)

---

# Architecture Checklist

- [ ] HTTP driver selected as primary — compatible with existing Laravel Guzzle/Curl infrastructure
- [ ] TCP native driver evaluated for sub-millisecond query latency requirements
- [ ] FFI driver evaluated for maximum throughput on bulk analytical queries
- [ ] Connection pooling configured for chosen driver to avoid per-request connection overhead
- [ ] Driver choice decoupled from ClickHouse table schema design (same DDL regardless of driver)
- [ ] Laravel service provider abstracts ClickHouse driver behind repository pattern for swapability

---

# Implementation Checklist

- [ ] HTTP driver configured via config/clickhouse.php with HTTP endpoint URL and credentials
- [ ] TCP native driver configured with host, port, and protocol buffer serialization
- [ ] FFI driver installed with ClickHouse C++ client library and PHP FFI extension
- [ ] Connection pool configured with min/max connections for production load
- [ ] Repository pattern abstracts query methods behind ClickHouseQuery interface
- [ ] Staging environment tests driver choice with representative query patterns

---

# Performance Checklist

- [ ] HTTP vs TCP latency benchmarked at p50, p95, p99 for common SELECT patterns
- [ ] FFI driver throughput measured for bulk INSERT (rows per second)
- [ ] Connection pooling overhead measured — pool creation vs per-request connection
- [ ] Query pushdown verified for HTTP driver (WHERE clause filtering at ClickHouse)
- [ ] Serialization overhead measured for TCP native protocol buffers vs HTTP JSON
- [ ] Driver CPU/memory footprint profiled under load

---

# Security Checklist

- [ ] HTTP driver connection uses TLS for all ClickHouse queries
- [ ] TCP native driver connection uses TLS with client certificate verification
- [ ] FFI driver credentials not exposed in PHP error logs
- [ ] ClickHouse credentials stored in environment config, not application code
- [ ] Driver connection string does not log query parameters with sensitive data

---

# Reliability Checklist

- [ ] HTTP driver retries on transient network errors (Guzzle retry middleware)
- [ ] TCP native driver reconnects on connection drop (socket-level health check)
- [ ] FFI driver handles C++ library crash without crashing PHP process
- [ ] Connection pool health check evicts stale connections
- [ ] Driver failure detected and logged before application query timeout

---

# Testing Checklist

- [ ] Test HTTP driver query returns correct results for all ClickHouse data types
- [ ] Test TCP native driver query matches HTTP driver results for same query
- [ ] Test FFI driver bulk INSERT matches HTTP driver row count
- [ ] Test driver falls back to healthy node on connection failure
- [ ] Test long-running query timeout configured per driver
- [ ] Test driver swap via repository pattern — interface change without query code change

---

# Maintainability Checklist

- [ ] ClickHouse driver configuration in single config file (config/clickhouse.php)
- [ ] Repository interface documented with method signatures and return types
- [ ] Driver benchmark results archived with deployment runbook
- [ ] Driver upgrade procedure documented (ClickHouse client version compatibility)
- [ ] Driver choice decision documented with rationale and tradeoff analysis

---

# Anti-Pattern Prevention Checklist

- [ ] Do not switch drivers without benchmarking — HTTP is adequate for most Laravel analytics
- [ ] Do not use FFI driver on shared hosting — requires C++ library compilation
- [ ] Do not skip connection pooling — per-request connection adds 10-50ms overhead
- [ ] Do not couple application code to driver-specific features — use abstraction
- [ ] Do not use HTTP driver for real-time streaming inserts — TCP native has lower latency

---

# Production Readiness Checklist

- [ ] Prometheus metrics for ClickHouse query latency per driver type
- [ ] Logged warning when driver connection pool exhaustion detected
- [ ] Alert when query error rate exceeds 1% for chosen driver
- [ ] Connection pool size tuned per driver and workload
- [ ] Deploy checklist includes ClickHouse driver configuration verification
- [ ] Staging load test validates driver performance before production rollout

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied: driver selection based on latency needs, pooling strategy, abstraction layer
- [ ] Security requirements satisfied: TLS for all connections, credentials env-only, query param sanitization
- [ ] Performance requirements satisfied: latency benchmarks at p50/p95/p99, throughput measured, pooling overhead quantified
- [ ] Testing requirements satisfied: data type correctness, result parity between drivers, failover, timeout
- [ ] Anti-pattern checks passed: benchmarked before switch, FFI not on shared hosting, pooling configured
- [ ] Production readiness verified: latency metrics, connection pool alerts, error rate monitoring, load testing

---

# Related References

- K012 (ClickHouse MergeTree): ClickHouse table design (same regardless of driver)
- K035 (ClickHouse Codecs): Compression codec selection (driver-independent)
