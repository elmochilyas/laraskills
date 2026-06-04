# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Alternative PHP Runtimes
Knowledge Unit: FrankenPHP vs RoadRunner — Configuration Translation, Benchmark Comparison
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

FrankenPHP and RoadRunner serve the same market but differ fundamentally: **FrankenPHP** is a single binary with embedded PHP (simplicity), **RoadRunner** is a Go application server with separate PHP workers (flexibility). FrankenPHP offers 3-5x throughput vs FPM with minimal ops overhead. RoadRunner offers 41-111% improvement with a richer plugin ecosystem. Choice depends on operational priorities.

---

# Core Concepts

| Aspect | FrankenPHP | RoadRunner |
|--------|-----------|------------|
| Architecture | Single binary (Caddy + PHP via CGO) | Go binary + PHP workers via Goridge |
| PHP requirement | ZTS compilation | Standard PHP (no ZTS needed) |
| Configuration | Caddyfile | .rr.yaml |
| Concurrency | Thread pool | Goroutines + PHP worker pool |
| Throughput vs FPM | 3-5x | 1.4-2.1x |
| Plugins | Caddy modules | gRPC, queues, WebSocket, Temporal |
| Container image | 150-300MB | 80-200MB (PHP workers + Go binary) |
| Complexity | Low | Medium |

---

# Architectural Decisions

- **Choose FrankenPHP when**: Simplicity matters most, team lacks devops expertise, containerized environment, need HTTP/3 + automatic HTTPS
- **Choose RoadRunner when**: Need gRPC/WebSocket integration, want no PHP extension/ZTS dependency, need enterprise-proven stability, running complex multi-service architecture

---

# Performance Considerations

- RoadRunner: 41-111% throughput improvement over FPM; efficient scheduler even with minimal I/O
- Swoole: best for high-latency I/O (50ms+ DB queries); coroutine overhead ~1us per yield point
- FrankenPHP: thread-based worker model; CGO boundary adds 5-10% overhead vs pure Go/PHP runtimes
- ReactPHP: best for CLI/streaming workloads; event-loop based, no multi-process coordination
- Match runtime to workload I/O profile, team expertise, and deployment infrastructure

---

# Common Mistakes

- Choosing runtime based on benchmarks alone: performance varies by workload; benchmark YOUR traffic
- Assuming Swoole coroutines work with all libraries: blocking I/O blocks all coroutines on that thread
- Not testing memory leaks in long-running workers: 24-hour soak test is essential
- Ignoring deployment complexity: each runtime has different operational requirements
- Not planning rollback: alternative runtimes require specific rollback procedures; test first

---

# Related Knowledge Units

Runtime Comparison Overview | Architecture Model Differences | Runtime Selection Decision Tree

---

## Mental Models

**Vehicle model**: PHP-FPM is a bus â€” picks up a group, takes one trip, then returns to garage (process dies). FrankenPHP is a taxi fleet â€” one car (thread) serves one passenger at a time but stays on the road. Swoole is a limousine service â€” one car serves multiple passengers simultaneously (coroutines). RoadRunner is a shuttle service that coordinates vehicles via a central dispatcher (Goridge).

---

## Internal Mechanics

FrankenPHP's internals: Caddy's Go runtime calls C via CGO (#include <php_embed.h>). PHP is compiled with ZTS (Zend Thread Safety). Each HTTP request acquires a PHP thread from the thread pool, initializes a request context, and executes. RoadRunner uses Goridge â€” a Goâ†”PHP binary protocol over Unix sockets or TCP. The PHP worker process runs an event loop reading serialized requests from stdin and writing responses to stdout. Swoole implements coroutines via PHP's Generator + Task extension â€” each coroutine has a separate C stack (4KB default). I/O operations yield to the event loop via swoole_coroutine_* hooks that replace blocking PHP stream functions.

---

## Patterns

**Runtime selection flow**: 1) Identify primary bottleneck (memory vs latency vs throughput), 2) For latency-sensitive APIs with <100ms response time, evaluate Octane/Swoole/FrankenPHP, 3) For memory-constrained environments, stick with PHP-FPM static mode, 4) For mixed workloads, benchmark candidate runtimes with realistic traffic patterns, 5) Test memory leak resistance with 24-hour soak test.

---

## Architectural Decisions

- **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.

---

## Tradeoffs

| Tradeoff | Benefit | Cost |
|----------|---------|------|
| FrankenPHP | Single binary, easy deployment, HTTP/3 | CGO complexity, thread-safety bugs, newer ecosystem |
| RoadRunner | Stable, well-documented, PHP process isolation | Process overhead vs threads, Goridge complexity |
| Swoole | Mature coroutine model, most features | PHP extension complexity, non-blocking requirement |
| PHP-FPM | Battle-tested, simple, universal | Higher latency, lower throughput per server |

---

## Production Considerations

- **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- **Graceful shutdown**: All three support SIGTERM for graceful shutdown â€” workers finish current requests before exiting. Test shutdown behavior under load.
- **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

---

## Failure Modes

- **Thread safety violation** (FrankenPHP): Extension not ZTS-compatible crashes worker. Symptom: Segfault in thread context. Mitigation: Test all extensions with ZTS, disable incompatible ones.
- **Coroutine deadlock** (Swoole): Blocking I/O in coroutine blocks all coroutines on that thread. Symptom: Partial site unresponsive. Mitigation: Ensure all I/O uses coroutine-aware libraries, set swoole hook flags.
- **Process leak** (RoadRunner): PHP worker processes accumulate over time. Symptom: Zombie PHP processes, memory growth. Mitigation: Monitor worker lifecycle, configure max_worker lifetime.
- **CGO memory leak** (FrankenPHP): Go GC doesn't collect PHP memory. Symptom: RSS grows over time. Mitigation: Set pm.max_requests to recycle threads, monitor RSS trends.

---

## Ecosystem Usage

- **Laravel Octane**: Uses RoadRunner, Swoole, or FrankenPHP as drivers. Octane + RoadRunner is the most popular production combination. Laravel application servers increasingly adopt FrankenPHP for its ease of deployment.
- **Symfony Runtime**: Symfony provides a Runtime component that supports RoadRunner and FrankenPHP out of the box. The symfony/runtime-pack includes all necessary configuration.
- **API Platform**: Uses FrankenPHP by default. The API Platform distribution includes Docker Compose setup with FrankenPHP as the application server.
- **Magento + Swoole**: Adobe Commerce evaluates Swoole integration for improved performance. Community POC projects exist but production adoption is limited.

---

## Research Notes

- FrankenPHP adoption growing rapidly (6K+ GitHub stars, Docker pulls exceed 10M). Key research area: CGO overhead measurement and Go GC interaction with PHP memory.
- RoadRunner remains the most stable alternative runtime. Research on worker pool dynamics suggests optimal worker count is CPU cores Ã— 2-4 for I/O-bound workloads.
- Swoole 6.x (in development) focuses on PHP 8.4 compatibility and improved coroutine scheduling. The io_uring integration shows promise for high-throughput I/O.
- Cross-runtime benchmark comparisons remain limited. Most published benchmarks show 2-10x improvement over PHP-FPM but vary significantly by workload type.
