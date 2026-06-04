# Standardized Knowledge: RoadRunner Installation and Configuration

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | RoadRunner Installation and Configuration |
| Difficulty | Intermediate |
| Lifecycle | Implement, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

RoadRunner is a standalone Go binary — no PHP extension required. Download the `rr` binary, create a `.rr.yaml` configuration file defining worker pools, and PHP workers communicate via Goridge (binary protocol over stdout/stdin pipes). The Go process manages the goroutine scheduler; PHP workers handle request business logic.

## Core Concepts

- **Installation**: Download binary from GitHub releases (`rr` or `roadrunner`). `./rr serve` starts the server. Can also install via Composer: `composer require spiral/roadrunner:^2024`.
- **.rr.yaml**: Main configuration file defining server (address, workers), worker pool (num_workers, max_jobs, timeout), and plugins (http, grpc, queues, etc.).
- **Goridge Protocol**: Binary frame protocol. Go ↔ PHP communication via pipe. Each frame: byte flags + uint64 length + payload. ~1μs per message overhead.
- **PHP Worker**: A long-running PHP script that receives requests, handles them, and sends responses back via Goridge.

## When To Use

- Setting up a new RoadRunner-based application server
- Migrating from PHP-FPM to a memory-resident runtime with minimal extension dependencies
- Configuring Laravel Octane with RoadRunner driver
- Deploying applications that need gRPC, WebSocket, or queue plugins

## When NOT To Use

- Already using Swoole or FrankenPHP for the same application
- Environments where downloading Go binaries is restricted by security policy
- Applications requiring per-request process isolation (use FPM instead)
- Teams without experience with YAML configuration and Go process management

## Best Practices

- **Install via binary download**: Use the official GitHub release binary for your platform. Composer installation is convenient but may lag behind release versions.
- **Version-lock the binary**: Always pin to a specific RoadRunner version in deployment scripts. Breaking changes occur across major versions.
- **Configure max_jobs for memory safety**: Set `max_jobs: 1000` as starting point. Lower to 500 for memory-intensive applications; raise to 2000 for stable workloads.
- **Set allocate_timeout realistically**: 60s is standard. If workers don't start within this window, RoadRunner reports failure.
- **Enable worker supervision**: Configure `max_worker_memory` (MB) in the supervisor section to automatically restart workers exceeding memory thresholds.

## Architecture Guidelines

- **PHP Worker Bootstrap**: The worker.php script should be minimal — require autoloader, create the Goridge relay, then enter the event loop. All heavy initialization happens once at startup.
- **Plugin Configuration**: Each plugin (http, grpc, queues, etc.) gets its own section in `.rr.yaml`. Enable only what you need to minimize attack surface and memory usage.
- **Environment Variable Injection**: Use the `env` section in `.rr.yaml` to inject environment variables into PHP workers without modifying worker.php.
- **Multiple Worker Pools**: RoadRunner supports multiple worker pools for different application endpoints. Use separate pools for API vs admin vs background processing.

## Performance Considerations

- No PHP extension: zero compilation issues, no ZTS requirement, no C extension compatibility problems
- Worker pool: 4-16 PHP workers per CPU core depending on workload. More workers = higher concurrency but more memory
- 41-111% throughput improvement over PHP-FPM in benchmarks — purely from eliminating per-request bootstrap
- Goridge protocol adds ~1μs per message — negligible in web request contexts

## Security Considerations

- The `.rr.yaml` file may contain sensitive configuration. Restrict file permissions to the RoadRunner user.
- Goridge RPC ports should be bound to localhost only in production.
- PHP worker scripts should sanitize all incoming data — RoadRunner deserializes requests before passing to workers.
- RoadRunner binary should be verified against checksums from the official GitHub release.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running RoadRunner without OpCache | Assuming persistent workers eliminate OpCache need | 10-20% unnecessary CPU overhead on worker operations | Always enable OpCache alongside RoadRunner |
| Missing max_jobs configuration | Not configuring worker recycling | Memory drift causes gradual performance degradation | Set max_jobs to 500-2000 |
| Incorrect pool sizing | Guessing num_workers without memory calculation | Workers OOM or pool is underutilized | Calculate from P95 RSS with 1.2x safety factor |
| Using TCP for Goridge when Unix socket is available | Default configuration not optimized | Higher latency and security risk | Configure Unix socket relay for local communication |

## Anti-Patterns

- **Installing RoadRunner via apt/yum**: Distribution packages are often outdated. Use the official GitHub binary.
- **Running RoadRunner as root**: The Go binary should run under an unprivileged user. Use systemd `User=` directive or Supervisor `user=` setting.
- **Sharing .rr.yaml across environments**: Worker counts, timeouts, and log levels should differ between dev, staging, and production.
- **Hardcoding environment-specific values in worker.php**: Use `.rr.yaml` env section for environment-specific configuration.

## Examples

```yaml
# .rr.yaml — Full configuration example
version: '3'
server:
  command: "php worker.php"
  env:
    - APP_ENV: production
    - DB_HOST: localhost
http:
  address: "0.0.0.0:8080"
  pool:
    num_workers: 8
    max_jobs: 1000
    allocate_timeout: 60s
    supervisor:
      max_worker_memory: 100
      ttl: 3600s
rpc:
  listen: tcp://127.0.0.1:6001
logs:
  mode: development
  level: error
```

## Related Topics

- RoadRunner Architecture and Goridge
- RoadRunner Benchmark Performance
- Laravel Octane Driver Selection
- PHP-FPM Worker Management

## AI Agent Notes

- RoadRunner v2 and v3 have different `.rr.yaml` schemas. Always check version documentation.
- The `rr` binary name has changed between versions — some releases use `roadrunner` as the binary name.
- Goridge protocol is not human-readable. Use `rr workers -i` or RPC for debugging worker status.
- RoadRunner's `supervisor` section manages PHP worker process lifecycle, not system-level process supervision.

## Verification

- [ ] RoadRunner binary downloaded and verified
- [ ] `.rr.yaml` configured with server, http, and pool sections
- [ ] PHP worker script implements Goridge relay correctly
- [ ] OpCache configured and verified working
- [ ] max_jobs configured (500-2000)
- [ ] Worker pool memory budget calculated
- [ ] Goridge relay using optimized transport (Unix socket)
- [ ] Process supervision configured (systemd or Supervisor)
- [ ] Binary version pinned in deployment scripts
