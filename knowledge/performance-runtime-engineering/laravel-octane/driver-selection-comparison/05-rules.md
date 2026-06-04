## Start with RoadRunner as the default Octane driver unless specific requirements dictate otherwise
---
Category: Framework Usage
---
Choose RoadRunner as the default Octane driver for new deployments and only evaluate Swoole or FrankenPHP when specific requirements (coroutine-based I/O concurrency, single-binary deployment, automatic HTTPS) justify the added complexity.
---
Reason: RoadRunner requires no PHP extension (no ZTS, no compilation issues), provides process-level isolation (strongest security boundary), and has the largest production deployment track record for Laravel Octane. Swoole requires coroutine-safe code auditing and extension compilation. FrankenPHP requires ZTS-compatible extensions. RoadRunner's zero-extension requirement and enterprise maturity make it the lowest-risk choice.
---
Bad Example:
```bash
# Starting with Swoole without evaluation — extension complexity risk
php artisan octane:start --server=swoole
# Later: coroutine-unsafe library causes intermittent data corruption
```

Good Example:
```bash
# Default to RoadRunner — proven, no extensions needed
php artisan octane:start --server=roadrunner
```
---
Exceptions: Choose Swoole when database/API latency exceeds 50ms and coroutine concurrency is measurably beneficial. Choose FrankenPHP when single-binary deployment simplicity is the top priority.
---
Consequences Of Violation: Unnecessary complexity in first Octane deployment, extension-related delays, coroutine debugging overhead for minimal throughput gain.

## Benchmark all three Octane drivers with your specific application workload before selecting
---
Category: Testing
---
Run application-specific benchmarks comparing RoadRunner, Swoole, and FrankenPHP under your actual traffic patterns, I/O profiles, and data sizes — do not rely on published benchmark comparisons.
---
Reason: Published benchmarks show RoadRunner at 2.1x and FrankenPHP at 1.8x for low-I/O workloads, while Swoole reaches 3.2x for high-I/O workloads. However, these numbers vary dramatically by application. A Laravel app with 2ms database queries may see RoadRunner outperform Swoole, while an app with 80ms queries may see Swoole dominate. Only workload-specific benchmarks reveal the true comparison for your application.
---
Bad Example:
```bash
# Choosing Swoole based on published benchmarks
# "Swoole is 3.2x faster" — but your queries are 2ms, not 80ms
```

Good Example:
```bash
# Workload-specific benchmark
# RoadRunner: 2100 RPS, Swoole: 1950 RPS, FrankenPHP: 1800 RPS
# RoadRunner selected — best for this workload
```
---
Exceptions: When operational simplicity (not throughput) is the primary decision driver, benchmarking is secondary to the ops overhead comparison.
---
Consequences Of Violation: Selecting a slower driver for your specific workload, disappointing production performance, wasted migration effort.

## Never run Octane without a reverse proxy in front of it
---
Category: Security
---
Place Octane behind Nginx, Caddy, or a cloud load balancer in production — never expose Octane's built-in HTTP server directly to the internet.
---
Reason: Octane's built-in HTTP server is optimized for PHP execution, not edge security. A reverse proxy provides SSL termination, rate limiting, static file serving, connection limiting, and protection against slow HTTP attacks and request smuggling. Exposing Octane directly bypasses all these security layers and increases the attack surface of the application.
---
Bad Example:
```bash
# Octane exposed directly — no reverse proxy
php artisan octane:start --host=0.0.0.0 --port=80
```

Good Example:
```nginx
# Nginx reverse proxy in front of Octane
server {
    listen 443 ssl;
    location / {
        proxy_pass http://127.0.0.1:8000;  # Octane on localhost only
    }
}
```
---
Exceptions: In development or internal-only environments behind a VPN, direct Octane access may be acceptable.
---
Consequences Of Violation: Exposure to slow HTTP attacks, no SSL termination, no rate limiting, increased risk of connection-based attacks against PHP workers.

## Run a 24-hour soak test with your chosen Octane driver before production deployment
---
Category: Testing
---
Subject the selected Octane driver to a minimum 24-hour soak test with production-representative traffic to detect memory leaks, worker crashes, and data integrity issues before going live.
---
Reason: Octane's persistent workers reveal memory leaks, static property contamination, and connection leaks that only surface after hours of operation. A 30-minute benchmark will not detect a worker growing at 5MB RSS per hour. The 24-hour soak provides enough data to trend RSS growth, count worker crashes, and verify that state isolation holds under continuous concurrent load.
---
Bad Example:
```bash
# 30-minute benchmark — misses long-term issues
# Deployed to production, worker OOM after 8 hours
```

Good Example:
```bash
# 24-hour soak test
# Hour 0-6: RSS stable at 75MB — OK
# Hour 6-12: RSS growing at 3MB/hour — memory leak detected
# Root cause identified and fixed before production
```
---
Exceptions: When migrating a proven driver (e.g., RoadRunner) between environments with identical code, a reduced soak (4-8 hours) may suffice.
---
Consequences Of Violation: Undetected memory leaks cause production OOM incidents, data integrity issues from state leaks across requests, emergency rollback.
