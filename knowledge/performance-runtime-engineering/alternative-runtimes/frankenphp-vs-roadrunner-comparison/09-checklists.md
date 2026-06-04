# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP vs RoadRunner â€” Configuration Translation, Benchmark Comparison
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Match runtime to team expertise**: FrankenPHP's single binary is easier for ops teams; RoadRunner's YAML configuration is familiar to devops engineers.
- [ ] **Benchmark both with your workload**: Published benchmarks show different runtimes winning under different I/O profiles. Always test your specific application.
- [ ] **Consider migration path**: FrankenPHP to RoadRunner migration requires moving from Caddyfile to .rr.yaml. RoadRunner to FrankenPHP requires ZTS compilation and thread safety verification.
- [ ] **Evaluate plugin ecosystem**: If you need gRPC or Temporal integration, RoadRunner's built-in plugin support may save significant development time.
- [ ] **Test ZTS compatibility early**: If considering FrankenPHP, test all PHP extensions with ZTS before committing to the migration.
- [ ] Both runtimes benchmarked with application-specific workload
- [ ] ZTS compatibility verified before FrankenPHP commitment
- [ ] Plugin requirements mapped to runtime capabilities
- [ ] Deployment complexity assessed against team expertise
- [ ] Rollback path documented (FPM or alternate runtime)
- [ ] FrankenPHP vs RoadRunner compared across all relevant dimensions
- [ ] Both runtimes benchmarked with the application workload
- [ ] Selection justified by data (not opinion)
- [ ] 24-hour soak test passed for selected runtime
- [ ] Comparison documented for team reference
- [ ] Architectures compared (threads vs goroutines + workers)
- [ ] Operational complexity assessed
- [ ] Documentation and community support compared
- [ ] Both runtimes benchmarked with application workload
- [ ] Selection rationale documented

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **CGO Overhead**: FrankenPHP's CGO boundary adds 5-10% overhead vs pure Go/PHP runtimes. This is offset by eliminating Nginx/FPM intermediary latency.
- [ ] **Process Isolation**: RoadRunner's separate PHP processes provide stronger isolation than FrankenPHP's threads. A PHP crash in RoadRunner kills one worker; in FrankenPHP it can crash the entire server.
- [ ] **Plugin Architecture**: RoadRunner's plugin system (gRPC, queues, WebSocket, Temporal) is more mature than FrankenPHP's. FrankenPHP relies on Caddy modules for non-HTTP functionality.
- [ ] **Deployment Simplicity**: FrankenPHP's single binary means one artifact to deploy, one process to monitor. RoadRunner requires the Go binary + PHP workers + configuration.
- [ ] Document and follow through on architectural decision: FrankenPHP vs RoadRunner

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Match runtime to team expertise**: FrankenPHP's single binary is easier for ops teams; RoadRunner's YAML configuration is familiar to devops engineers.
- [ ] **Benchmark both with your workload**: Published benchmarks show different runtimes winning under different I/O profiles. Always test your specific application.
- [ ] **Consider migration path**: FrankenPHP to RoadRunner migration requires moving from Caddyfile to .rr.yaml. RoadRunner to FrankenPHP requires ZTS compilation and thread safety verification.
- [ ] **Evaluate plugin ecosystem**: If you need gRPC or Temporal integration, RoadRunner's built-in plugin support may save significant development time.
- [ ] **Test ZTS compatibility early**: If considering FrankenPHP, test all PHP extensions with ZTS before committing to the migration.
- [ ] Compare architectures: FrankenPHP (threads, CGO, Caddy) vs RoadRunner (Go goroutines, PHP workers, Goridge)
- [ ] For operational simplicity: FrankenPHP wins (single binary, automatic HTTPS, HTTP/3)
- [ ] For stability and documentation quality: RoadRunner wins (more mature, extensive Laravel integration, larger community)
- [ ] For memory efficiency: RoadRunner wins (separate PHP workers can be recycled independently)
- [ ] For maximum throughput: depends on workload â€” test both with production-representative traffic
- [ ] For Laravel Octane: RoadRunner is the default and best-documented option
- [ ] For non-Laravel applications: FrankenPHP's Caddy integration provides easier setup
- [ ] For teams avoiding PHP extensions: RoadRunner needs no extensions; FrankenPHP needs ZTS build
- [ ] Benchmark both with the specific application workload over 24 hours
- [ ] Document the comparison results and selection rationale

