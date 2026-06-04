# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Runtime Comparison Overview â€” Swoole, RoadRunner, FrankenPHP, ReactPHP, AMPHP
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Benchmark your specific workload**: Published benchmarks are directional. Runtime performance varies dramatically by I/O profile, framework, and dependencies.
- [ ] **Start with RoadRunner for Octane**: It's the most stable, best-documented alternative runtime with strong Laravel integration. No PHP extension requirement reduces risk.
- [ ] **Consider FrankenPHP for container simplicity**: Single binary deployment dramatically reduces Docker image complexity and ops overhead.
- [ ] **Match runtime to workload I/O profile**: High-latency I/O (50ms+ queries) â†’ Swoole. Mixed/low-latency I/O â†’ RoadRunner. Maximum simplicity â†’ FrankenPHP.
- [ ] **Plan for 24-hour soak tests**: All memory-resident runtimes can develop memory leaks over hours. Never ship without extended soak testing.
- [ ] Workload I/O profile analyzed (average query latency, response times)
- [ ] Candidate shortlisted based on I/O profile and team expertise
- [ ] Benchmark results collected for candidate runtime with production-representative workload
- [ ] 24-hour soak test completed for selected runtime
- [ ] Rollback plan documented (FPM or alternate runtime)
- [ ] Four runtime categories understood by team
- [ ] I/O profile matched to appropriate category
- [ ] Shortlisted runtime(s) identified for further evaluation
- [ ] Selection criteria documented
- [ ] Team education completed
- [ ] Four runtime categories understood
- [ ] Operational requirements assessed
- [ ] Shortlisted runtime(s) identified
- [ ] Selection rationale documented
- [ ] Team trained on selected runtime basics

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Memory-Resident Model**: All alternative runtimes boot PHP once and handle many requests. This eliminates the 10-40ms per-request bootstrap cost that dominates PHP-FPM's overhead.
- [ ] **Concurrency Model Differences**: Swoole uses coroutines (cooperative multitasking within threads), RoadRunner uses goroutines (M:N threading) + PHP workers, FrankenPHP uses threads (1:1 with OS threads).
- [ ] **PHP Extension Requirement**: Swoole requires a C extension. RoadRunner and FrankenPHP do not. This affects deployment pipeline complexity and third-party library compatibility.
- [ ] **Operational Complexity Spectrum**: FrankenPHP (lowest) â†’ RoadRunner (medium) â†’ Swoole (highest). Match complexity to team capabilities.
- [ ] Document and follow through on architectural decision: Runtime comparison for specific use case
- [ ] Ensure architecture aligns with core concept: **Swoole**: C extension providing coroutine-based event-driven architecture. Auto-hooks PDO, MySQLi, Redis, cURL into coroutines. io_uring support (6.2+). Best for high-latency I/O workloads.
- [ ] Ensure architecture aligns with core concept: **RoadRunner**: Go application server communicating with PHP workers via Goridge binary protocol. No PHP extension required. Best all-around performance for Laravel Octane.
- [ ] Ensure architecture aligns with core concept: **FrankenPHP**: Single binary (Caddy + PHP), embedded PHP via CGO. Thread-based worker pool. HTTP/3, automatic HTTPS, 103 Early Hints. Best for operational simplicity.
- [ ] Ensure architecture aligns with core concept: **ReactPHP / AMPHP**: Pure PHP event loops and fiber-based concurrency. No extension required but limited to single-process concurrency. Best for streaming and CLI tools.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Benchmark your specific workload**: Published benchmarks are directional. Runtime performance varies dramatically by I/O profile, framework, and dependencies.
- [ ] **Start with RoadRunner for Octane**: It's the most stable, best-documented alternative runtime with strong Laravel integration. No PHP extension requirement reduces risk.
- [ ] **Consider FrankenPHP for container simplicity**: Single binary deployment dramatically reduces Docker image complexity and ops overhead.
- [ ] **Match runtime to workload I/O profile**: High-latency I/O (50ms+ queries) â†’ Swoole. Mixed/low-latency I/O â†’ RoadRunner. Maximum simplicity â†’ FrankenPHP.
- [ ] **Plan for 24-hour soak tests**: All memory-resident runtimes can develop memory leaks over hours. Never ship without extended soak testing.
- [ ] Understand the four categories: Swoole (C extension, coroutines), RoadRunner (Go + PHP workers, Goridge), FrankenPHP (Caddy module, threads), ReactPHP/AMPHP (PHP userspace, event loops)
- [ ] Swoole: best for high-latency I/O (>50ms DB queries), requires C extension
- [ ] RoadRunner: best for mixed I/O, no extension required, strongest Laravel integration
- [ ] FrankenPHP: best for operational simplicity, single binary, automatic HTTPS
- [ ] ReactPHP/AMPHP: best for CLI/streaming workloads, no extension, limited to single-process
- [ ] For most Laravel applications: RoadRunner is the recommended starting point
- [ ] For maximum simplicity: FrankenPHP's single binary reduces deployment complexity
- [ ] For high-I/O workloads: Swoole's coroutine model provides the highest throughput
- [ ] Benchmark the shortlisted runtime(s) with the application workload
- [ ] Document the comparison and selection

