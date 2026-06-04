# KU-06-ROADRUNNER-BINARY: RoadRunner Binary

## Metadata
- **ID**: KU-06-ROADRUNNER-BINARY
- **Subdomain**: Compute Optimization
- **Topic**: RoadRunner Binary
- **Source**: Compute Optimization, AWS Documentation, Industry Research
- **Reliability**: High

## Executive Summary
RoadRunner is a high-performance PHP application server written in Go that serves as the backbone for Laravel Octane. Unlike Swoole (a PHP extension), RoadRunner is a standalone binary that communicates with PHP workers via gorge (Go-PHP bridge). For cost optimization, RoadRunner enables smaller container images, simpler deployment, and better resource utilization compared to traditional PHP-FPM or Swoole-based Octane.

## Core Concepts
- **RoadRunner binary**: ~15MB Go binary; replaces Nginx/Apache/FPM; listens on HTTP port
- **Gorge bridge**: Unix socket or TCP pipe between Go server and PHP workers
- **Worker pool**: PHP processes managed by RoadRunner; dynamically scaled
- **Plugins**: RoadRunner plugins for HTTP, gRPC, jobs, temporal, key-value, etc.
- **Configuration**: `.rr.yaml` file defining worker pool, plugins, server settings
- **Service mode**: RoadRunner runs as systemd service or container entrypoint

## Mental Models
- Default: recommend RoadRunner over Swoole for Octane deployments
- Default .rr.yaml: workers = CPU cores, max_jobs = 500, max_memory = 128MB
- Docker image should be single binary (no Nginx)

## Internal Mechanics
- RoadRunner memory overhead: ~10MB for Go binary + ~80-150MB per PHP worker
- vs Nginx+FPM: RoadRunner eliminates Nginx overhead (~5-10MB) but adds more per-worker PHP memory
- Request throughput: RoadRunner handles 2000+ req/s on mid-range server
- Worker restart cost: ~50-100ms CPU for Laravel boot (but amortized across 500 requests)
- Static file serving: Go's HTTP server is ~2x faster than Nginx for static files

## Patterns
- Use RoadRunner for Octane over Swoole
- Configure worker pool size
- Serve static files from RoadRunner
- Monitor RoadRunner metrics
- Use .env per environment

## Architectural Decisions
- Single Docker image with `rr` binary + PHP code; no Nginx or Apache
- Expose port 8080 (RoadRunner default) and point ALB to it
- Use `supervisord` or Kubernetes sidecar for RoadRunner process management
- Configure `max_jobs: 500` and `max_memory: 128` (128MB per worker restart threshold)
- Enable `logs` plugin for structured JSON logging (easier log aggregation)
- For static assets, enable `static` plugin; for dynamic content, use `http` plugin

## Tradeoffs
**When To Use:**
- RoadRunner Octane: Default choice for Laravel Octane deployments (simpler than Swoole)
- Containerized environments: Docker images with RoadRunner binary (~30MB) vs FPM+Nginx (~200MB)
- Kubernetes deployments: Single process model (RR handles HTTP + static files)
- Teams without PHP extension experience: RoadRunner requires no PHP extensions (unlike Swoole)
- Multi-protocol apps: RoadRunner supports HTTP, gRPC, jobs (queue workers), WebSocket from one binary

**When NOT To Use:**
- Existing Nginx/FPM infrastructure: Migrating solely for RoadRunner may not justify effort for low-traffic apps
- Swoole-only features: If app uses Swoole-specific features (coroutines, async I/O), stay with Swoole
- App under 50 req/s: PHP-FPM + Nginx with OPcache handles this trivially; RoadRunner adds operational complexity
- Team unfamiliar with Go: Troubleshooting RoadRunner requires understanding Go binaries and configuration

## Performance Considerations
- RoadRunner memory overhead: ~10MB for Go binary + ~80-150MB per PHP worker
- vs Nginx+FPM: RoadRunner eliminates Nginx overhead (~5-10MB) but adds more per-worker PHP memory
- Request throughput: RoadRunner handles 2000+ req/s on mid-range server
- Worker restart cost: ~50-100ms CPU for Laravel boot (but amortized across 500 requests)
- Static file serving: Go's HTTP server is ~2x faster than Nginx for static files

## Production Considerations
- RoadRunner binary should be scanned for vulnerabilities (Go dependencies)
- Run RoadRunner as non-root user (create `rr` user in Dockerfile)
- Restrict `.rr.yaml` file permissions (contains server settings)
- Enable TLS at ALB level; RoadRunner behind ALB terminates at edge
- Monitor for process restarts (frequent restarts may indicate attempts to exploit memory limits)

## Common Mistakes
- **Not configuring max_jobs**: Workers never restart; memory grows unbounded (Cause: assuming Octane workers are immortal; Consequence: memory leaks compound; workers crash after hours/days; Better: set max_jobs: 500 to restart workers after 500 requests)
- **Over-allocating workers**: Setting workers > 2x CPU cores for I/O-bound app without monitoring context switching (Cause: "more workers = more throughput"; Consequence: CPU thrashing, throughput drops; Better: start with workers = CPU cores, benchmark, increase to 1.5x for I/O-heavy)
- **No health check for RoadRunner**: Assuming RR never fails (Cause: Nginx-based thinking; Consequence: RR crash causes total downtime; Better: configure ALB health check on `/health` endpoint, use `supervisord` auto-restart)

## Failure Modes
- **Nginx in front of RoadRunner**: Adding unnecessary reverse proxy layer; RoadRunner serves HTTP directly
- **Running RoadRunner as root**: Security risk; create dedicated `rr` user
- **Using RoadRunner for legacy Laravel 7/8**: Octane requires Laravel 9+

## Ecosystem Usage
- **Docker image**: `FROM php:8.3-cli` -> `ADD https://github.com/roadrunner-server/roadrunner/releases/download/v2024.1/rr-linux-amd64.zip .` -> `rr serve`
- **.rr.yaml**: `http: { address: 0.0.0.0:8080, pool: { num_workers: 8, max_jobs: 500, max_memory: 128 } }`
- **Kubernetes**: Single container running `rr serve`; liveness probe on `:8080/health`

## Related Knowledge Units
- Octane Resource Usage (ku-05)
- Worker Pool Sizing (ku-07)
- PHP-FPM Tuning (ku-03)
- Server Provisioning (ku-02)

## Research Notes
Derived from Compute Optimization, AWS Documentation, Industry Research. See 04-standardized-knowledge.md for complete research details.