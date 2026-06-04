# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** FrankenPHP Installation and Caddyfile — Single Binary, php_server Directive, Worker Mode
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Always use `--workers` for production**: Worker mode provides the 3-5x throughput advantage. Standard mode is comparable to FPM.
- [ ] **Set resolve_root_symlink**: Enable this directive if your deployment uses symlinks for zero-downtime releases.
- [ ] **Configure num_threads and max_threads**: Start with `num_threads = CPU cores` and `max_threads = CPU cores Ã— 2`. Adjust based on memory budget.
- [ ] **Enable compression**: Caddy's `encode gzip` directive reduces bandwidth with minimal CPU overhead.
- [ ] **Use environment variables**: Inject environment-specific configuration via `os.Getenv` in Caddyfile or direct environment variables.
- [ ] FrankenPHP binary downloaded and verified
- [ ] `--workers` flag configured for production mode
- [ ] Caddyfile created with php_server block
- [ ] num_threads and max_threads configured
- [ ] Root path points to application public directory
- [ ] FrankenPHP installed and running
- [ ] Caddyfile configured correctly
- [ ] PHP requests served without errors
- [ ] Automatic HTTPS working (if domain configured)
- [ ] Installation documented for team
- [ ] FrankenPHP installed (Docker, binary, or source build)
- [ ] Caddyfile created with correct site configuration
- [ ] PHP settings configured (memory_limit, upload_max_filesize, etc.)
- [ ] FrankenPHP starts without errors
- [ ] PHP requests served correctly

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **Caddyfile vs .rr.yaml**: FrankenPHP uses Caddyfile syntax (similar to Nginx configuration). RoadRunner uses YAML. The learning curve is different for each.
- [ ] **Standard Mode vs Worker Mode**: Standard mode creates a new PHP process per request (like FPM). Worker mode persists PHP across requests. Always use worker mode for production APIs.
- [ ] **Hot Reload**: FrankenPHP supports hot reload via Caddy's file watching. Use `--watch` during development to auto-reload on file changes.
- [ ] **Docker Deployment**: The official FrankenPHP Docker image includes the binary with PHP compiled for ZTS. Use it as a base image rather than building from scratch.
- [ ] Document and follow through on architectural decision: FrankenPHP installation method
- [ ] Document and follow through on architectural decision: Caddyfile configuration for PHP apps
- [ ] Ensure architecture aligns with core concept: **Installation**: Download the binary from GitHub releases for your platform (Linux, macOS, Windows). `./frankenphp php-server` runs in standard mode. Add `--workers` for worker mode.
- [ ] Ensure architecture aligns with core concept: **Caddyfile Basics**: Standard Caddyfile syntax with `php_server { }` block. Key directives: `root`, `worker { num_threads 4 max_threads 8 }`, `resolve_root_symlink`.
- [ ] Ensure architecture aligns with core concept: **Worker Mode**: `frankenphp php-server --workers` â€” boots PHP once per thread. Each thread handles multiple requests. Requires `num_threads` and `max_threads` configuration.
- [ ] Ensure architecture aligns with core concept: **Standard Mode**: Classic CGI-like behavior â€” PHP process per request (similar to FPM but embedded). Simpler but lower throughput.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Always use `--workers` for production**: Worker mode provides the 3-5x throughput advantage. Standard mode is comparable to FPM.
- [ ] **Set resolve_root_symlink**: Enable this directive if your deployment uses symlinks for zero-downtime releases.
- [ ] **Configure num_threads and max_threads**: Start with `num_threads = CPU cores` and `max_threads = CPU cores Ã— 2`. Adjust based on memory budget.
- [ ] **Enable compression**: Caddy's `encode gzip` directive reduces bandwidth with minimal CPU overhead.
- [ ] **Use environment variables**: Inject environment-specific configuration via `os.Getenv` in Caddyfile or direct environment variables.
- [ ] Choose installation method: Docker image (`docker pull dunglas/frankenphp`), static binary, or build from source with Go
- [ ] For Docker: use the official image with your PHP extensions baked in via a custom Dockerfile
- [ ] For static binary: download the latest release from the FrankenPHP GitHub releases page
- [ ] Create a Caddyfile in the project root:
- [ ] For Laravel: configure `php_fastcgi` with `trusted_proxies` and `env` directives
- [ ] Configure PHP settings in the Caddyfile: `php_admin_value memory_limit 256M`, `php_admin_value upload_max_filesize 64M`
- [ ] Start FrankenPHP: `docker compose up -d` or `./frankenphp run`
- [ ] Verify: create a `phpinfo.php` and access it through the FrankenPHP URL
- [ ] Check the FrankenPHP logs for any errors (stderr output)
- [ ] Document the installation and Caddyfile configuration

# Performance Checklist (from 04/06)
- [ ] Worker mode: 3-5x throughput vs PHP-FPM in benchmarks
- [ ] Standard mode: Comparable to PHP-FPM + Nginx (within 5-10%)
- [ ] Single binary deployment: Replaces Nginx, PHP-FPM, and certbot with one artifact
- [ ] Thread pool auto-scaling: Threads scale between num_threads and max_threads based on demand
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] The Caddyfile should not contain secrets. Use environment variables or external secret stores for sensitive values.
- [ ] Caddy's automatic HTTPS handles TLS certificate provisioning and renewal. No manual certificate management needed.
- [ ] Restrict `php_server` blocks to application directories to prevent arbitrary PHP file execution.
- [ ] FrankenPHP inherits Caddy's security model â€” use `internal` directives for sensitive paths.

