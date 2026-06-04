# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** Architecture Model Differences â€” Memory-Resident vs Process-Per-Request for Each Runtime
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Match concurrency model to isolation requirements**: Processes (FPM/RoadRunner) provide the strongest isolation. Threads (FrankenPHP) share memory. Coroutines (Swoole) share thread memory.
- [ ] **Understand the bottleneck before choosing**: Swoole resolves I/O bottlenecks. RoadRunner resolves bootstrap bottlenecks. FrankenPHP resolves infrastructure complexity bottlenecks.
- [ ] **Consider the deployment artifact**: Single binary (FrankenPHP) vs Go binary + PHP workers (RoadRunner) vs PHP extension (Swoole) â€” each has different CI/CD implications.
- [ ] **Plan for operational tooling**: Each runtime requires different monitoring, logging, and debugging approaches. Ensure your toolchain supports the chosen model.
- [ ] Concurrency model mapped to isolation requirements
- [ ] Workload I/O profile analyzed for model selection
- [ ] Deployment artifact implications understood for chosen model
- [ ] Monitoring approach adapted to concurrency model
- [ ] Team training covers chosen model's specific patterns
- [ ] Architecture models understood and compared
- [ ] I/O profile matched to appropriate model
- [ ] Selection documented with rationale
- [ ] Team trained on the chosen model's architecture
- [ ] Three models understood (coroutine, goroutine+worker, thread)
- [ ] I/O profile matched to the optimal model
- [ ] Team expertise factored into selection
- [ ] Architectural differences documented
- [ ] Selection rationale stated
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Process Model (PHP-FPM, RoadRunner PHP workers)**: Each worker is a separate OS process. Max isolation, highest memory per worker. Crash isolation â€” one worker crash doesn't affect others.
- [ ] **Thread Model (FrankenPHP)**: Threads share address space within a process. Lower memory per worker, shared OpCache. Crash risk â€” one thread crash can crash all threads in the process.
- [ ] **Coroutine Model (Swoole)**: Coroutines share thread memory. Lowest memory per request. Cooperative multitasking â€” one blocking call blocks all coroutines on that thread.
- [ ] **Event Loop Model (ReactPHP/AMPHP)**: Single thread, non-blocking I/O. Lowest overhead but no parallelism. One slow callback blocks everything.
- [ ] Document and follow through on architectural decision: Runtime architecture model selection
- [ ] Ensure architecture aligns with core concept: **Swoole**: PHP process boots, creates event loop, spawns coroutine per request. Coroutines yield on I/O (auto-hooked). All state is in-process PHP memory. Multiple worker processes for CPU scaling.
- [ ] Ensure architecture aligns with core concept: **RoadRunner**: Go process manages goroutines. Each request is dispatched to a PHP worker via Goridge binary protocol. PHP workers are separate processes. Go handles I/O multiplexing; PHP handles business logic.
- [ ] Ensure architecture aligns with core concept: **FrankenPHP**: Single Go binary embeds PHP via CGO. Thread pool manages concurrent requests. Each thread is a full PHP interpreter instance (ZTS required). Threads share OpCache but have separate request memory.
- [ ] Ensure architecture aligns with core concept: **ReactPHP/AMPHP**: Single PHP process runs an event loop. ReactPHP uses callbacks; AMPHP uses fibers for structured concurrency. No process/thread isolation â€” one slow callback blocks everything.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Match concurrency model to isolation requirements**: Processes (FPM/RoadRunner) provide the strongest isolation. Threads (FrankenPHP) share memory. Coroutines (Swoole) share thread memory.
- [ ] **Understand the bottleneck before choosing**: Swoole resolves I/O bottlenecks. RoadRunner resolves bootstrap bottlenecks. FrankenPHP resolves infrastructure complexity bottlenecks.
- [ ] **Consider the deployment artifact**: Single binary (FrankenPHP) vs Go binary + PHP workers (RoadRunner) vs PHP extension (Swoole) â€” each has different CI/CD implications.
- [ ] **Plan for operational tooling**: Each runtime requires different monitoring, logging, and debugging approaches. Ensure your toolchain supports the chosen model.
- [ ] Learn the three models: Swoole (coroutines within PHP threads), RoadRunner (Go goroutines + separate PHP workers), FrankenPHP (OS threads with embedded PHP)
- [ ] Swoole: coroutines auto-hook PDO/MySQLi/Redis/cURL â€” non-blocking I/O within PHP, requires C extension
- [ ] RoadRunner: Go manages goroutines (M:N threading) and communicates with PHP workers via Goridge binary protocol â€” no PHP extension needed
- [ ] FrankenPHP: Caddy module with embedded PHP via CGO â€” thread-based worker pool, single binary
- [ ] For high-latency I/O (>50ms): Swoole's coroutine model yields during I/O wait â€” best for blocking operations
- [ ] For mixed I/O with moderate overhead: RoadRunner's goroutine scheduler is most efficient across I/O profiles
- [ ] For operational simplicity: FrankenPHP's single binary (Caddy + PHP) reduces deployment complexity
- [ ] Document the architectural differences and how they map to the application's requirements

