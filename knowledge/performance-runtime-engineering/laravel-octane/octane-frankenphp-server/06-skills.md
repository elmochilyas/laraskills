# Skill: Operate and Tune Laravel Octane with FrankenPHP Driver

## Purpose
Configure, deploy, and tune FrankenPHP as the Laravel Octane driver — enabling worker mode, sizing thread pools, setting GOMEMLIMIT for containers, securing the single binary, and implementing graceful lifecycle management for production deployments.

## When To Use
- Running Laravel Octane with FrankenPHP as the chosen driver
- Deploying FrankenPHP to production for the first time
- Containerizing a Laravel application with FrankenPHP
- Tuning FrankenPHP thread pool settings based on monitoring data
- Setting up FrankenPHP-specific monitoring and lifecycle management

## When NOT To Use
- When using RoadRunner or Swoole as the Octane driver (different configuration semantics)
- Without first enabling worker mode (standard mode provides no Octane benefit)
- When PHP extensions are not ZTS-compatible (FrankenPHP requires ZTS builds)
- When the team prefers process-level isolation over thread-level isolation

## Prerequisites
- Laravel application with `laravel/octane` installed
- FrankenPHP selected as the driver (`php artisan octane:install` with FrankenPHP option)
- FrankenPHP binary downloaded (or Docker image pulled)
- Caddyfile configuration for the application
- ZTS-compatible PHP extensions verified for all required extensions
- Server or container environment with CPU core count and memory limit known

## Inputs
- Caddyfile configuration (required for FrankenPHP)
- Server specifications: CPU cores, RAM (or container memory limit)
- Workload profile: CPU-bound or I/O-bound
- PHP extension list (all must be ZTS-compatible)
- Container memory limits (if containerized)
- Current expected traffic RPS and endpoint latency

## Workflow

### 1. Verify FrankenPHP Installation and Worker Mode
- Confirm FrankenPHP binary is available: `./frankenphp version`
- Verify Octane driver is set to FrankenPHP in `config/octane.php`
- Run `php artisan octane:start --server=frankenphp` in worker mode
- Check logs for "worker mode enabled" message
- If worker mode is not active, enable it with the `--workers` flag or `frankenphp_worker` Caddyfile directive
- Verify the server responds: `curl http://localhost:8000/octane/health`

### 2. Configure the Caddyfile for Production
- Create a Caddyfile with:
  - `frankenphp` global directive
  - Site block with `root * /app/public`
  - `php_server` block with `worker` configuration
  - `file_server` for static assets
- Example:
```caddyfile
frankenphp

localhost:8080 {
    root * /app/public
    php_server {
        worker {
            num_threads 4
            max_threads 8
            max_requests 1000
        }
    }
    file_server
}
```
- For production: configure the site domain instead of localhost and enable automatic HTTPS via Caddy's ACME support

### 3. Size Thread Pool Appropriately
- Set `num_threads` to the number of CPU cores (or container CPU limit)
- Set `max_threads` to 1.5-2× CPU cores for I/O-bound workloads
- For CPU-bound workloads: keep `num_threads = max_threads = CPU cores`
- For containers with CPU limits: base thread count on the effective CPU limit (e.g., `--cpus=2` → 2 threads)
- Never set `num_threads` below 2 for production (no concurrency benefit)
- Never set `num_threads` above CPU cores × 3 (thread contention degrades performance)

### 4. Configure Thread Recycling
- Set `max_requests` to 1000 as the safe default
- Monitor thread RSS growth to calibrate:
  - RSS growth < 5% per 1000 requests: increase to 5000
  - RSS growth > 20% per 1000 requests: decrease to 300-500
- Never omit `max_requests` — unbounded memory drift causes eventual OOM
- Set `max_wait_time` to 30s for graceful thread pool downsizing

### 5. Configure Container Memory Limits
- Set `GOMEMLIMIT` environment variable to 80% of the container memory limit
- Example: container limit 512MiB → `GOMEMLIMIT=410MiB`
- This prevents the Go runtime heap from causing OOM kills
- Leave 20% headroom for PHP thread memory, page cache, and filesystem buffers
- Also set `PHP_MEMORY_LIMIT` for PHP's internal memory limit (typically 256-512MB)

### 6. Secure the FrankenPHP Binary
- Run FrankenPHP as a non-root user
- Use `setcap` for binding to privileged ports (<1024):
  `sudo setcap CAP_NET_BIND_SERVICE=+eip ./frankenphp`
- Set file permissions: binary owned by deploying user, not world-writable
- In containers: run with `--read-only` root filesystem and `--cap-drop=ALL --cap-add=NET_BIND_SERVICE`

### 7. Set Up Container Deployment
- Use `dunglas/frankenphp` Docker image as base (official images available)
- Choose Alpine/musl builds for smaller images (~50MB smaller than glibc)
- Copy application code and Caddyfile into the image
- Configure health checks using container's health check mechanism or Octane's `/octane/health`
- Example Dockerfile:
```dockerfile
FROM dunglas/frankenphp:1.7-alpine
COPY . /app
WORKDIR /app
ENV GOMEMLIMIT=800MiB
EXPOSE 80 443
CMD ["frankenphp", "run", "--config", "Caddyfile"]
```

### 8. Implement Graceful Lifecycle Management
- Use `USR2` signal for graceful reload: `kill -USR2 <frankenphp_pid>`
- This forces threads to recycle after completing their current request
- New threads boot with updated code
- Verify during reload: no in-flight requests are dropped
- In containers, configure `lifecycle.preStop` hook to send USR2 before container termination
- Monitor thread state transitions during reload