# Reliability Checklist (from 04/05/06)
- [ ] **Thread safety violation** (FrankenPHP): Extension not ZTS-compatible crashes worker. Symptom: Segfault in thread context. Mitigation: Test all extensions with ZTS, disable incompatible ones.
- [ ] **Coroutine deadlock** (Swoole): Blocking I/O in coroutine blocks all coroutines on that thread. Symptom: Partial site unresponsive. Mitigation: Ensure all I/O uses coroutine-aware libraries, set swoole hook flags.
- [ ] **Process leak** (RoadRunner): PHP worker processes accumulate over time. Symptom: Zombie PHP processes, memory growth. Mitigation: Monitor worker lifecycle, configure max_worker lifetime.
- [ ] **CGO memory leak** (FrankenPHP): Go GC doesn't collect PHP memory. Symptom: RSS grows over time. Mitigation: Set pm.max_requests to recycle threads, monitor RSS trends.
- [ ] **Monitoring**: All alternative runtimes require custom monitoring. Use the SAPI-specific status endpoints (FrankenPHP: Caddy metrics, RoadRunner: /health?plugin=http, Swoole: $server->stats()).
- [ ] **Logging**: FrankenPHP logs via Caddy's structured logging. RoadRunner writes to stdout/stderr. Swoole has built-in logger. Centralize logs via syslog or filebeat.
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown â€” workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Testing Checklist (from 04/06)
- [ ] FrankenPHP binary downloaded and verified
- [ ] `--workers` flag configured for production mode
- [ ] Caddyfile created with php_server block
- [ ] num_threads and max_threads configured
- [ ] Root path points to application public directory
- [ ] TLS configured (automatic HTTPS or custom certificate)
- [ ] Logging configured for access and error logs
- [ ] Containerized if using Docker â€” official base image used
- [ ] FrankenPHP installed and running
- [ ] Caddyfile configured correctly
- [ ] PHP requests served without errors
- [ ] Automatic HTTPS working (if domain configured)
- [ ] Installation documented for team
- [ ] FrankenPHP installed (Docker, binary, or source build)
- [ ] Caddyfile created with correct site configuration
- [ ] PHP settings configured (memory_limit, upload_max_filesize, etc.)
- [ ] FrankenPHP starts without errors
- [ ] PHP requests served correctly
- [ ] Logs checked for errors
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Always use `--workers` for production**: Worker mode provides the 3-5x throughput advantage. Standard mode is comparable to FPM.
- [ ] **Set resolve_root_symlink**: Enable this directive if your deployment uses symlinks for zero-downtime releases.
- [ ] **Configure num_threads and max_threads**: Start with `num_threads = CPU cores` and `max_threads = CPU cores Ã— 2`. Adjust based on memory budget.
- [ ] **Enable compression**: Caddy's `encode gzip` directive reduces bandwidth with minimal CPU overhead.
- [ ] **Use environment variables**: Inject environment-specific configuration via `os.Getenv` in Caddyfile or direct environment variables.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Running in standard mode for high throughput
- [ ] Avoid: Incorrect root path in Caddyfile
- [ ] Avoid: Missing worker configuration
- [ ] Avoid: Alpine-based Docker image
- [ ] Avoid anti-pattern: **Modifying the binary**: The FrankenPHP binary is a pre-compiled artifact. Use the Caddyfile for configuration, not binary patching.
- [ ] Avoid anti-pattern: **Running FrankenPHP behind Nginx**: This defeats the purpose of the single-binary architecture. If you need Nginx features, use standalone Caddy.
- [ ] Avoid anti-pattern: **Skipping worker mode documentation**: The `--workers` flag is well-documented but frequently missed, leading to disappointing performance.
- [ ] Avoid anti-pattern: **Manually managing TLS certificates**: FrankenPHP's ACME integration handles TLS automatically. Manual certificate management adds unnecessary complexity.
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
- [ ] **Graceful shutdown**: All three support SIGTERM for graceful shutdown â€” workers finish current requests before exiting. Test shutdown behavior under load.
- [ ] **Update procedure**: Runtime updates require testing worker compatibility. Always deploy to a subset first.

# Final Approval Checklist
- [ ] All Quick Checklist items verified
- [ ] Architecture decisions reviewed and approved
- [ ] Implementation follows best practices
- [ ] Performance requirements met
- [ ] Production readiness validated
- [ ] Tests pass and coverage meets threshold

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns
**Core Concepts:** **Installation**: Download the binary from GitHub releases for your platform (Linux, macOS, Windows). `./frankenphp php-server` runs in standard mode. Add `--workers` for worker mode., **Caddyfile Basics**: Standard Caddyfile syntax with `php_server { }` block. Key directives: `root`, `worker { num_threads 4 max_threads 8 }`, `resolve_root_symlink`., **Worker Mode**: `frankenphp php-server --workers` â€” boots PHP once per thread. Each thread handles multiple requests. Requires `num_threads` and `max_threads` configuration., **Standard Mode**: Classic CGI-like behavior â€” PHP process per request (similar to FPM but embedded). Simpler but lower throughput.
**Skills:** FrankenPHP Architecture Caddy/CGO/SAPI, FrankenPHP Worker Thread Management, FrankenPHP vs RoadRunner Comparison
**Decision Trees:** FrankenPHP installation method, Caddyfile configuration for PHP apps
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** FrankenPHP Architecture, FrankenPHP Worker Thread Management, FrankenPHP Container Memory Management, Runtime Selection Decision Tree

