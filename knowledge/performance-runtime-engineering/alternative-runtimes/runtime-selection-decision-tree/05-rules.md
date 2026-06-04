## Benchmark your specific workload before selecting a runtime
---
Category: Performance
---
Always benchmark with production-representative traffic before committing to an alternative runtime. Never rely on generic published benchmarks.
---
Reason: Runtime performance varies dramatically by I/O profile. Swoole can be 10% slower than FPM with sub-1ms queries but 5x faster with 50ms+ queries. Only your specific workload determines which runtime wins.
---
Bad Example:
```bash
# Choosing Swoole because "benchmarks show 5x improvement"
# Actual workload: 0.5ms DB queries → Swoole is 10% slower than FPM
```

Good Example:
```bash
# Benchmark with production traffic profile
wrk2 -t4 -c64 -d120s -R 2000 http://app/api/endpoint
# Test each runtime with the same profile
```
---
Exceptions: Greenfield applications where no production traffic exists — use RoadRunner as the safest default.
---
Consequences Of Violation: Performance regression vs FPM, added complexity without throughput gain.

## Start with RoadRunner — safest default for Laravel Octane
---
Category: Architecture
---
Choose RoadRunner as the default runtime for Laravel Octane deployments. Only switch to Swoole or FrankenPHP if specific requirements justify it.
---
Reason: RoadRunner requires no PHP extension, has the best enterprise stability track record, provides 41-111% improvement over FPM, and is the most proven Octane driver. It minimizes migration risk.
---
Bad Example:
```bash
# Starting with Swoole (most complex) without justification
composer require laravel/octane
php artisan octane:install --server=swoole
```

Good Example:
```bash
# Start with RoadRunner (safest default)
composer require laravel/octane spirals/roadrunner
php artisan octane:install --server=roadrunner
```
---
Exceptions: Teams with existing Swoole expertise or workloads with >50ms database latency where Swoole's coroutine advantage is proven.
---
Consequences Of Violation: Unnecessary complexity, extension dependency issues, longer migration timeline.

## Use FrankenPHP when operational simplicity is the top priority
---
Category: Architecture
---
Choose FrankenPHP when the primary goal is reducing infrastructure complexity (single binary replacing Nginx + FPM + certbot).
---
Reason: FrankenPHP's single binary eliminates the Nginx/PHP-FPM stack entirely, provides automatic HTTPS via ACME, and includes HTTP/3 support. For teams prioritizing simplicity over maximum tuning flexibility, it's ideal.
---
Bad Example:
```bash
# Running Nginx + FPM + certbot for a single-service deployment
# Three separate services to manage
```

Good Example:
```caddy
# FrankenPHP — single binary
localhost:8080 {
    root * /app/public
    php_server
}
```
---
Exceptions: Teams requiring Nginx-specific features (complex rewrite rules, custom modules) not available in Caddy.
---
Consequences Of Violation: Unnecessary operational complexity managing three services when one suffices.

## Never select a runtime before identifying the bottleneck
---
Category: Maintainability
---
Profile your application bottleneck before selecting an alternative runtime. If the database is the bottleneck, changing the runtime won't fix it.
---
Reason: Alternative runtimes improve PHP request throughput by eliminating bootstrap overhead and enabling async I/O. If the bottleneck is database query speed (not PHP execution), no runtime change will help. Fix the bottleneck first.
---
Bad Example:
```bash
# Adopting Swoole for a 300ms DB query
# 300ms wait → 5ms bootstrap → runtime change saves 5ms (1.6%)
```

Good Example:
```bash
# Profile first: 300ms DB query + 5ms PHP = DB is bottleneck
# Optimize query (300ms → 30ms) then consider runtime
```
---
Exceptions: Applications where the bottleneck is unknown — profiling is the first step in either case.
---
Consequences Of Violation: 1-5% improvement from runtime change when the real bottleneck is 10-100x larger.
