# Metadata
**Domain:** performance-runtime-engineering
**Subdomain:** Alternative Runtimes
**Knowledge Unit:** RoadRunner Installation and Configuration — rr Binary Download, .rr.yaml, Goridge Protocol
**Generated:** 2026-06-03

# Quick Checklist (10-20 derived items)
- [ ] **Install via binary download**: Use the official GitHub release binary for your platform. Composer installation is convenient but may lag behind release versions.
- [ ] **Version-lock the binary**: Always pin to a specific RoadRunner version in deployment scripts. Breaking changes occur across major versions.
- [ ] **Configure max_jobs for memory safety**: Set `max_jobs: 1000` as starting point. Lower to 500 for memory-intensive applications; raise to 2000 for stable workloads.
- [ ] **Set allocate_timeout realistically**: 60s is standard. If workers don't start within this window, RoadRunner reports failure.
- [ ] **Enable worker supervision**: Configure `max_worker_memory` (MB) in the supervisor section to automatically restart workers exceeding memory thresholds.
- [ ] RoadRunner binary downloaded and verified
- [ ] `.rr.yaml` configured with server, http, and pool sections
- [ ] PHP worker script implements Goridge relay correctly
- [ ] OpCache configured and verified working
- [ ] max_jobs configured (500-2000)
- [ ] RoadRunner installed and configured
- [ ] Application serving requests without errors
- [ ] Worker pool configured with appropriate limits
- [ ] Octane: running with `--server=roadrunner`
- [ ] Configuration documented for team
- [ ] RoadRunner binary installed
- [ ] .rr.yaml configured (or Octane handles configuration)
- [ ] Worker pool settings configured
- [ ] Environment variables set
- [ ] RoadRunner starts without errors

# Architecture Checklist (responsibilities, layer, boundaries, deps + items from 04/05/07)
- [ ] Define clear architectural responsibilities and boundaries for this component
- [ ] **Process vs Thread vs Coroutine**: PHP-FPM uses processes (max isolation, highest memory). FrankenPHP uses threads (shared memory, lower isolation). Swoole uses coroutines (shared memory + cooperative multitasking, lowest memory per request). The choice depends on isolation requirements and acceptable complexity.
- [ ] **Embedded SAPI vs sidecar process**: FrankenPHP embeds PHP directly into Caddy (single binary deployment). RoadRunner runs PHP as a sidecar process (separate lifecycle management). Swoole runs PHP as a C-extension within the SAPI. Each model affects deployment, monitoring, and debugging workflows.
- [ ] **PHP Worker Bootstrap**: The worker.php script should be minimal â€” require autoloader, create the Goridge relay, then enter the event loop. All heavy initialization happens once at startup.
- [ ] **Plugin Configuration**: Each plugin (http, grpc, queues, etc.) gets its own section in `.rr.yaml`. Enable only what you need to minimize attack surface and memory usage.
- [ ] **Environment Variable Injection**: Use the `env` section in `.rr.yaml` to inject environment variables into PHP workers without modifying worker.php.
- [ ] **Multiple Worker Pools**: RoadRunner supports multiple worker pools for different application endpoints. Use separate pools for API vs admin vs background processing.
- [ ] Document and follow through on architectural decision: RoadRunner installation method
- [ ] Document and follow through on architectural decision: .rr.yaml configuration
- [ ] Ensure architecture aligns with core concept: **Installation**: Download binary from GitHub releases (`rr` or `roadrunner`). `./rr serve` starts the server. Can also install via Composer: `composer require spiral/roadrunner:^2024`.
- [ ] Ensure architecture aligns with core concept: **.rr.yaml**: Main configuration file defining server (address, workers), worker pool (num_workers, max_jobs, timeout), and plugins (http, grpc, queues, etc.).
- [ ] Ensure architecture aligns with core concept: **Goridge Protocol**: Binary frame protocol. Go â†” PHP communication via pipe. Each frame: byte flags + uint64 length + payload. ~1Î¼s per message overhead.
- [ ] Ensure architecture aligns with core concept: **PHP Worker**: A long-running PHP script that receives requests, handles them, and sends responses back via Goridge.

# Implementation Checklist (classes, naming, DI, error handling + items from 04/05/06)
- [ ] Use appropriate class structure and naming conventions
- [ ] Apply dependency injection where applicable
- [ ] Implement proper error handling and type safety
- [ ] **Install via binary download**: Use the official GitHub release binary for your platform. Composer installation is convenient but may lag behind release versions.
- [ ] **Version-lock the binary**: Always pin to a specific RoadRunner version in deployment scripts. Breaking changes occur across major versions.
- [ ] **Configure max_jobs for memory safety**: Set `max_jobs: 1000` as starting point. Lower to 500 for memory-intensive applications; raise to 2000 for stable workloads.
- [ ] **Set allocate_timeout realistically**: 60s is standard. If workers don't start within this window, RoadRunner reports failure.
- [ ] **Enable worker supervision**: Configure `max_worker_memory` (MB) in the supervisor section to automatically restart workers exceeding memory thresholds.
- [ ] Install RoadRunner: download from releases page or `composer require spiral/roadrunner:^2024` for Laravel
- [ ] Create `.rr.yaml` configuration file in the project root
- [ ] Configure `server` section: command to run PHP workers (e.g., `php public/index.php`)
- [ ] Configure `http` section: address, port, middleware, and static file serving
- [ ] Configure `rpc` section for management commands (optional)
- [ ] For Laravel Octane: use `php artisan octane:start --server=roadrunner` instead of manual .rr.yaml
- [ ] Configure worker pool: `pool.num_workers`, `pool.max_jobs`, `pool.supervisor`
- [ ] Set environment variables: `env.APP_ENV=production`, `env.DATABASE_URL=...`
- [ ] Start RoadRunner: `./rr serve` or `php artisan octane:start --server=roadrunner`
- [ ] Verify: access the application via the configured address (default localhost:8080)

