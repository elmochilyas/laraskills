# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Runtime Selection Decision Tree â€” RoadRunner for High-Throughput, Swoole for High-Latency I/O, FrankenPHP for Simplicity
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Benchmark your specific workload**: Runtime performance varies dramatically by I/O profile. Always benchmark with production-representative traffic patterns.
- [ ] **Start conservatively**: RoadRunner is the safest first choice for most applications. Migrate to Swoole or FrankenPHP only if justified by specific requirements.
- [ ] **Factor team expertise**: The best runtime is the one your team can operate effectively. Consider training costs alongside performance gains.
- [ ] **Plan for migration time**: Moving from FPM to an alternative runtime requires 2-8 weeks for testing, state leak fixes, and deployment pipeline changes.
- [ ] **Test memory leak resistance**: All memory-resident runtimes require 24-hour soak tests. Memory leaks that surface at hour 6 will cause production incidents.
- [ ] Workload I/O profile analyzed (DB query latency distribution)
- [ ] Team operational expertise assessed
- [ ] Octane compatibility checked (if applicable)
- [ ] Candidate runtimes shortlisted
- [ ] Benchmark results collected with production-representative workload
- [ ] Decision tree navigated with documented answers
- [ ] Runtime selected based on systematic evaluation
- [ ] Selected runtime validated with benchmark and soak test
- [ ] Rollback plan in place
- [ ] Decision path documented for future reference
- [ ] Decision tree navigated step by step
- [ ] I/O profile and throughput requirements documented
- [ ] Team expertise assessed
- [ ] Runtime selected based on decision tree
- [ ] Selected runtime validated with benchmark

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Runtime Compatibility**: Swoole requires PHP extension, ZTS compilation, and coroutine-safe libraries. RoadRunner requires standard PHP CLI. FrankenPHP requires ZTS compilation.
- [ ] **Octane Abstraction**: Laravel Octane provides a unified API across Swoole, RoadRunner, and FrankenPHP. Use Octane rather than raw runtimes for Laravel applications.
- [ ] **Migration Path**: PHP-FPM â†’ RoadRunner (easiest, no extension needed) â†’ FrankenPHP (simpler operations) â†’ Swoole (highest potential but most complex).
- [ ] **Multi-Runtime Architecture**: Use different runtimes for different microservices based on their workload profiles. An API gateway with RoadRunner + a background processor with Swoole is valid.
- [ ] Document and follow through on architectural decision: Selecting between Laravel Octane, Swoole, RoadRunner, FrankenPHP
- [ ] Document and follow through on architectural decision: When to adopt an alternative runtime
- [ ] Ensure architecture aligns with core concept: **RoadRunner**: Best all-around performance for Laravel Octane. No PHP extension required. 41-111% improvement over FPM. Most stable enterprise option.
- [ ] Ensure architecture aligns with core concept: **Swoole**: Best when I/O is the bottleneck. Coroutine model excels with high-latency database queries (>50ms). Requires PHP extension.
- [ ] Ensure architecture aligns with core concept: **FrankenPHP**: Best operational simplicity. Single binary replaces Nginx + FPM + certbot. 3-5x improvement. HTTP/3 built-in.
- [ ] Ensure architecture aligns with core concept: **ReactPHP/AMPHP**: Best for CLI tools, streaming, and single-process applications. Not suitable for high-throughput web serving.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Benchmark your specific workload**: Runtime performance varies dramatically by I/O profile. Always benchmark with production-representative traffic patterns.
- [ ] **Start conservatively**: RoadRunner is the safest first choice for most applications. Migrate to Swoole or FrankenPHP only if justified by specific requirements.
- [ ] **Factor team expertise**: The best runtime is the one your team can operate effectively. Consider training costs alongside performance gains.
- [ ] **Plan for migration time**: Moving from FPM to an alternative runtime requires 2-8 weeks for testing, state leak fixes, and deployment pipeline changes.
- [ ] **Test memory leak resistance**: All memory-resident runtimes require 24-hour soak tests. Memory leaks that surface at hour 6 will cause production incidents.
- [ ] Start: Does the application need >1000 RPS or is bootstrap >20% of request time?
- [ ] If NO to both: stay with PHP-FPM â€” migration not justified
- [ ] If YES: choose the runtime path based on I/O profile
- [ ] Is I/O wait >50% of wall time?
- [ ] If YES: Swoole (coroutine auto-hooking for DB/Redis/cURL)
- [ ] If NO: use RoadRunner (goroutine scheduler, best all-around)
- [ ] Is operational simplicity the primary concern?
- [ ] If YES: FrankenPHP (single binary, automatic HTTPS, HTTP/3)
- [ ] Is the workload CLI/streaming only?
- [ ] If YES: ReactPHP/AMPHP
- [ ] For Laravel Octane: prefer RoadRunner (best integration), then FrankenPHP (simplicity), then Swoole (performance)
- [ ] Validate the selected runtime with a benchmark and 24-hour soak test
- [ ] Document the decision path including the answers to each question

# Performance Checklist (from 04/06)
- [ ] RoadRunner: 41-111% throughput improvement over FPM in benchmarks (light I/O, warm state)
- [ ] Swoole: Up to 5x improvement under high-latency I/O, but 0.9x (10% slower) under sub-1ms I/O
- [ ] FrankenPHP: 3-5x throughput vs FPM in worker mode, with significantly simpler infrastructure
- [ ] ReactPHP/AMPHP: Limited by single-process concurrency â€” not for high-traffic web serving
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] Swoole's C extension must be from trusted sources and regularly updated
- [ ] FrankenPHP requires ZTS extension compatibility â€” verify extensions with security scanning
- [ ] RoadRunner's process isolation provides natural security boundaries between workers
- [ ] All runtimes need regular version updates for security patches

