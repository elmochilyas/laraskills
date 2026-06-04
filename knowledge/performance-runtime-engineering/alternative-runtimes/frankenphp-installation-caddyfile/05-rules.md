## Always use the --workers flag for production FrankenPHP deployments
---
Category: Configuration
---
Launch FrankenPHP with the `--workers` flag in all production environments to enable persistent PHP thread mode.
---
Reason: Without `--workers`, FrankenPHP runs in standard mode, creating a new PHP process per request — comparable to PHP-FPM performance (within 5-10%). Worker mode boots PHP once per thread and handles many requests, delivering the 3-5x throughput advantage that justifies the migration. Running without `--workers` in production wastes the runtime's primary benefit.
---
Bad Example:
```bash
# Standard mode in production — no performance gain over FPM
./frankenphp php-server
```

Good Example:
```bash
# Worker mode for production
./frankenphp php-server --workers
```
---
Exceptions: Development environments where hot-reload is preferred over maximum throughput may use standard mode.
---
Consequences Of Violation: Performance comparable to PHP-FPM, wasted migration effort, team concludes FrankenPHP "isn't faster" based on a misconfigured deployment.

## Configure num_threads and max_threads explicitly in every php_server block
---
Category: Configuration
---
Always configure the worker block with num_threads and max_threads in the Caddyfile — never rely on FrankenPHP's default thread pool limits.
---
Reason: Default limits may not match your workload's concurrency or memory budget. num_threads too low causes listen queue buildup under baseline traffic. max_threads too high causes OOM. Explicit configuration forces a deliberate sizing decision based on your CPU count and available memory, preventing silent performance issues.
---
Bad Example:
```caddy
# No worker block — defaults apply, may not match workload
php_server {
    root * /app/public
}
```

Good Example:
```caddy
php_server {
    root * /app/public
    worker {
        num_threads 4
        max_threads 12
        max_requests 2000
    }
}
```
---
Exceptions: Development environments where default limits are sufficient for low traffic may skip explicit configuration.
---
Consequences Of Violation: Thread pool mismatched to workload — either insufficient capacity (listen queue buildup) or excessive memory consumption (OOM risk).

## Enable resolve_root_symlink in Caddyfile for symlink-based zero-downtime deployments
---
Category: Reliability
---
Add the `resolve_root_symlink` directive to the php_server block when using symlink-swap deployment strategies.
---
Reason: Without this directive, FrankenPHP caches the resolved path at startup and continues serving from the old directory after a symlink swap. This defeats zero-downtime deployments — new code is deployed but old code continues executing until the server restarts. `resolve_root_symlink` ensures each request resolves through the current symlink target.
---
Bad Example:
```caddy
# No symlink resolution — zero-downtime deployments broken
php_server {
    root * /var/www/app/public
}
```

Good Example:
```caddy
php_server {
    root * /var/www/app/public
    resolve_root_symlink
}
```
---
Exceptions: Environments that do not use symlink-based deployments (e.g., immutable container images) can omit this directive.
---
Consequences Of Violation: New code deployed but old code serves requests, zero-downtime deployment mechanism defeated, rollbacks also broken.

## Never run FrankenPHP behind Nginx — use Caddy as the sole web server
---
Category: Architecture
---
Use FrankenPHP (embedded Caddy) as the standalone web server; do not add Nginx or another reverse proxy in front of it.
---
Reason: FrankenPHP's single-binary architecture replaces Nginx + PHP-FPM + certbot with one process. Adding Nginx in front reintroduces the infrastructure complexity that FrankenPHP eliminates, adds latency from an extra network hop, and defeats the operational simplicity that is FrankenPHP's primary advantage over RoadRunner and Swoole.
---
Bad Example:
```nginx
# Nginx in front of FrankenPHP — defeats the purpose
location / {
    proxy_pass http://127.0.0.1:8080; # Extra hop, extra complexity
}
```

Good Example:
```caddy
# FrankenPHP as the sole web server
localhost:8080 {
    php_server {
        worker {
            num_threads 4
        }
    }
}
```
---
Exceptions: When a specific Nginx feature (not available in Caddy) is required, use standalone Caddy instead of Nginx + FrankenPHP.
---
Consequences Of Violation: Extra network latency, operational complexity reintroduced, no benefit from single-binary architecture, team frustrated with "simpler" setup.
