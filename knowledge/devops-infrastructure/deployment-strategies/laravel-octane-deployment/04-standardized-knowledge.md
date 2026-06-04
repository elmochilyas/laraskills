# Metadata

**Domain:** devops-infrastructure
**Subdomain:** 02-deployment-strategies
**Knowledge Unit:** laravel-octane-deployment
**Difficulty:** Intermediate
**Category:** Deployment Strategies
**Last Updated:** 2026-06-03

# Overview

Laravel Octane supercharges application performance by maintaining the application in memory across requests, using a persistent worker pool managed by FrankenPHP, RoadRunner, or Swoole. This eliminates the per-request bootstrapping overhead of traditional PHP-FPM. Octane fundamentally changes deployment dynamics: zero-downtime is built-in (workers gracefully restart on `octane:reload`), Envoyer is unnecessary, and Nginx is optional (FrankenPHP includes Caddy).

Octane exists because PHP-FPM's per-request bootstrap overhead limits throughput and latency. The engineering value is 5-20x throughput improvement and built-in zero-downtime deployments — a combined performance and operational benefit that no other PHP deployment strategy provides.

# Core Concepts

- **Persistent Application State** — Application boots once; worker processes handle subsequent requests in-memory
- **Sandbox Pattern** — Request state must be reset between requests to prevent data leakage
- **Worker Pool** — Multiple persistent processes handling concurrent requests
- **Graceful Reload** — `octane:reload` creates new workers, waits for old workers to finish, then replaces them
- **Runtime Options** — FrankenPHP (recommended, single binary with Caddy), RoadRunner (Go-based, mature), Swoole (PHP extension, highest performance)

# When To Use

- Applications needing maximum throughput (Octane can exceed 100k req/s with FrankenPHP)
- Teams wanting built-in zero-downtime without deployment tools
- New Laravel projects where performance is a design goal from the start
- FrankenPHP deployments using the single-binary, all-in-one approach
- Applications where Nginx complexity is undesirable (FrankenPHP embeds Caddy)

# When NOT To Use

- Applications with memory leaks that accumulate across requests
- Shared hosting environments where Octane cannot be installed
- Projects heavily reliant on `$_SERVER`, `$_GET`, `$_POST` superglobals
- Applications using legacy packages with global state
- Teams unwilling to audit their code for static state and blocking I/O

# Best Practices

**Use FrankenPHP as Default Runtime.** FrankenPHP provides the simplest deployment (single binary) and includes HTTP/1.1, HTTP/2, HTTP/3, Caddy automatic HTTPS, and Mercure hub. It's the official Laravel recommendation.

**Audit for Static State.** Octane's persistent application means static properties and global state persist across requests. Use `#[Octane\Sensitive]` attribute or explicit state reset.

**Configure Worker Recycling.** Set `max_requests` (500-1000) to periodically recycle workers, preventing memory leak accumulation. Set `max_request_time` (30-60s) to kill stuck requests.

**Monitor Worker Memory.** Track RSS per worker. Alert when any worker exceeds 80% of expected memory usage. Gradual RSS increase indicates a memory leak.

**Replace Envoyer with `octane:reload`.** Add `php artisan octane:reload` to the deployment script. This provides zero-downtime without external deployment tools.

# Architecture Guidelines

Octane serves HTTP directly or through a reverse proxy. FrankenPHP includes Caddy, which handles SSL termination and static file serving. For traditional Nginx setups, proxy requests to the Octane server port.

Queue workers, scheduled tasks, and long-running processes must run separately from Octane workers. Use Supervisor or Kubernetes for these workloads.

File uploads (S3, not local) are critical with Octane. Local storage path assumptions that work in PHP-FPM may fail across Octane workers.

# Performance Considerations

**Worker Count.** Calculate based on CPU cores, not memory: 2-4 workers per core. Octane workers share the application but handle requests independently.

**max_requests.** 500-1000 prevents memory leak accumulation. Lower for memory-intensive applications. Monitor actual memory growth per worker.

**OPcache.** Octane benefits from OPcache on reload. Configure `opcache.file_cache` for faster worker restart after reload.

**JIT Compilation.** PHP 8.3+ JIT improves Octane performance. Enable with `opcache.jit=1235` and `opcache.jit_buffer_size=100M`.

# Security Considerations

**Port Exposure.** Octane server port (default 8000) should not be directly internet-facing. Reverse proxy (Caddy or Nginx) handles SSL and security headers.

**State Isolation.** Verify that request state (user authentication, session data) is properly isolated between requests. A sandbox violation could expose user A's data to user B.

**Environment Variables.** Long-running processes read environment variables at startup. Changed environment variables require a full Octane restart, not just reload.

# Common Mistakes

**Static State Leakage.** Defining class properties that accumulate state across requests. Example: tracking request count in a static variable. Each Octane worker accumulates its own count, and the count never resets.

**Blocking I/O in Request Lifecycle.** Using `sleep()`, synchronous HTTP calls, or file_get_contents inside the request lifecycle blocks the entire worker. Offload blocking operations to queues.

**Deploying Without `octane:reload`.** Using PHP-FPM deployment scripts that restart PHP-FPM instead of reloading Octane. This causes actual downtime because Octane workers are killed.

# Examples

**Deployment Script:**
```bash
git pull origin main
composer install --no-dev --optimize-autoloader
php artisan migrate --force
php artisan octane:reload  # zero-downtime reload
```

**Worker Configuration (config/octane.php):**
```php
'workers' => 4,  // 2 per CPU core
'max_requests' => 500,
'max_request_time' => 30,
```

# Related Topics

**Prerequisites:** Laravel fundamentals, server management
**Closely Related:** FrankenPHP Standalone (preferred runtime), Envoyer Zero-Downtime (replaced by Octane), Production Dockerfiles (Octane containerization)
**Advanced Follow-Ups:** Kubernetes for Laravel (Octane on K8s), Performance Optimization, Octane Memory Profiling
**Cross-Domain Connections:** Application Performance, Queue Management

# AI Agent Notes

- Octane replaces the need for Envoyer and Nginx. AI agents should adjust deployment recommendations accordingly when Octane is selected.
- Code must be audited for static state before Octane deployment. Agents should include static state analysis in Octane migration guides.
- FrankenPHP is the recommended runtime as of Laravel 13. Agents should default to FrankenPHP unless specific RoadRunner or Swoole features are required.
- Octane worker count is CPU-bound, not memory-bound. Agents must calculate based on CPU cores, not available RAM.
