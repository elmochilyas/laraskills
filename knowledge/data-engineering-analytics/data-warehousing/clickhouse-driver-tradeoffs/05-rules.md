# Rules: HTTP-Based vs FFI-Based ClickHouse Driver Trade-offs

## Rule CD-01: Start with HTTP Driver
All Laravel ClickHouse integrations MUST start with the HTTP-based driver. HTTP is well-supported, feature-complete, and sufficient for 99% of analytics workloads.

## Rule CD-02: Measure Before Switching
Driver switching from HTTP to TCP or FFI MUST be justified by benchmarks. Without measured HTTP bottleneck data, TCP/FFI migration is premature optimization.

## Rule CD-03: Abstract Driver Behind Interface
ClickHouse client access MUST be abstracted behind an interface or repository. Application code must not depend on the specific driver implementation.

## Rule CD-04: Persistent Connections Required
HTTP driver MUST be configured with persistent connections. Per-query TCP handshake adds 10-50ms overhead.

## Rule CD-05: Driver Isolation per Environment
Development environments MAY use HTTP driver exclusively. Production MAY use a different driver if benchmarks justify it.

## Rule CD-06: Retry Configuration
All drivers MUST have retry configured. HTTP: retry on 5xx. TCP: retry on connection errors. FFI: retry on exception.

## Rule CD-07: Firewall ClickHouse Port
The ClickHouse HTTP port (8123) and native TCP port (9000) MUST be firewalled to application servers only. Direct public access is not permitted.

## Rule CD-08: Credentials from Environment
ClickHouse credentials MUST be configured via environment variables, not hardcoded in application config files.

## Rule CD-09: Compression Enabled
HTTP driver SHOULD have ClickHouse server compression enabled (gzip). Large result sets benefit from compression without driver configuration.

## Rule CD-10: No FFI in Production
PHP FFI ClickHouse driver MUST NOT be used in production deployments. FFI is experimental and introduces deployment complexity and stability risks.