# Performance Checklist (from 04/06)
- [ ] RoadRunner: 41-111% throughput improvement over FPM; efficient scheduler even with minimal I/O
- [ ] FrankenPHP: 3-5x throughput vs FPM; CGO boundary adds 5-10% overhead vs pure Go/PHP runtimes
- [ ] Swoole is best for high-latency I/O (50ms+ DB queries); RoadRunner best for mixed workloads
- [ ] Match runtime to workload I/O profile, team expertise, and deployment infrastructure
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] FrankenPHP's CGO bridge and ZTS requirements add unique security considerations (memory pinning, thread safety)
- [ ] RoadRunner's process isolation provides stronger security boundaries between requests
- [ ] Both runtimes inherit their web server's security model â€” Caddy (FrankenPHP) or Go HTTP server (RoadRunner)
- [ ] Plugin ecosystems (especially gRPC and WebSocket) expand attack surface in both runtimes

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
- [ ] Both runtimes benchmarked with application-specific workload
- [ ] ZTS compatibility verified before FrankenPHP commitment
- [ ] Plugin requirements mapped to runtime capabilities
- [ ] Deployment complexity assessed against team expertise
- [ ] Rollback path documented (FPM or alternate runtime)
- [ ] Configuration files translated correctly if migrating
- [ ] Performance regression testing completed after migration
- [ ] FrankenPHP vs RoadRunner compared across all relevant dimensions
- [ ] Both runtimes benchmarked with the application workload
- [ ] Selection justified by data (not opinion)
- [ ] 24-hour soak test passed for selected runtime
- [ ] Comparison documented for team reference
- [ ] Architectures compared (threads vs goroutines + workers)
- [ ] Operational complexity assessed
- [ ] Documentation and community support compared
- [ ] Both runtimes benchmarked with application workload
- [ ] Selection rationale documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Match runtime to team expertise**: FrankenPHP's single binary is easier for ops teams; RoadRunner's YAML configuration is familiar to devops engineers.
- [ ] **Benchmark both with your workload**: Published benchmarks show different runtimes winning under different I/O profiles. Always test your specific application.
- [ ] **Consider migration path**: FrankenPHP to RoadRunner migration requires moving from Caddyfile to .rr.yaml. RoadRunner to FrankenPHP requires ZTS compilation and thread safety verification.
- [ ] **Evaluate plugin ecosystem**: If you need gRPC or Temporal integration, RoadRunner's built-in plugin support may save significant development time.
- [ ] **Test ZTS compatibility early**: If considering FrankenPHP, test all PHP extensions with ZTS before committing to the migration.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Choosing runtime based on benchmarks alone
- [ ] Avoid: Ignoring deployment complexity differences
- [ ] Avoid: Not planning rollback path
- [ ] Avoid: Missing ZTS verification for FrankenPHP
- [ ] Avoid anti-pattern: **Running FrankenPHP and RoadRunner simultaneously**: Both are application servers for the same application. Pick one per deployment.
- [ ] Avoid anti-pattern: **Migrating between runtimes without performance regression testing**: Runtime changes affect performance characteristics. Always benchmark before and after.
- [ ] Avoid anti-pattern: **Assuming FrankenPHP's simplicity means zero tuning**: Thread pool sizing, GOMEMLIMIT, and ZTS verification are still required.
- [ ] Avoid anti-pattern: **Assuming RoadRunner's complexity means better performance**: FrankenPHP's 3-5x advantage often exceeds RoadRunner's 1.4-2.1x in raw throughput.
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
**Skills:** Runtime Comparison Overview, Runtime Selection Decision Tree, FrankenPHP Installation and Caddyfile Configuration, RoadRunner Installation and Configuration
**Decision Trees:** FrankenPHP vs RoadRunner
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Runtime Comparison Overview, Architecture Model Differences, Runtime Selection Decision Tree, Laravel Octane Driver Selection

