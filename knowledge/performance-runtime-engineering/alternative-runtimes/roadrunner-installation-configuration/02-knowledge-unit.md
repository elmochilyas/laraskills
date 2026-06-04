# Metadata

Domain: Performance & Runtime Engineering
Subdomain: Alternative PHP Runtimes
Knowledge Unit: RoadRunner Installation and Configuration — rr Binary Download, .rr.yaml, Goridge Protocol
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

RoadRunner is a standalone Go binary — no PHP extension required. Download the `rr` binary, create a `.rr.yaml` configuration file defining worker pools, and PHP workers communicate via **Goridge** (binary protocol over stdout/stdin pipes). The Go process manages the goroutine scheduler; PHP workers only handle request business logic.

---

# Core Concepts

- **Installation**: Download binary from GitHub releases (`rr` or `roadrunner`). `./rr serve` starts the server. Can also install via Composer: `composer require spiral/roadrunner:^2024`.
- **.rr.yaml**: Main configuration file. Defines server (address, workers), worker pool (num_workers, max_jobs, timeout), plugins (http, grpc, queues, etc.).
- **Goridge protocol**: Binary frame protocol. Go ↔ PHP communication via pipe. Each frame: byte flags + uint64 length + payload. ~1μs per message overhead. Extremely efficient.
- **PHP worker**: A long-running PHP script (`<?php require 'vendor/autoload.php'; $worker = new Spiral\Goridge\StreamRelay(...); ...`) that receives requests, handles them, and sends responses.

---

# Performance Considerations

- No PHP extension: ZeRO compilation issues, no ZTS requirement, no C extension compatibility problems
- Worker pool: 4-16 PHP workers per CPU core depending on workload. More workers = higher concurrency but more memory.
- 41-111% throughput improvement over PHP-FPM in benchmarks — purely from eliminating per-request bootstrap

---

# Common Mistakes

**Running RoadRunner without OpCache**: Even though bootstrap is persistent, OpCache still speeds up worker operations. Always enable and tune OpCache alongside RoadRunner.

---

# Related Knowledge Units

RoadRunner Architecture and Goridge | RoadRunner Benchmark Performance | Laravel Octane Driver Selection

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
