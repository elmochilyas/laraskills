# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** RoadRunner Architecture and Goridge â€” Go Goroutine Scheduler + PHP Worker Pool
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Match worker pool to memory budget**: Calculate `num_workers = (available_RAM - Go_overhead) / avg_worker_RSS`. Each PHP worker consumes ~30-80MB RSS.
- [ ] **Configure max_jobs for recycling**: Set `max_jobs: 500-2000` to prevent memory drift. This is RoadRunner's equivalent of `pm.max_requests`.
- [ ] **Use Unix socket for Goridge relay**: Lower latency and higher throughput than TCP for local communication.
- [ ] **Monitor listen queue**: RoadRunner's Go scheduler queue depth is the earliest indicator of pool saturation.
- [ ] **Enable RPC plugin**: Use RoadRunner's RPC interface for worker health checks and metrics without HTTP overhead.
- [ ] RoadRunner binary installed (`./rr --version`)
- [ ] `.rr.yaml` configured with appropriate num_workers and max_jobs
- [ ] PHP worker script properly implements Goridge relay
- [ ] OpCache configured and verified working
- [ ] Worker pool memory budget calculated from P95 RSS
- [ ] RoadRunner architecture (Go + Goridge + PHP workers) understood
- [ ] Goridge protocol and its role in Go-PHP communication understood
- [ ] Worker isolation model understood
- [ ] Architecture documented for team reference
- [ ] Go goroutine scheduler understood (M:N threading)
- [ ] Goridge binary protocol understood
- [ ] PHP worker process model understood
- [ ] Worker isolation benefits identified
- [ ] Goridge communication verified (logs, status)
- [ ] Architecture documented for team

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **No PHP Extension Required**: RoadRunner uses standard PHP CLI binaries. No ZTS compilation, no extension conflicts, no SAPI-specific bugs.
- [ ] **Process-Level Isolation**: Each PHP worker is a separate OS process. A crash in one worker doesn't affect others. This matches FPM's isolation model.
- [ ] **Bottleneck Location Shift**: RoadRunner eliminates bootstrap overhead, shifting the bottleneck to PHP execution and worker pool sizing.
- [ ] **Plugin Ecosystem**: RoadRunner's plugin system adds gRPC, queues, WebSocket (Centrifugo), Temporal, and metrics without additional infrastructure.
- [ ] Document and follow through on architectural decision: RoadRunner as runtime for non-Laravel apps
- [ ] Ensure architecture aligns with core concept: **Go Goroutine Scheduler**: M:N threading model â€” M goroutines multiplexed onto N OS threads. ~4KB per goroutine stack. Handles 10,000+ concurrent connections efficiently.
- [ ] Ensure architecture aligns with core concept: **PHP Worker Pool**: Pre-forked PHP processes. Each worker handles one request at a time. Pool size determined by available memory and desired concurrency.
- [ ] Ensure architecture aligns with core concept: **Goridge Relay**: Communication channel supporting TCP, Unix socket, and in-process pipe. Stdout pipe is the default. ~1Âµs latency per message.
- [ ] Ensure architecture aligns with core concept: **Worker Lifecycle**: Idle in pool â†’ receive request â†’ process â†’ send response â†’ return to pool. No process spawn per request (unlike FPM).

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Match worker pool to memory budget**: Calculate `num_workers = (available_RAM - Go_overhead) / avg_worker_RSS`. Each PHP worker consumes ~30-80MB RSS.
- [ ] **Configure max_jobs for recycling**: Set `max_jobs: 500-2000` to prevent memory drift. This is RoadRunner's equivalent of `pm.max_requests`.
- [ ] **Use Unix socket for Goridge relay**: Lower latency and higher throughput than TCP for local communication.
- [ ] **Monitor listen queue**: RoadRunner's Go scheduler queue depth is the earliest indicator of pool saturation.
- [ ] **Enable RPC plugin**: Use RoadRunner's RPC interface for worker health checks and metrics without HTTP overhead.
- [ ] Understand the architecture: Go process manages goroutines -> Goridge binary protocol -> PHP worker processes
- [ ] Go's goroutine scheduler: M:N threading â€” M goroutines multiplexed onto N OS threads â€” efficient for I/O-bound workloads
- [ ] Goridge protocol: binary communication between Go and PHP over Unix sockets or TCP â€” serializes requests/responses
- [ ] PHP workers: separate processes spawned by RoadRunner â€” each worker handles one request at a time (traditional PHP)
- [ ] Worker lifecycle: RoadRunner spawns PHP workers at startup, assigns requests via Goridge, workers process and respond
- [ ] Worker isolation: each PHP worker is an independent process â€” crash in one does not affect others
- [ ] Goridge payload: includes HTTP request data, server variables, and response handling
- [ ] For debugging: check RoadRunner logs for Goridge errors, worker restarts, or communication failures
- [ ] Document the RoadRunner architecture for team reference

