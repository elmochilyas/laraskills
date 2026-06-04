# Laravel Octane Deployment

## Metadata
- **Domain:** DevOps & Infrastructure
- **Subdomain:** Deployment Strategies
- **Knowledge Unit:** Laravel Octane Deployment
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-04

---

## Executive Summary

Laravel Octane supercharges application performance by maintaining the application in memory across requests using a persistent worker pool. It fundamentally changes deployment dynamics by providing built-in zero-downtime via graceful reloads, eliminating the need for Envoyer and potentially Nginx, while delivering 5-20x throughput improvements over PHP-FPM.

---

## Core Concepts

- **Persistent Application State** — Application boots once; worker processes handle subsequent requests in-memory
- **Sandbox Pattern** — Request state must be reset between requests to prevent data leakage across users
- **Worker Pool** — Multiple persistent processes handling concurrent requests, worker count based on CPU cores
- **Graceful Reload** — `octane:reload` creates new workers, waits for old workers to finish, then replaces them with zero downtime
- **Runtime Options** — FrankenPHP (recommended, single binary with Caddy), RoadRunner (Go-based, mature), Swoole (PHP extension, highest performance)

---

## Mental Models

- **Octane Replaces Envoyer** — With Octane, zero-downtime is built into the application server. `octane:reload` in the deployment script replaces Envoyer's symlink swap entirely.
- **Worker Threads, Not Processes** — Octane workers are like PHP-FPM children but persistent. They handle hundreds of requests each before recycling, eliminating per-request bootstrap overhead.
- **CPU-Bound Sizing** — Octane worker count is calculated based on CPU cores (2-4 per core), not memory. This is the opposite of PHP-FPM where memory constrains process count.

---

## Internal Mechanics

Octane starts a specified number of worker processes at application boot. Each worker boots the Laravel application once and then handles requests in a loop. Between requests, a sandbox mechanism resets request-specific state to prevent data leakage. When `octane:reload` is called, Octane forks new worker processes with the updated application code, then signals old workers to finish their current request and terminate gracefully. The reload is seamless — existing connections are served by old workers while new connections are served by new workers. Workers are recycled after `max_requests` (typically 500-1000) to prevent memory leak accumulation.

---

## Patterns

- **FrankenPHP as Default Runtime** — Use FrankenPHP single binary for simplest deployment; it includes Caddy for automatic HTTPS and HTTP/3
- **Worker Recycling** — Set `max_requests` (500-1000) and `max_request_time` (30-60s) to prevent memory leak accumulation and stuck requests
- **Memory Monitoring** — Track RSS per worker; alert when any worker exceeds 80% of expected memory usage, indicating a memory leak
- **Deployment Script Simplification** — Replace Envoyer/Deployer with `git pull → composer install → migrate → octane:reload`

---

## Architectural Decisions

- **Octane vs. PHP-FPM** — Choose Octane when maximum throughput (100k+ req/s) and built-in ZDD are priorities; use PHP-FPM for shared hosting, legacy packages with global state, or teams unwilling to audit for static state
- **FrankenPHP vs. RoadRunner vs. Swoole** — Default to FrankenPHP (Laravel-recommended, single binary, Caddy included); choose RoadRunner for mature ecosystem and Go integration; choose Swoole for maximum raw performance
- **Nginx vs. FrankenPHP Caddy** — With FrankenPHP, Caddy handles SSL and static files, eliminating the need for Nginx. Keep Nginx for complex routing requirements.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| 5-20x throughput improvement over PHP-FPM | Requires code audit for static state/blocking I/O | Teams may need to refactor legacy code before migration |
| Built-in zero-downtime via `octane:reload` | Long-running processes must run separately from Octane workers | Queue workers and scheduler still need Supervisor or K8s |
| Eliminates need for Envoyer and potentially Nginx | Port exposure risk (Octane default 8000) | Reverse proxy (Caddy/Nginx) must handle SSL and security headers |
| Persistent application state reduces latency | Memory leaks accumulate across requests | Worker recycling and monitoring are essential |

