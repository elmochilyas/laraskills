# Standardized Knowledge: FrankenPHP Installation and Caddyfile

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Alternative PHP Runtimes |
| Knowledge Unit | FrankenPHP Installation and Caddyfile |
| Difficulty | Intermediate |
| Lifecycle | Implement, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

FrankenPHP is distributed as a single binary containing the Caddy web server with embedded PHP via CGO. No separate Nginx/PHP-FPM setup is needed. Configuration uses the Caddyfile with `php_server` and `php` directives. Worker mode maintains persistent PHP threads for maximum performance (3-5x vs FPM). Automatic HTTPS via ACME is built in.

## Core Concepts

- **Installation**: Download the binary from GitHub releases for your platform (Linux, macOS, Windows). `./frankenphp php-server` runs in standard mode. Add `--workers` for worker mode.
- **Caddyfile Basics**: Standard Caddyfile syntax with `php_server { }` block. Key directives: `root`, `worker { num_threads 4 max_threads 8 }`, `resolve_root_symlink`.
- **Worker Mode**: `frankenphp php-server --workers` — boots PHP once per thread. Each thread handles multiple requests. Requires `num_threads` and `max_threads` configuration.
- **Standard Mode**: Classic CGI-like behavior — PHP process per request (similar to FPM but embedded). Simpler but lower throughput.

## When To Use

- Setting up a new FrankenPHP application server from scratch
- Migrating from Nginx + PHP-FPM to a single-binary runtime
- Configuring worker mode for maximum throughput in production
- Deploying FrankenPHP in containerized environments with minimal infrastructure

## When NOT To Use

- Environments where the FrankenPHP binary is not available for the target architecture
- Applications requiring Nginx-specific features not available in Caddy
- Teams with extensive existing Nginx configuration that cannot be translated to Caddyfile syntax
- Development environments where each code change requires server restart (use hot-reload instead)

## Best Practices

- **Always use `--workers` for production**: Worker mode provides the 3-5x throughput advantage. Standard mode is comparable to FPM.
- **Set resolve_root_symlink**: Enable this directive if your deployment uses symlinks for zero-downtime releases.
- **Configure num_threads and max_threads**: Start with `num_threads = CPU cores` and `max_threads = CPU cores × 2`. Adjust based on memory budget.
- **Enable compression**: Caddy's `encode gzip` directive reduces bandwidth with minimal CPU overhead.
- **Use environment variables**: Inject environment-specific configuration via `os.Getenv` in Caddyfile or direct environment variables.

## Architecture Guidelines

- **Caddyfile vs .rr.yaml**: FrankenPHP uses Caddyfile syntax (similar to Nginx configuration). RoadRunner uses YAML. The learning curve is different for each.
- **Standard Mode vs Worker Mode**: Standard mode creates a new PHP process per request (like FPM). Worker mode persists PHP across requests. Always use worker mode for production APIs.
- **Hot Reload**: FrankenPHP supports hot reload via Caddy's file watching. Use `--watch` during development to auto-reload on file changes.
- **Docker Deployment**: The official FrankenPHP Docker image includes the binary with PHP compiled for ZTS. Use it as a base image rather than building from scratch.

## Performance Considerations

- Worker mode: 3-5x throughput vs PHP-FPM in benchmarks
- Standard mode: Comparable to PHP-FPM + Nginx (within 5-10%)
- Single binary deployment: Replaces Nginx, PHP-FPM, and certbot with one artifact
- Thread pool auto-scaling: Threads scale between num_threads and max_threads based on demand

## Security Considerations

- The Caddyfile should not contain secrets. Use environment variables or external secret stores for sensitive values.
- Caddy's automatic HTTPS handles TLS certificate provisioning and renewal. No manual certificate management needed.
- Restrict `php_server` blocks to application directories to prevent arbitrary PHP file execution.
- FrankenPHP inherits Caddy's security model — use `internal` directives for sensitive paths.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Running in standard mode for high throughput | Not using `--workers` flag | No performance gain over PHP-FPM | Always use `--workers` for production API workloads |
| Incorrect root path in Caddyfile | Path misconfiguration | Static files served incorrectly or 404 errors | Verify root path matches the application's public directory |
| Missing worker configuration | No num_threads/max_threads configured | Default limits may not match workload | Explicitly configure worker block in php_server |
| Alpine-based Docker image | Smaller image preference | 10-20% performance penalty | Use debian-slim (glibc) based images for production |

## Anti-Patterns

- **Modifying the binary**: The FrankenPHP binary is a pre-compiled artifact. Use the Caddyfile for configuration, not binary patching.
- **Running FrankenPHP behind Nginx**: This defeats the purpose of the single-binary architecture. If you need Nginx features, use standalone Caddy.
- **Skipping worker mode documentation**: The `--workers` flag is well-documented but frequently missed, leading to disappointing performance.
- **Manually managing TLS certificates**: FrankenPHP's ACME integration handles TLS automatically. Manual certificate management adds unnecessary complexity.

## Examples

```caddy
# Production Caddyfile for FrankenPHP worker mode
production.example.com {
    root * /var/www/app/public
    encode gzip
    php_server {
        worker {
            num_threads 4
            max_threads 8
            max_requests 1000
        }
    }
    file_server
    log {
        output file /var/log/frankenphp/access.log
    }
}
```

## Related Topics

- FrankenPHP Architecture
- FrankenPHP Worker Thread Management
- FrankenPHP Container Memory Management
- Runtime Selection Decision Tree

## AI Agent Notes

- FrankenPHP requires `--workers` flag for worker mode. Without it, performance is comparable to FPM.
- The Caddyfile is the primary configuration interface. Unlike RoadRunner's YAML, Caddyfile uses a domain-specific syntax similar to Nginx.
- FrankenPHP Docker images are available with ZTS-compiled PHP. Building from source is complex — prefer the official images.
- The `resolve_root_symlink` directive is specifically used for symlink-based zero-downtime deployments.

## Verification

- [ ] FrankenPHP binary downloaded and verified
- [ ] `--workers` flag configured for production mode
- [ ] Caddyfile created with php_server block
- [ ] num_threads and max_threads configured
- [ ] Root path points to application public directory
- [ ] TLS configured (automatic HTTPS or custom certificate)
- [ ] Logging configured for access and error logs
- [ ] Containerized if using Docker — official base image used
