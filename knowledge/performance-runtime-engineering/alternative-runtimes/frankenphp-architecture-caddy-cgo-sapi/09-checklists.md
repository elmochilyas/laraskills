# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Architecture â€” Caddy Module, CGO-Embedded PHP, Custom SAPI
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always use worker mode for production**: Worker mode provides 3-5x throughput vs PHP-FPM. Standard mode is only for development.
- [ ] **ZTS-compile PHP**: FrankenPHP requires PHP compiled with `--enable-zts`. Verify ZTS is enabled before building.
- [ ] **Test extensions with ZTS**: Not all PHP extensions are thread-safe. Test all extensions in a FrankenPHP staging environment before production.
- [ ] **Set GOMEMLIMIT in containers**: Set `GOMEMLIMIT=800MiB` (80% of container limit) to prevent Go runtime from causing OOM kills.
- [ ] **Use debian-slim images**: glibc-based images outperform musl (Alpine) by 10-20% for PHP workloads in FrankenPHP.
- [ ] PHP compiled with ZTS (`php -i | grep "Thread Safety"`)
- [ ] FrankenPHP binary built and working (`./frankenphp version`)
- [ ] Worker mode configured (`--workers` flag in Caddyfile or CLI)
- [ ] All PHP extensions tested for ZTS compatibility
- [ ] GOMEMLIMIT set in container environments
- [ ] FrankenPHP architecture (Caddy/CGO/SAPI/threads) understood
- [ ] ZTS PHP build verified
- [ ] CGO overhead accounted for in performance expectations
- [ ] Thread safety of extensions verified
- [ ] Architecture documented for team reference
- [ ] Caddy/CGO/SAPI architecture understood
- [ ] CGO boundary overhead identified (5-10%)
- [ ] ZTS PHP requirement understood
- [ ] Thread-based worker model understood
- [ ] Memory isolation model understood

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Eliminated Network Hop**: Without FastCGI, there is no HTTPâ†”FastCGI translation layer. Request parsing, TLS termination, and PHP execution happen in-process.
- [ ] **CGO Boundary Cost**: ~100ns per CGO call. For a typical web request with dozens of CGO crossings, total overhead is <10Î¼s â€” negligible for web workloads.
- [ ] **Thread vs Process**: Threads share OpCache memory, reducing total RAM vs FPM's per-process OpCache. But thread safety requires ZTS and testing.
- [ ] **Single Binary Deployment**: The FrankenPHP binary contains Caddy, PHP, and all extensions. Container images are 150-300MB vs Nginx + FPM + certbot at 400-600MB combined.
- [ ] Document and follow through on architectural decision: FrankenPHP adoption
- [ ] Ensure architecture aligns with core concept: **Caddy Module**: FrankenPHP is a Caddy module written in Go. It handles TLS termination, HTTP/2/3 multiplexing, request routing, and static file serving within a single process.
- [ ] Ensure architecture aligns with core concept: **CGO Bridge**: `#include <php_embed.h>` via CGO. Go calls `php_embed_init()`, `php_execute_script()`, etc. PHP memory is pinned for Go GC safety using `runtime.Pinner`.
- [ ] Ensure architecture aligns with core concept: **Custom SAPI**: Implements `php_module_startup()`, `php_request_startup()`, `php_execute_script()`, `php_request_shutdown()`. Allocates per-request `SG(server_context)` and manages the PHP lifecycle at C level.
- [ ] Ensure architecture aligns with core concept: **Thread-Safe PHP**: FrankenPHP relies on ZTS (Zend Thread Safety) compilation â€” each thread gets its own TSRM context.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always use worker mode for production**: Worker mode provides 3-5x throughput vs PHP-FPM. Standard mode is only for development.
- [ ] **ZTS-compile PHP**: FrankenPHP requires PHP compiled with `--enable-zts`. Verify ZTS is enabled before building.
- [ ] **Test extensions with ZTS**: Not all PHP extensions are thread-safe. Test all extensions in a FrankenPHP staging environment before production.
- [ ] **Set GOMEMLIMIT in containers**: Set `GOMEMLIMIT=800MiB` (80% of container limit) to prevent Go runtime from causing OOM kills.
- [ ] **Use debian-slim images**: glibc-based images outperform musl (Alpine) by 10-20% for PHP workloads in FrankenPHP.
- [ ] Understand the architecture: Caddy (HTTP server) -> CGO bridge -> embedded PHP (via SAPI) -> worker threads
- [ ] The CGO boundary: Go code calls PHP's C API through cgo â€” this is the main performance overhead (5-10%)
- [ ] Thread safety (ZTS): FrankenPHP requires ZTS (Zend Thread Safety) build of PHP because it embeds PHP in a multi-threaded Go context
- [ ] The SAPI layer: FrankenPHP implements a custom SAPI that allows Caddy to communicate with the embedded PHP engine
- [ ] Worker threads: each HTTP request is handled by a PHP worker thread â€” similar to FPM workers but as threads in the same process
- [ ] Memory management: PHP threads share the same memory space (unlike FPM processes) â€” memory isolation is by convention, not enforcement
- [ ] For debugging: check FrankenPHP logs (stderr) for CGO-related errors or SAPI initialization issues
- [ ] Document the FrankenPHP architecture for the team's operational reference

