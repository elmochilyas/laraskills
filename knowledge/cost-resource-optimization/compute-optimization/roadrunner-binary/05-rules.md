## Prefer RoadRunner Over Swoole for Octane
---
## Architecture
---
Prefer RoadRunner as the Octane server for new deployments; use Swoole only when maximum CPU-bound throughput is required.
---
RoadRunner is a standalone Go binary (~15MB) requiring no PHP extension compilation, simplifying Docker builds and CI/CD pipelines; Swoole requires pecl install and extension loading.
---
Dockerfile: `FROM php:8.3-cli` + ADD rr binary + `rr serve` — single binary, no Nginx.
---
Dockerfile with pecl install swoole, multiple extension configs, Nginx reverse proxy.
---
The app uses Swoole-specific features (coroutines, async I/O) not available in RoadRunner.
---
Complex Docker images, build failures from extension compilation, larger attack surface.
---
## Serve Static Files From RoadRunner
---
## Architecture
---
Enable RoadRunner's `static` plugin to serve assets directly; never run Nginx in front of RoadRunner for static file serving.
---
RoadRunner's Go HTTP server handles static files ~2x faster than Nginx; eliminating the reverse proxy reduces deployment complexity, memory usage, and points of failure.
---
.rr.yaml: `static: { dir: "public", forbid: [".php"] }` — single process handles everything.
---
Nginx reverse proxy in front of RoadRunner for static file serving.
---
Complex Nginx rules for URL rewriting, legacy infrastructure still using Nginx configs.
---
Unnecessary complexity, extra 5-10MB memory for Nginx, additional latency hop.
---
## Configure max_jobs for Memory Management
---
## Reliability
---
Always set `max_jobs: 500` in .rr.yaml to restart RoadRunner workers periodically; never leave workers running indefinitely.
---
PHP workers accumulate memory over time; max_jobs restarts a worker after N requests, preventing unbounded memory growth and OOM kills.
---
.rr.yaml: `pool: { num_workers: 4, max_jobs: 500, max_memory: 128 }`.
---
No max_jobs or max_memory configured, workers running until server crashes.
---
Workloads with proven zero memory leak profile verified through 48h+ monitoring.
---
Memory leaks compound; workers crash after hours/days, causing request failures.
---
## Configure Health Check Endpoint
---
## Reliability
---
Always configure a health check endpoint for RoadRunner and point ALB target group to it; never rely on TCP checks alone.
---
RoadRunner can be running (TCP port open) but its PHP workers may be deadlocked or exhausted; a proper HTTP health check verifies the full request pipeline.
---
ALB health check on `/health` returning 200; RoadRunner serves it via `http` plugin.
---
ALB TCP health check on port 8080 only.
---
Kubernetes liveness probes can use HTTP checks natively; not an exception, just a different platform.
---
ALB considers deadlocked workers "healthy," routing traffic to failing instances.
---
## Run RoadRunner as Non-Root User
---
## Security
---
Always run the RoadRunner binary as a dedicated non-root user; never run as root.
---
A compromised RoadRunner process running as root gives the attacker full system access; running as `rr` user limits blast radius to the application layer.
---
Dockerfile: `RUN useradd -r rr && ... USER rr` then `rr serve`.
---
`USER root` in Dockerfile running `rr serve`.
---
Environment where RoadRunner runs inside an already-secured container with no other services.
---
Full system compromise if RoadRunner process is exploited.