# Performance Checklist (from 04/06)
- [ ] 41-111% throughput improvement over PHP-FPM in benchmarks (varies by I/O profile)
- [ ] Goroutine scheduler efficient even with minimal I/O â€” RoadRunner doesn't degrade under sub-1ms queries
- [ ] Bottleneck shifts from bootstrap to PHP worker count â€” adding workers increases both throughput and memory
- [ ] Goridge binary protocol adds ~1Î¼s per message â€” negligible compared to application logic
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] PHP workers communicate with the Go process via pipes. Ensure file permissions on Unix sockets are restricted.
- [ ] RoadRunner's RPC interface should not be exposed to external networks.
- [ ] Worker pool isolation prevents one request's security failure from compromising other workers.
- [ ] The Go binary should run under an unprivileged user account with restricted filesystem access.

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
- [ ] RoadRunner binary installed (`./rr --version`)
- [ ] `.rr.yaml` configured with appropriate num_workers and max_jobs
- [ ] PHP worker script properly implements Goridge relay
- [ ] OpCache configured and verified working
- [ ] Worker pool memory budget calculated from P95 RSS
- [ ] Goridge relay using Unix socket (or restricted TCP)
- [ ] Process supervision configured for RoadRunner binary
- [ ] Warm-up requests included in deployment pipeline
- [ ] RoadRunner architecture (Go + Goridge + PHP workers) understood
- [ ] Goridge protocol and its role in Go-PHP communication understood
- [ ] Worker isolation model understood
- [ ] Architecture documented for team reference
- [ ] Go goroutine scheduler understood (M:N threading)
- [ ] Goridge binary protocol understood
- [ ] PHP worker process model understood
- [ ] Worker isolation benefits identified
- [ ] Goridge communication verified (logs, status)
- [ ] Architecture documented for team

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Match worker pool to memory budget**: Calculate `num_workers = (available_RAM - Go_overhead) / avg_worker_RSS`. Each PHP worker consumes ~30-80MB RSS.
- [ ] **Configure max_jobs for recycling**: Set `max_jobs: 500-2000` to prevent memory drift. This is RoadRunner's equivalent of `pm.max_requests`.
- [ ] **Use Unix socket for Goridge relay**: Lower latency and higher throughput than TCP for local communication.
- [ ] **Monitor listen queue**: RoadRunner's Go scheduler queue depth is the earliest indicator of pool saturation.
- [ ] **Enable RPC plugin**: Use RoadRunner's RPC interface for worker health checks and metrics without HTTP overhead.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Running RoadRunner without OpCache
- [ ] Avoid: Over-provisioning PHP workers
- [ ] Avoid: Ignoring max_jobs configuration
- [ ] Avoid: Exposing Goridge TCP port to network
- [ ] Avoid anti-pattern: **Running RoadRunner without Process Supervision**: RoadRunner is a single Go binary. Use Supervisor or systemd to restart it on crash.
- [ ] Avoid anti-pattern: **Treating PHP workers as stateless**: Workers persist across requests. Static properties, globals, and singletons accumulate state.
- [ ] Avoid anti-pattern: **Mixing RoadRunner with Swoole for same application**: The two runtimes have incompatible process and concurrency models.
- [ ] Avoid anti-pattern: **Skipping warm-up in CI/CD**: RoadRunner workers need bootstrap before handling traffic. Add warm-up requests in deployment scripts.
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
**Core Concepts:** **Go Goroutine Scheduler**: M:N threading model â€” M goroutines multiplexed onto N OS threads. ~4KB per goroutine stack. Handles 10,000+ concurrent connections efficiently., **PHP Worker Pool**: Pre-forked PHP processes. Each worker handles one request at a time. Pool size determined by available memory and desired concurrency., **Goridge Relay**: Communication channel supporting TCP, Unix socket, and in-process pipe. Stdout pipe is the default. ~1Âµs latency per message., **Worker Lifecycle**: Idle in pool â†’ receive request â†’ process â†’ send response â†’ return to pool. No process spawn per request (unlike FPM).
**Skills:** RoadRunner Installation and Configuration, RoadRunner Benchmark Performance, Architecture Model Differences, Octane Architecture and Execution Model
**Decision Trees:** RoadRunner as runtime for non-Laravel apps
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** RoadRunner Installation and Configuration, RoadRunner Benchmark Performance, Laravel Octane Driver Selection, Runtime Comparison Overview