# Performance Checklist (from 04/06)
- [ ] RoadRunner: 41-111% throughput improvement over FPM; efficient scheduler even with minimal I/O
- [ ] Swoole: best for high-latency I/O (50ms+ DB queries); coroutine overhead ~1us per yield point
- [ ] FrankenPHP: thread-based worker model; CGO boundary adds 5-10% overhead vs pure Go/PHP runtimes
- [ ] ReactPHP/AMPHP: best for CLI/streaming workloads; event-loop based, no multi-process coordination
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] Swoole's C extension must be compiled from trusted sources to avoid supply chain risks
- [ ] RoadRunner's process isolation provides stronger security boundaries than Swoole's or FrankenPHP's shared-memory models
- [ ] FrankenPHP's CGO bridge and ZTS requirements introduce unique memory safety considerations
- [ ] All runtimes require regular updates â€” monitor each project's security advisory channels

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
- [ ] Workload I/O profile analyzed (average query latency, response times)
- [ ] Candidate shortlisted based on I/O profile and team expertise
- [ ] Benchmark results collected for candidate runtime with production-representative workload
- [ ] 24-hour soak test completed for selected runtime
- [ ] Rollback plan documented (FPM or alternate runtime)
- [ ] Runtime-specific monitoring configured
- [ ] Team trained on runtime operations and troubleshooting
- [ ] Four runtime categories understood by team
- [ ] I/O profile matched to appropriate category
- [ ] Shortlisted runtime(s) identified for further evaluation
- [ ] Selection criteria documented
- [ ] Team education completed
- [ ] Four runtime categories understood
- [ ] Operational requirements assessed
- [ ] Shortlisted runtime(s) identified
- [ ] Selection rationale documented
- [ ] Team trained on selected runtime basics

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Benchmark your specific workload**: Published benchmarks are directional. Runtime performance varies dramatically by I/O profile, framework, and dependencies.
- [ ] **Start with RoadRunner for Octane**: It's the most stable, best-documented alternative runtime with strong Laravel integration. No PHP extension requirement reduces risk.
- [ ] **Consider FrankenPHP for container simplicity**: Single binary deployment dramatically reduces Docker image complexity and ops overhead.
- [ ] **Match runtime to workload I/O profile**: High-latency I/O (50ms+ queries) â†’ Swoole. Mixed/low-latency I/O â†’ RoadRunner. Maximum simplicity â†’ FrankenPHP.
- [ ] **Plan for 24-hour soak tests**: All memory-resident runtimes can develop memory leaks over hours. Never ship without extended soak testing.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Choosing Swoole for low-I/O workloads
- [ ] Avoid: Ignoring deployment complexity
- [ ] Avoid: Skipping memory leak testing
- [ ] Avoid: Not planning rollback
- [ ] Avoid anti-pattern: **Choosing a runtime based on a single blog post benchmark**: Published benchmarks have different hardware, frameworks, and methodologies. Always test your workload.
- [ ] Avoid anti-pattern: **Migrating all applications to the same runtime**: Different workloads benefit from different runtimes. Evaluate per-application.
- [ ] Avoid anti-pattern: **Assuming newer runtimes are always better**: PHP-FPM remains the right choice for many workloads. Migration should be justified by measurable gains.
- [ ] Avoid anti-pattern: **Implementing alternative runtimes without Laravel Octane or Symfony Runtime**: These frameworks abstract driver differences. Raw runtimes require significant boilerplate for framework integration.
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
**Core Concepts:** **Swoole**: C extension providing coroutine-based event-driven architecture. Auto-hooks PDO, MySQLi, Redis, cURL into coroutines. io_uring support (6.2+). Best for high-latency I/O workloads., **RoadRunner**: Go application server communicating with PHP workers via Goridge binary protocol. No PHP extension required. Best all-around performance for Laravel Octane., **FrankenPHP**: Single binary (Caddy + PHP), embedded PHP via CGO. Thread-based worker pool. HTTP/3, automatic HTTPS, 103 Early Hints. Best for operational simplicity., **ReactPHP / AMPHP**: Pure PHP event loops and fiber-based concurrency. No extension required but limited to single-process concurrency. Best for streaming and CLI tools.
**Skills:** Architecture Model Differences, Runtime Selection Decision Tree, Octane Driver Selection Comparison, Benchmark Design and Execution
**Decision Trees:** Runtime comparison for specific use case
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Architecture Model Differences, Runtime Selection Decision Tree, Laravel Octane Driver Selection, PHP-FPM Worker Management

