# K38: Octane Sizing for Laravel (Server Sizing)

## Metadata
- **ID**: K38 (Server Sizing cross-reference)
- **Subdomain**: Server Sizing & Autoscaling
- **Topic**: Octane Server Sizing for Laravel
- **Source**: Laravel Documentation, Benchmarks, Industry Research (2026)
- **Reliability**: High

## Executive Summary
A typical Laravel Octane server at 2 vCPU / 4GB RAM handles ~500-1000 concurrent users with sub-100ms response times. Octane's in-memory architecture changes server sizing: workers replace PHP-FPM processes, and the worker-to-CPU ratio is critical. For CPU-bound apps, use n+1 workers (n = vCPU count); for I/O-bound apps, use 2n to 4n workers. Memory sizing must account for per-worker overhead (50-100MB idle) plus application working set.

## Core Concepts
- **2 vCPU / 4GB baseline**: Handles 500-1000 concurrent users with Octane
- **Worker count**: n+1 (CPU-bound), 2n to 4n (I/O-bound)
- **Per-worker memory**: 50-100MB idle, 100-200MB under load
- **Connection pooling**: Octane reuses DB connections, reducing RDS connection count by 90%
- **vs PHP-FPM sizing**: Octane needs 1/3 to 1/10 the instances of PHP-FPM

## Mental Models
- **Workers as checkout lanes**: More lanes (workers) = more throughput, but each lane needs space (memory)
- **Octane sizing vs PHP-FPM**: Octane is like a highway (high throughput per lane) vs PHP-FPM's city streets

## Ecosystem Usage

- **Laravel Forge**: Auto-scaling via server provisioning; manual scaling requires additional Forge server setup\n- **Laravel Vapor**: Auto-scales Lambda functions based on concurrent executions; no manual scaling configuration needed\n- **Laravel Cloud**: Fargate-based auto-scaling with target tracking on CPU/memory; configurable min/max tasks\n- **Laravel Octane**: Worker scaling determined by server capacity; Octane's sandbox model enables safe multi-worker operation

## Performance Considerations

- Predictive scaling adds capacity 30 minutes before predicted load; eliminates cold-start latency for new instances\n- Scheduled scaling: instant capacity at scheduled time; no ML warm-up required but doesn't adapt to changes\n- Octane sizing: each worker can handle hundreds of requests/second; 4 Octane workers can replace 20 FPM workers\n- Autoscaling delay: 1-5 minutes to launch new instance + 30-120s warm-up; predictive eliminates this delay

## Production Considerations

- Use predictive scaling for primary scaling policy; target tracking as fallback for unexpected spikes\n- Octane workers: configure max_workers based on memory budget; monitor memory growth over time for leaks\n- Set scale-in protection to prevent termination of workers with active connections\n- Test scaling policies with load testing tools (k6, Locust) before production deployment\n- Configure CloudWatch alarms for both scale-out AND scale-in to right-size during low traffic

## Failure Modes

- Scaling oscillation: scale-in triggers scale-out which triggers scale-in; use cooldown periods and step adjustments\n- Predictive scaling model failure: ML model trained on atypical data generates wrong predictions; monitor forecast accuracy\n- Octane OOM cascade: workers exhaust memory and all restart simultaneously; connection pooling and graceful handling required\n- Autoscaling group max exceeded: launch failure due to account limits (500 instances per region default); request limit increase

## Architectural Decisions

- Predictive vs scheduled: predictive for cyclical patterns with ML; scheduled for known fixed-time events\n- Target tracking vs step scaling: target tracking is simpler (single metric target); step scaling supports complex policies\n- Octane vs FPM sizing: Octane workers need 30-80MB each; FPM workers need 20-50MB; overhead differs\n- Auto Scaling group warm-up: use ELB health checks; set cooldown period to avoid rapid scaling oscillations

## Tradeoffs

- **Predictive vs reactive scaling**: Predictive adds capacity before load (no delay) but has ML false-positives; reactive handles unexpected spikes with 1-5 minute scaling delay\n- **Scheduled vs predictive**: Scheduled is deterministic (you control timing); predictive adapts to changing patterns\n- **Octane vs FPM sizng**: Octane requires fewer workers for same throughput (2-5x efficient) but each worker uses more memory\n- **Vertical vs horizontal scaling**: Vertical simpler (bigger instance) but has upper limit; horizontal is harder but unlimited scale

## Patterns

- Predictive scaling: ML-based, 48-hour forecast; best for daily/weekly cyclical patterns\n- Scheduled scaling: fixed time-based rules for known events (marketing campaigns, business hours)\n- Target tracking: reactive, maintains metric target (CPU, memory, request count per target)\n- Octane worker sizing: (total_memory - OS) / per_worker_rss to calculate max worker count\n- Autoscaling warm-up: configure health check grace period (30-120s) to prevent premature instance termination

## Internal Mechanics

Predictive scaling uses ML (AWS's machine learning) to forecast traffic patterns 48 hours ahead, proactively adjusting capacity before demand arrives. Scheduled scaling changes capacity at fixed times based on known patterns (e.g., scale up at 8 AM, scale down at 10 PM). Target tracking maintains a metric target (e.g., CPU at 50%). Octane sizing considers worker count, memory per worker, and connection pool limits against total available memory.

## Common Mistakes

- Using reactive scaling only: traffic spikes take 2-5 minutes to scale; users experience errors during ramp-up\n- Over-provisioning static capacity instead of using predictive/scheduled scaling for known traffic patterns\n- Octane worker mis-sizing: too many workers exhaust memory; too few workers underutilize hardware\n- Not configuring scale-in protection: terminating instances with active connections drops requests\n- Ignoring connection pool limits: auto-scaling more instances than database connection pool can handle causes errors

## Related Knowledge Units
- K38: Laravel Octane Throughput
- K37: Predictive Scaling
- K50: Scheduled Scaling

## Research Notes
Octane server sizing differs fundamentally from PHP-FPM: (1) Workers persist in memory, so per-process memory is stable and predictable; (2) Connection pooling reduces database connection requirements; (3) The 500-1000 CCU estimate depends on application complexity â€” simple CRUD apps handle more, API-heavy apps handle fewer. Recommended sizing approach: start at 2 vCPU / 4GB with 2Ã—vCPU workers, monitor CPU and memory over 48h, adjust. Right-sizing Octane workers is cheaper than over-provisioning.