# Reliability Checklist (from 04/05/06)
- [ ] **Thread safety violation** (FrankenPHP): Extension not ZTS-compatible crashes worker. Symptom: Segfault in thread context. Mitigation: Test all extensions with ZTS, disable incompatible ones.
- [ ] **Coroutine deadlock** (Swoole): Blocking I/O in coroutine blocks all coroutines on that thread. Symptom: Partial site unresponsive. Mitigation: Ensure all I/O uses coroutine-aware libraries, set swoole hook flags.
- [ ] **Process leak** (RoadRunner): PHP worker processes accumulate over time. Symptom: Zombie PHP processes, memory growth. Mitigation: Monitor worker lifecycle, configure max_worker lifetime.
- [ ] **CGO memory leak** (FrankenPHP): Go GC doesn't collect PHP memory. Symptom: RSS grows over time. Mitigation: Set pm.max_requests to recycle threads, monitor RSS trends.
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown Ã¢â‚¬â€ workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Testing Checklist (from 04/06)
- [ ] Workload I/O profile analyzed (DB query latency distribution)
- [ ] Team operational expertise assessed
- [ ] Octane compatibility checked (if applicable)
- [ ] Candidate runtimes shortlisted
- [ ] Benchmark results collected with production-representative workload
- [ ] 24-hour soak test completed
- [ ] Operational runbook created for selected runtime
- [ ] Rollback path documented
- [ ] Decision tree navigated with documented answers
- [ ] Runtime selected based on systematic evaluation
- [ ] Selected runtime validated with benchmark and soak test
- [ ] Rollback plan in place
- [ ] Decision path documented for future reference
- [ ] Decision tree navigated step by step
- [ ] I/O profile and throughput requirements documented
- [ ] Team expertise assessed
- [ ] Runtime selected based on decision tree
- [ ] Selected runtime validated with benchmark
- [ ] Decision path documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Benchmark your specific workload**: Runtime performance varies dramatically by I/O profile. Always benchmark with production-representative traffic patterns.
- [ ] **Start conservatively**: RoadRunner is the safest first choice for most applications. Migrate to Swoole or FrankenPHP only if justified by specific requirements.
- [ ] **Factor team expertise**: The best runtime is the one your team can operate effectively. Consider training costs alongside performance gains.
- [ ] **Plan for migration time**: Moving from FPM to an alternative runtime requires 2-8 weeks for testing, state leak fixes, and deployment pipeline changes.
- [ ] **Test memory leak resistance**: All memory-resident runtimes require 24-hour soak tests. Memory leaks that surface at hour 6 will cause production incidents.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Selecting runtime without benchmarking your workload
- [ ] Avoid: Choosing Swoole for low-I/O API workloads
- [ ] Avoid: Ignoring deployment complexity
- [ ] Avoid: Not factoring team expertise
- [ ] Avoid anti-pattern: **Flipping runtimes without performance regression testing**: Each runtime has different performance characteristics. Always benchmark before/after.
- [ ] Avoid anti-pattern: **Applying the same runtime to all applications**: Different workload profiles benefit from different runtimes. Evaluate per-application.
- [ ] Avoid anti-pattern: **Assuming the latest runtime is always best**: PHP-FPM is still optimal for many workloads, especially memory-constrained or stable-traffic applications.
- [ ] Avoid anti-pattern: **Choosing a runtime before identifying the bottleneck**: If the bottleneck is database queries, no runtime will solve it. Profile first, then select.
- [ ] Guard against anti-pattern: Porting PHP-FPM Code Without Adapting to Persistent Runtime
- [ ] Guard against anti-pattern: Choosing Runtime Without Workload Analysis
- [ ] Guard against anti-pattern: Not Configuring Worker Count to CPU Topology
- [ ] Guard against anti-pattern: Ignoring Goridge Serialization Overhead (RoadRunner)
- [ ] Guard against anti-pattern: FrankenPHP Thread Safety Violations
- [ ] Static state audited and reset

# Production Readiness Checklist
- [ ] Configure monitoring and alerting
- [ ] Set up logging with appropriate verbosity levels
- [ ] Document operational runbooks
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown Ã¢â‚¬â€ workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **RoadRunner**: Best all-around performance for Laravel Octane. No PHP extension required. 41-111% improvement over FPM. Most stable enterprise option., **Swoole**: Best when I/O is the bottleneck. Coroutine model excels with high-latency database queries (>50ms). Requires PHP extension., **FrankenPHP**: Best operational simplicity. Single binary replaces Nginx + FPM + certbot. 3-5x improvement. HTTP/3 built-in., **ReactPHP/AMPHP**: Best for CLI tools, streaming, and single-process applications. Not suitable for high-throughput web serving.
**Skills:** Runtime Comparison Overview, Architecture Model Differences, Concurrency Model Selection, Sync vs Async I/O Assessment
**Decision Trees:** Selecting between Laravel Octane, Swoole, RoadRunner, FrankenPHP, When to adopt an alternative runtime
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Runtime Comparison Overview, Architecture Model Differences, Laravel Octane Driver Selection, Benchmarking Methodology