# Performance Checklist (from 04/06)
- [ ] **Swoole**: Best for high-latency I/O (>50ms DB queries). Coroutine overhead ~1Âµs per yield point.
- [ ] **RoadRunner**: Best all-around. Goroutine scheduler efficient even with minimal I/O. 41-111% improvement over FPM.
- [ ] **FrankenPHP**: Best for container deployments. Single binary replaces Nginx/PHP-FPM/certbot. Thread pool overhead ~5-10%.
- [ ] **ReactPHP/AMPHP**: Best for CLI tools and streaming. Single-threaded bottleneck limits web serving throughput.
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] Process isolation (FPM, RoadRunner) provides the strongest security boundary. A compromise in one worker cannot access another worker's memory.
- [ ] Thread isolation (FrankenPHP) is weaker â€” threads share the same address space. A memory safety issue can compromise the entire process.
- [ ] Coroutine isolation (Swoole) is the weakest â€” coroutines share thread memory. A coroutine that corrupts memory affects all coroutines on that thread.
- [ ] Event loop (ReactPHP/AMPHP) has no isolation â€” any bug affects the entire application.

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
- [ ] Concurrency model mapped to isolation requirements
- [ ] Workload I/O profile analyzed for model selection
- [ ] Deployment artifact implications understood for chosen model
- [ ] Monitoring approach adapted to concurrency model
- [ ] Team training covers chosen model's specific patterns
- [ ] Rollback plan accounts for model-specific complexity
- [ ] Architecture models understood and compared
- [ ] I/O profile matched to appropriate model
- [ ] Selection documented with rationale
- [ ] Team trained on the chosen model's architecture
- [ ] Three models understood (coroutine, goroutine+worker, thread)
- [ ] I/O profile matched to the optimal model
- [ ] Team expertise factored into selection
- [ ] Architectural differences documented
- [ ] Selection rationale stated

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Match concurrency model to isolation requirements**: Processes (FPM/RoadRunner) provide the strongest isolation. Threads (FrankenPHP) share memory. Coroutines (Swoole) share thread memory.
- [ ] **Understand the bottleneck before choosing**: Swoole resolves I/O bottlenecks. RoadRunner resolves bootstrap bottlenecks. FrankenPHP resolves infrastructure complexity bottlenecks.
- [ ] **Consider the deployment artifact**: Single binary (FrankenPHP) vs Go binary + PHP workers (RoadRunner) vs PHP extension (Swoole) â€” each has different CI/CD implications.
- [ ] **Plan for operational tooling**: Each runtime requires different monitoring, logging, and debugging approaches. Ensure your toolchain supports the chosen model.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Not understanding isolation implications
- [ ] Avoid: Assuming coroutines are always better
- [ ] Avoid: Ignoring deployment complexity differences
- [ ] Avoid: Missing ZTS requirements for FrankenPHP
- [ ] Avoid anti-pattern: **Mixing concurrency models in the same application process**: Running Swoole coroutines with ReactPHP event loops in the same process causes scheduling conflicts.
- [ ] Avoid anti-pattern: **Assuming process model is always safest**: Processes have higher overhead and slower context switches. Threads and coroutines are more efficient for many workloads.
- [ ] Avoid anti-pattern: **Ignoring the evolution of models**: FrankenPHP's thread model has different characteristics than traditional threaded PHP. Don't assume limitations from the ZTS legacy apply equally.
- [ ] Avoid anti-pattern: **Choosing a model based on a single dimension**: Evaluate isolation, performance, memory, and operational complexity together.
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
**Core Concepts:** **Swoole**: PHP process boots, creates event loop, spawns coroutine per request. Coroutines yield on I/O (auto-hooked). All state is in-process PHP memory. Multiple worker processes for CPU scaling., **RoadRunner**: Go process manages goroutines. Each request is dispatched to a PHP worker via Goridge binary protocol. PHP workers are separate processes. Go handles I/O multiplexing; PHP handles business logic., **FrankenPHP**: Single Go binary embeds PHP via CGO. Thread pool manages concurrent requests. Each thread is a full PHP interpreter instance (ZTS required). Threads share OpCache but have separate request memory., **ReactPHP/AMPHP**: Single PHP process runs an event loop. ReactPHP uses callbacks; AMPHP uses fibers for structured concurrency. No process/thread isolation â€” one slow callback blocks everything.
**Skills:** Runtime Comparison Overview, Runtime Selection Decision Tree, Swoole Architecture and Coroutine Model, RoadRunner Architecture and Goridge
**Decision Trees:** Runtime architecture model selection
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** Runtime Comparison Overview, Runtime Selection Decision Tree, PHP-FPM Worker Management, Laravel Octane Driver Selection