---

## Performance Considerations

Calculate worker count as 2-4 per CPU core. Set `max_requests` to 500-1000 to prevent memory leak accumulation. OPcache benefits Octane on reload — configure `opcache.file_cache` for faster worker restart. PHP 8.3+ JIT improves Octane performance with `opcache.jit=1235` and `opcache.jit_buffer_size=100M`. File uploads must use S3 — local storage assumptions that work in PHP-FPM may fail across Octane workers.

---

## Production Considerations

The Octane server port (default 8000) should not be directly internet-facing — use a reverse proxy (Caddy or Nginx) for SSL termination and security headers. Environment variables are read at startup in Octane; changed env vars require a full restart, not just reload. Queue workers, scheduled tasks, and long-running processes must run separately from Octane workers using Supervisor or Kubernetes. Verify request state isolation — a sandbox violation could expose user A's data to user B. Static state and blocking I/O must be audited before migration.

---

## Common Mistakes

- **Static State Leakage** — Defining class properties that accumulate state across requests. Example: tracking request count in a static variable. Each Octane worker accumulates its own count that never resets.
- **Blocking I/O in Request Lifecycle** — Using `sleep()`, synchronous HTTP calls, or `file_get_contents` inside the request lifecycle blocks the entire worker. Offload blocking operations to queues.
- **Deploying Without `octane:reload`** — Using PHP-FPM deployment scripts that restart PHP-FPM instead of reloading Octane kills workers and causes actual downtime.
- **Memory-Leaking Package** — Using packages with global state or static properties that accumulate data across requests. Audit all packages before Octane migration.

---

## Failure Modes

- **Memory Leak Across Workers** — Gradual RSS increase per worker over time. Detection: alert when worker memory exceeds 80% of expected. Mitigation: reduce `max_requests` to recycle workers more frequently, identify leaking code with memory profiling.
- **Sandbox Violation** — Request state not properly reset between requests, exposing user data cross-contamination. Detection: production data leak incident. Mitigation: test with automated request isolation checks, use `#[Octane\Sensitive]` attribute.
- **Worker Hang** — Stuck request blocks a worker indefinitely. Detection: active requests plateau, response times increase. Mitigation: set `max_request_time` (30-60s) to kill stuck requests.
- **Reload Failure** — New workers fail to start, old workers are not replaced. Detection: `octane:reload` returns error. Mitigation: verify application code after deployment before reloading.

---

## Ecosystem Usage

Octane is a core Laravel package maintained by the framework authors. FrankenPHP is the recommended runtime and provides a Docker image (`dunglas/frankenphp`) for containerized deployments. Octane deployment replaces the need for Envoyer and simplifies CI/CD pipelines to a basic `octane:reload` step. Octane works with Kubernetes deployments where workers map to pod replicas. The Octane configuration (`config/octane.php`) defines worker count, runtime selection, and recycling thresholds.

---

## Related Knowledge Units

### Prerequisites
- Laravel fundamentals, server management

### Related Topics
- FrankenPHP Standalone (preferred Octane runtime)
- Envoyer Zero-Downtime (replaced by Octane)
- Production Dockerfiles (Octane containerization)

### Advanced Follow-up Topics
- Kubernetes for Laravel (Octane on K8s)
- Performance Optimization
- Octane Memory Profiling

---

## Research Notes

Octane replaces the need for Envoyer and Nginx — adjust deployment recommendations accordingly when Octane is selected. Code must be audited for static state before Octane deployment; include static state analysis in Octane migration guides. FrankenPHP is the recommended runtime as of Laravel 13 — default to FrankenPHP unless specific RoadRunner or Swoole features are required. Octane worker count is CPU-bound, not memory-bound — calculate based on CPU cores, not available RAM.
