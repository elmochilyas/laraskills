# K50: Scheduled Scaling

## Metadata
- **ID**: K50
- **Subdomain**: Server Sizing & Autoscaling
- **Topic**: Scheduled Scaling
- **Source**: Terraform Module, AWS Documentation
- **Reliability**: Medium

## Executive Summary
Scheduled scaling reduces staging/development environment costs by 50-70% by automatically scaling compute down during off-hours. A typical schedule: scale down to 1-2 instances at 8PM, scale up at 6AM weekdays; scale down completely on weekends. For a staging environment costing $500/month running 24/7, scheduled scaling reduces cost to $150-250/month with no functional impact. This is the simplest, highest-ROI cost optimization for non-production environments.

## Core Concepts
- **Cost reduction**: 50-70% for staging environments
- **Schedule examples**: Scale down 8PM-6AM weekdays, all-day weekends, holidays
- **Implementation**: AWS Auto Scaling scheduled actions, CloudFormation, Terraform
- **Warm-up time**: Account for 5-15 minutes before instances serve traffic
- **Zero-cost weekends**: Scale staging to 0 on weekends (recreate on Monday)

## Mental Models
- **Scheduled scaling as office hours**: The staging environment works 9-5 just like the team
- **Night mode**: Everything powers down when not in use â€” like turning off lights in empty rooms

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
- K37: Predictive Scaling
- K38: Laravel Octane Throughput

## Research Notes
Scheduled scaling is the most underutilized cost optimization for Laravel teams. Many staging environments run 24/7 at full capacity when they only need 8-12 hours of availability. Implementation is simple: create scheduled actions in Auto Scaling Groups or ECS Service Auto Scaling. Common pitfalls: (1) Not accounting for timezone differences for distributed teams; (2) Insufficient warm-up time after scale-up; (3) Forgetting holiday schedules.