# Performance Checklist (from 04/06)
- [ ] Eliminates FastCGI protocol overhead (~0.1-0.5ms per request saved vs Nginx + FPM)
- [ ] CGO boundary crossing: ~100ns per call â€” negligible for web requests measured in milliseconds
- [ ] Thread pool model: memory savings from shared OpCache across threads (vs separate processes in FPM)
- [ ] Worker mode: 3-5x throughput vs PHP-FPM in benchmarks with proper thread pool sizing
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] FrankenPHP's attack surface is the Caddy server + PHP combined. Keep both updated for security patches.
- [ ] Thread isolation in PHP is less complete than process isolation. A memory corruption in one thread could theoretically affect others.
- [ ] Go runtime's memory management handles Caddy's allocations; PHP memory is managed separately. This dual-allocation model has unique security implications.
- [ ] Caddy's automatic HTTPS (ACME) handles certificate renewal automatically, reducing certificate management errors.

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
- [ ] PHP compiled with ZTS (`php -i | grep "Thread Safety"`)
- [ ] FrankenPHP binary built and working (`./frankenphp version`)
- [ ] Worker mode configured (`--workers` flag in Caddyfile or CLI)
- [ ] All PHP extensions tested for ZTS compatibility
- [ ] GOMEMLIMIT set in container environments
- [ ] debian-slim (glibc) base image used for production
- [ ] Thread pool num_threads and max_threads configured
- [ ] FrankenPHP architecture (Caddy/CGO/SAPI/threads) understood
- [ ] ZTS PHP build verified
- [ ] CGO overhead accounted for in performance expectations
- [ ] Thread safety of extensions verified
- [ ] Architecture documented for team reference
- [ ] Caddy/CGO/SAPI architecture understood
- [ ] CGO boundary overhead identified (5-10%)
- [ ] ZTS PHP requirement understood
- [ ] Thread-based worker model understood
- [ ] Memory isolation model understood
- [ ] Architecture documented for team

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always use worker mode for production**: Worker mode provides 3-5x throughput vs PHP-FPM. Standard mode is only for development.
- [ ] **ZTS-compile PHP**: FrankenPHP requires PHP compiled with `--enable-zts`. Verify ZTS is enabled before building.
- [ ] **Test extensions with ZTS**: Not all PHP extensions are thread-safe. Test all extensions in a FrankenPHP staging environment before production.
- [ ] **Set GOMEMLIMIT in containers**: Set `GOMEMLIMIT=800MiB` (80% of container limit) to prevent Go runtime from causing OOM kills.
- [ ] **Use debian-slim images**: glibc-based images outperform musl (Alpine) by 10-20% for PHP workloads in FrankenPHP.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Using standard mode for production
- [ ] Avoid: Deploying with Alpine/musl images
- [ ] Avoid: Missing GOMEMLIMIT in container
- [ ] Avoid: Using ZTS-incompatible extensions
- [ ] Avoid anti-pattern: **Running FrankenPHP alongside Nginx**: FrankenPHP replaces Nginx. Running both together duplicates TLS termination, complicates routing, and adds latency.
- [ ] Avoid anti-pattern: **Disabling thread safety checks**: Skipping ZTS compatibility verification for extensions leads to intermittent segfaults in production.
- [ ] Avoid anti-pattern: **Ignoring Go memory management**: FrankenPHP's Go runtime and PHP memory are separate systems. Both must be monitored and tuned independently.
- [ ] Avoid anti-pattern: **Treating FrankenPHP containers as stateless**: Thread state accumulates across requests. Memory recycling via max_requests is essential.
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
**Core Concepts:** **Caddy Module**: FrankenPHP is a Caddy module written in Go. It handles TLS termination, HTTP/2/3 multiplexing, request routing, and static file serving within a single process., **CGO Bridge**: `#include <php_embed.h>` via CGO. Go calls `php_embed_init()`, `php_execute_script()`, etc. PHP memory is pinned for Go GC safety using `runtime.Pinner`., **Custom SAPI**: Implements `php_module_startup()`, `php_request_startup()`, `php_execute_script()`, `php_request_shutdown()`. Allocates per-request `SG(server_context)` and manages the PHP lifecycle at C level., **Thread-Safe PHP**: FrankenPHP relies on ZTS (Zend Thread Safety) compilation â€” each thread gets its own TSRM context.
**Skills:** FrankenPHP Installation and Caddyfile Configuration, FrankenPHP Worker Thread Management, FrankenPHP vs RoadRunner Comparison, Runtime Selection Decision Tree
**Decision Trees:** FrankenPHP adoption
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** FrankenPHP Installation and Caddyfile, FrankenPHP Worker Thread Management, FrankenPHP Container Memory Management, Runtime Comparison Overview