# Performance Checklist (from 04/06)
- [ ] No PHP extension: zero compilation issues, no ZTS requirement, no C extension compatibility problems
- [ ] Worker pool: 4-16 PHP workers per CPU core depending on workload. More workers = higher concurrency but more memory
- [ ] 41-111% throughput improvement over PHP-FPM in benchmarks â€” purely from eliminating per-request bootstrap
- [ ] Goridge protocol adds ~1Î¼s per message â€” negligible in web request contexts
- [ ] FrankenPHP
- [ ] RoadRunner
- [ ] Swoole
- [ ] PHP-FPM

# Security Checklist (from 04/06 - only if relevant)
- [ ] The `.rr.yaml` file may contain sensitive configuration. Restrict file permissions to the RoadRunner user.
- [ ] Goridge RPC ports should be bound to localhost only in production.
- [ ] PHP worker scripts should sanitize all incoming data â€” RoadRunner deserializes requests before passing to workers.
- [ ] RoadRunner binary should be verified against checksums from the official GitHub release.

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
- [ ] RoadRunner binary downloaded and verified
- [ ] `.rr.yaml` configured with server, http, and pool sections
- [ ] PHP worker script implements Goridge relay correctly
- [ ] OpCache configured and verified working
- [ ] max_jobs configured (500-2000)
- [ ] Worker pool memory budget calculated
- [ ] Goridge relay using optimized transport (Unix socket)
- [ ] Process supervision configured (systemd or Supervisor)
- [ ] Binary version pinned in deployment scripts
- [ ] RoadRunner installed and configured
- [ ] Application serving requests without errors
- [ ] Worker pool configured with appropriate limits
- [ ] Octane: running with `--server=roadrunner`
- [ ] Configuration documented for team
- [ ] RoadRunner binary installed
- [ ] .rr.yaml configured (or Octane handles configuration)
- [ ] Worker pool settings configured
- [ ] Environment variables set
- [ ] RoadRunner starts without errors
- [ ] Application accessible via RoadRunner
- [ ] Logs checked for warnings
- [ ] Configuration documented

# Maintainability Checklist
- [ ] Document key decisions and implementation rationale
- [ ] Follow consistent code style and naming conventions
- [ ] Keep components focused and single-purpose
- [ ] Ensure clear API boundaries and contracts
- [ ] **Install via binary download**: Use the official GitHub release binary for your platform. Composer installation is convenient but may lag behind release versions.
- [ ] **Version-lock the binary**: Always pin to a specific RoadRunner version in deployment scripts. Breaking changes occur across major versions.
- [ ] **Configure max_jobs for memory safety**: Set `max_jobs: 1000` as starting point. Lower to 500 for memory-intensive applications; raise to 2000 for stable workloads.
- [ ] **Set allocate_timeout realistically**: 60s is standard. If workers don't start within this window, RoadRunner reports failure.
- [ ] **Enable worker supervision**: Configure `max_worker_memory` (MB) in the supervisor section to automatically restart workers exceeding memory thresholds.

# Anti-Pattern Prevention Checklist (per anti-pattern in 08, per common mistake in 04)
- [ ] Avoid: Mistake
- [ ] Avoid: Running RoadRunner without OpCache
- [ ] Avoid: Missing max_jobs configuration
- [ ] Avoid: Incorrect pool sizing
- [ ] Avoid: Using TCP for Goridge when Unix socket is available
- [ ] Avoid anti-pattern: **Installing RoadRunner via apt/yum**: Distribution packages are often outdated. Use the official GitHub binary.
- [ ] Avoid anti-pattern: **Running RoadRunner as root**: The Go binary should run under an unprivileged user. Use systemd `User=` directive or Supervisor `user=` setting.
- [ ] Avoid anti-pattern: **Sharing .rr.yaml across environments**: Worker counts, timeouts, and log levels should differ between dev, staging, and production.
- [ ] Avoid anti-pattern: **Hardcoding environment-specific values in worker.php**: Use `.rr.yaml` env section for environment-specific configuration.
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
**Core Concepts:** **Installation**: Download binary from GitHub releases (`rr` or `roadrunner`). `./rr serve` starts the server. Can also install via Composer: `composer require spiral/roadrunner:^2024`., **.rr.yaml**: Main configuration file defining server (address, workers), worker pool (num_workers, max_jobs, timeout), and plugins (http, grpc, queues, etc.)., **Goridge Protocol**: Binary frame protocol. Go â†” PHP communication via pipe. Each frame: byte flags + uint64 length + payload. ~1Î¼s per message overhead., **PHP Worker**: A long-running PHP script that receives requests, handles them, and sends responses back via Goridge.
**Skills:** RoadRunner Architecture and Goridge, RoadRunner Benchmark Performance, Octane Installation and Configuration, Worker Configuration by Driver
**Decision Trees:** RoadRunner installation method, .rr.yaml configuration
**Anti-Patterns:** Porting PHP-FPM Code Without Adapting to Persistent Runtime, Choosing Runtime Without Workload Analysis, Not Configuring Worker Count to CPU Topology, Ignoring Goridge Serialization Overhead (RoadRunner), FrankenPHP Thread Safety Violations
**Related Topics:** RoadRunner Architecture and Goridge, RoadRunner Benchmark Performance, Laravel Octane Driver Selection, PHP-FPM Worker Management

