# Octane Sizing for Laravel

## Metadata
- **ID**: KU-38-OCTANE-SIZING
- **Subdomain**: server-sizing-autoscaling
- **Domain**: cost-resource-optimization
- **Topic**: Octane Server Sizing for Laravel
- **Version**: 1.0
- **Classification**: Established
- **Maturity**: High

## Overview
A typical Laravel Octane server at 2 vCPU / 4GB RAM handles ~500-1000 concurrent users with sub-100ms response times. Octane's in-memory architecture changes server sizing: workers replace PHP-FPM processes, and the worker-to-CPU ratio is critical. For CPU-bound apps, use n+1 workers (n = vCPU count); for I/O-bound apps, use 2n to 4n workers. Memory sizing must account for per-worker overhead (50-100MB idle) plus application working set.

## Core Concepts
- **2 vCPU / 4GB baseline**: Handles 500-1000 concurrent users with Octane
- **Worker count**: n+1 (CPU-bound), 2n to 4n (I/O-bound)
- **Per-worker memory**: 50-100MB idle, 100-200MB under load
- **Connection pooling**: Octane reuses DB connections, reducing RDS connection count by 90%
- **vs PHP-FPM sizing**: Octane needs 1/3 to 1/10 the instances of PHP-FPM

## When To Use
- High-traffic Laravel applications needing maximum request throughput per server
- APIs and applications with sub-100ms response time requirements
- Deployments where reducing server count is a cost priority
- Applications with consistent traffic patterns where Octane workers stay warm
- Teams that have addressed memory leak issues (Octane workers persist across requests)

## When NOT To Use
- Applications with significant memory leaks (workers grow until OOM)
- Deployments requiring frequent code deploys (Octane needs graceful restart per deploy)
- Apps with low traffic (<100 req/s) where PHP-FPM simplicity outweighs Octane complexity
- Shared hosting environments where you cannot install Swoole/RoadRunner/FrankenPHP
- Applications using `dd()`, `die()`, or `exit()` that would terminate the entire worker

## Best Practices
- **Set worker count to (vCPU * 2) for general Laravel web apps**: Start with 2x vCPUs, monitor CPU and adjust (WHY: most Laravel apps are I/O-bound (database queries, external APIs); 2x vCPUs allows one worker to serve while another waits on I/O; 4 vCPU = 8 workers)
- **Calculate max workers from memory budget**: `max_workers = (total_ram - OS_reserve - app_working_set) / per_worker_rss` (WHY: over-allocating workers causes OOM crashes; OS needs ~1GB, app bootstrap needs ~200MB, each worker needs 50-100MB; on 4GB server: (4GB - 1GB - 200MB) / 75MB = ~37 workers theoretical max)
- **Monitor per-worker memory growth over time**: Track RSS per Octane worker; if it grows >10% per hour, investigate memory leak (WHY: Octane workers persist across requests; memory leaks accumulate until worker restart; early detection prevents OOM cascade)
- **Use Horizon for queue worker pooling**: Octane handles web requests; Horizon manages queue workers separately (WHY: queue workers have different memory patterns than web workers; separate pooling allows independent scaling)
- **Set max_requests per worker**: Configure Octane to restart workers after 1000-10000 requests (WHY: prevents memory growth from fragmented allocations; with Swoole, use `max_request`; with RoadRunner, use `supervisor.max_requests`)

## Architecture Guidelines
- 2 vCPU / 4GB as baseline for Octane; scale horizontally before scaling vertically
- Worker count: (vCPU * 2) for I/O-bound, (vCPU + 1) for CPU-bound apps
- Use Octane's Swoole or RoadRunner server; FrankenPHP for simpler deployments
- Connection pooling via Octane's built-in persistent connections; RDS Proxy for Lambda
- Deploy behind ALB for health checks and traffic distribution
- Use Octane's `tables` feature for in-memory caching between workers

## Performance Considerations
- Octane throughput: 3-10x vs PHP-FPM per instance for the same hardware
- Per-worker memory stable after warm-up (no per-request bootstrap overhead)
- Swoole: best for Laravel-specific features (cache, queues, events)
- RoadRunner: better for multi-language or gRPC requirements
- FrankenPHP: easiest deployment (single binary), Caddy-based HTTPS
- Connection reuse eliminates 90%+ of database connection churn

## Security Considerations
- Octane workers run as long-lived processes; security updates require restart
- Ensure `open_basedir` or other PHP security restrictions work with Octane
- Swoole/RoadRunner run as system services; secure their management endpoints
- Octane's `tables` data persists across requests; don't store sensitive data without encryption
- WebSocket connections via Octane/Laravel Reverb need dedicated security consideration

## Common Mistakes
1. **Too many workers exhausting memory**: setting max_workers = 50 on a 2GB server (Cause: assuming more workers = more throughput; Consequence: OOM kills workers, cascading failures; Better: calculate from memory budget: (2GB - 1GB OS) / 75MB = ~13 workers max)
2. **Using PHP-FPM sizing mental model**: Applying FPM's 20-50MB per-process budget to Octane (Cause: Octane workers seem similar to FPM processes; Consequence: over-allocating workers and running out of memory; Better: Octane workers use 50-100MB each — budget 2x what FPM needs)
3. **Not configuring max_requests**: Workers run indefinitely, memory grows unbounded (Cause: legacy PHP-FPM mindset where memory is freed per request; Consequence: workers consume more memory over hours/days; Better: set max_requests = 1000 for most apps)
4. **Scaling vertically before horizontally**: Moving from 2 vCPU to 16 vCPU instead of adding more 2 vCPU instances (Cause: vertical scaling seems simpler; Consequence: single point of failure, less granular cost control; Better: 4 x m7g.large ($200/month) > 1 x m7g.2xlarge ($200/month))

## Anti-Patterns
- **Infinite worker count**: Workers compete for CPU, context switching reduces throughput
- **No memory growth monitoring**: Workers grow until OOM; no alerting on RSS trends
- **Octane without opcache**: Worker persistence without opcache wastes memory on repeated compilation
- **Same scaling for queue and web workers**: Queue workers need different memory/worker ratios

## Examples
- **Small Octane app (500 req/s)**: 2 x m7g.large (2 vCPU / 4GB each) with 4 workers each = 8 total workers; cost ~$120/month
- **Medium Octane app (2000 req/s)**: 4 x m7g.xlarge (4 vCPU / 8GB each) with 8 workers each = 32 total workers; cost ~$400/month
- **Large Octane app (10000 req/s)**: 8 x m7g.2xlarge (8 vCPU / 16GB each) with 16 workers each = 128 workers; cost ~$1600/month

## Related Topics
- Laravel Octane Throughput (ku-38 in compute)
- Predictive Scaling (ku-37)
- Scheduled Scaling (ku-50)

## AI Agent Notes
- Default: start at 2 vCPU / 4GB with 2x vCPU workers
- Calculate max workers from memory budget, not CPU
- Set max_requests = 1000 for memory leak protection
- Monitor per-worker RSS growth
- Scale horizontally before vertically