### 9. Set Up FrankenPHP-Specific Monitoring
- Monitor thread RSS: track per-thread memory (threads share a process, so total RSS / thread count)
- Monitor Go runtime metrics: `GOMEMLIMIT` effectiveness, GC pauses, goroutine count
- Monitor thread pool: active threads, idle threads, queue depth
- Set up 103 Early Hints monitoring: verify `Link` headers are sent for supported pages
- Monitor ACME certificate renewal: Caddy handles this automatically, but track expiration dates

## Validation Checklist
- [ ] FrankenPHP starts in worker mode (check logs for "worker mode enabled")
- [ ] Caddyfile configured with correct root, php_server, worker block, and file_server
- [ ] Thread pool sized: num_threads = CPU cores, max_threads = 1.5-2× cores
- [ ] max_requests configured (1000 default, tuned based on RSS growth)
- [ ] GOMEMLIMIT set to 80% of container memory limit
- [ ] FrankenPHP running as non-root user with minimal capabilities
- [ ] Docker container image built with official FrankenPHP base image
- [ ] Graceful reload (USR2 signal) works without dropping requests
- [ ] Health check endpoint responding correctly
- [ ] 103 Early Hints verified (Link headers sent for supported pages)
- [ ] ACME HTTPS certificate provisioned automatically
- [ ] Thread RSS growth trending stable over 24-hour observation

## Common Failures

| Failure | Symptom | Root Cause | Mitigation |
|---------|---------|------------|------------|
| Worker mode not active | Throughput same as FPM | Started without --workers flag or frankenphp_worker directive | Add worker mode flag or directive |
| Container OOM killed | Process terminated by cgroup | GOMEMLIMIT not set, Go heap grows unbounded | Set GOMEMLIMIT to 80% of container limit |
| Thread contention | Throughput drops with more threads | num_threads > CPU cores × 3 | Reduce to CPU cores, max_threads to 2× cores |
| Binary fails to start | "exec format error" or loader error | Wrong binary for container base image (glibc vs musl) | Use musl build for Alpine, glibc build for Debian/Ubuntu |
| ZTS extension crash | Segfault or memory corruption | Non-ZTS-compatible PHP extension loaded | Remove incompatible extension or switch to RoadRunner |
| Empty response on first request | Thread still booting (2-5s) | Thread pool not warmed | Send warm-up requests after deploy |

## Decision Points

| Decision | How To Decide |
|----------|---------------|
| Worker mode vs standard mode | Always worker mode for production. Standard mode only for development with hot-reload |
| num_threads value | CPU cores for CPU-bound. CPU cores × 1.5-2 for I/O-bound. Base on container CPU limit if applicable |
| glibc vs musl build | musl/Alpine for smaller images (~50MB less). glibc for Debian/Ubuntu compatibility |
| With or without file_server | Always include file_server to serve static assets without PHP overhead |
| GOMEMLIMIT value | 80% of container memory limit. Leave 20% headroom for PHP and overhead |

## Performance Considerations
- Worker mode achieves 3-5× throughput over PHP-FPM (most significant for API endpoints <50ms)
- Each thread uses 20-60MB RSS — lower than RoadRunner workers because threads share memory
- CGO boundary crossing adds ~5-10% overhead compared to RoadRunner in some benchmarks
- 103 Early Hints improves LCP by 100-300ms for pages with CSS/JS assets
- Thread pool warming: first 2-5 requests after thread start may be slow due to Laravel bootstrap
- GOMEMLIMIT should be monitored — if GC pressure is too high, increase by 10% increments

## Security Considerations
- FrankenPHP runs PHP and the web server in a single process — a vulnerability in PHP code grants access to Caddy's memory space
- Run as non-root user with minimal capabilities — `setcap` for privileged ports
- All PHP extensions must be ZTS-compatible — non-ZTS extensions can cause segfaults or memory corruption
- ACME automatic certificate provisioning requires ports 80/443 accessible from the internet
- Container security: use `--read-only` filesystem and `--cap-drop=ALL` for defense in depth
- Thread-local state: a PHP crash in one thread can potentially crash the entire process

## Related Rules

| Rule | File | Application |
|------|------|-------------|
| Use worker mode in every production FrankenPHP deployment | `05-rules.md:1` | Step 1: verify worker mode |
| Set num_threads to CPU core count and max_threads to 1.5-2x | `05-rules.md:25` | Step 3: thread pool sizing |
| Set GOMEMLIMIT in every containerized FrankenPHP deployment | `05-rules.md:54` | Step 5: memory limit configuration |
| Set max_requests per thread (500-2000) to prevent memory drift | `05-rules.md:85` | Step 4: thread recycling |
| Never run FrankenPHP as root in production | `05-rules.md:117` | Step 6: security hardening |

## Related Skills

| Skill | Relation |
|-------|----------|
| Select the Optimal Octane Driver | FrankenPHP driver selection should precede this operational skill |
| Configure Octane Workers by Driver | General worker configuration skill with driver-specific details |
| Install and Configure Octane for a Laravel Project | Octane must be installed before FrankenPHP operation |
| Calculate and Manage Connection Budgets for Octane Workers | Connection budget calculations constrain thread count |
| Perform FPM-to-Octane Migration | FrankenPHP as an alternative migration target |

## Success Criteria
- FrankenPHP running in worker mode with correct thread pool configuration
- GOMEMLIMIT set and verified (no container OOM kills under load)
- Thread recycling configured (max_requests) and verified
- Binary secured with non-root user and minimal capabilities
- Graceful reload (USR2) works with zero dropped requests
- Health check endpoint responding
- 103 Early Hints delivering Link headers for supported pages
- ACME HTTPS certificate provisioned and auto-renewing
- Thread RSS stable over 24 hours (<10% growth)
- Container deployment working with official FrankenPHP base image
