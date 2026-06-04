# Anti-Patterns: HTTP-Based vs FFI-Based ClickHouse Driver Trade-offs

## Premature TCP Migration
Switching to TCP native protocol without benchmarking HTTP performance. The team spends weeks configuring the TCP extension and fixing compatibility issues, only to find HTTP was already fast enough.

**Solution:** Benchmark HTTP first. Only switch if HTTP latency is a verified bottleneck and TCP provides measurable improvement.

## FFI in Production Without Testing
Deploying FFI driver to production without comprehensive testing. The C++ library has a segmentation fault under high load. ClickHouse queries fail randomly. The entire analytics pipeline goes down.

**Solution:** Test FFI extensively in staging. Have a fallback to HTTP driver. Reserve FFI for experimental projects.

## No Driver Abstraction
`ClickHouse::query()` is called throughout the codebase with hard dependencies on the HTTP driver's response format. Switching drivers requires rewriting every call site.

**Solution:** Abstract behind `ClickHouseClient` interface. The driver implementation is injected via the service container.

## Exposed ClickHouse Port
ClickHouse ports are open to the internet or to all internal services. Any compromised service can query the analytics database directly.

**Solution:** Firewall ClickHouse ports to application servers only. Use HTTP driver with port 8123 for application queries.

## Ignoring Connection Pooling
Each HTTP request opens a new TCP connection to ClickHouse. High-traffic analytics pages open 20+ connections per page load. Connection overhead dominates query time.

**Solution:** Configure HTTP keep-alive and connection pooling. Share connections across requests.
