# K25: Fargate Spot Workers

## Metadata
- **ID**: K25
- **Subdomain**: Compute Optimization
- **Topic**: Fargate Spot Workers
- **Source**: AWS Documentation, Industry Analysis (2026)
- **Reliability**: High

## Executive Summary
Fargate Spot offers up to 70% discount on compute for interruptible container tasks. This makes it ideal for Laravel queue workers, batch processing, CI/CD runners, and stateless background jobs. The tradeoff is a 5-15% per-hour interruption rate requiring graceful shutdown handling. At $0.00971/vCPU-hour (ARM Spot), queue worker costs become nearly negligible — a single Horizon worker can cost <$5/month.

## Core Concepts
- **Discount**: Up to 70% off Fargate On-Demand pricing
- **Interruption rate**: 5-15% per hour depending on Spot capacity demand
- **2-minute warning**: AWS sends SIGTERM 2 minutes before reclaiming capacity
- **Best for**: Stateless, fault-tolerant, interruptible workloads
- **Not for**: Stateful services, user-facing APIs, databases

## Mental Models
- **Spot as salvage**: You're using AWS's spare compute capacity at discount — it can be reclaimed at any time
- **Workers are disposable**: Queue workers are naturally stateless; Spot fits the paradigm perfectly
- **Capacity pool**: Think of Spot as a large, cheap pool of capacity that sometimes shrinks

## Internal Mechanics
Fargate Spot uses the same pricing dimensions (vCPU-hour, GB-hour) at ~70% discount. When AWS needs capacity back, it sends a SIGTERM signal to the running task. Fargate automatically attempts to restart the task on remaining Spot capacity or falls back to On-Demand if Spot is unavailable. ECS Service Auto Scaling can be configured with mixed capacity providers (Spot + On-Demand).

## Patterns
- **Spot + On-Demand mix**: Run baseline workers on On-Demand (or Reserved), overflow on Spot (most common)
- **Spot-only workers**: Acceptable for non-critical batch processing with graceful failure handling
- **Diversified Spot**: Use multiple instance types in Spot capacity provider to reduce interruption rate
- **Multiple AZs**: Distribute Spot tasks across AZs to reduce impact of zone-specific interruptions

## Architectural Decisions
- Use Spot for: Laravel Horizon queue workers, scheduled task runners, data exports, image processing
- Avoid Spot for: Web serving, WebSocket connections (Reverb), real-time notifications, user-facing APIs
- Implement: Queue job retry logic (Laravel's built-in `$tries` and `retryUntil` handle this naturally)
- Config: Fallback to On-Demand when Spot unavailable to prevent work backlogs

## Tradeoffs
- **Cost savings (70%) vs reliability risk**: Higher savings but jobs may need re-execution on interruption
- **Simple pricing (70% off) vs 2-minute warning handling**: Need to implement proper shutdown hooks in supervisor
- **Capacity dependency**: Spot availability varies by instance type, region, time of day, and season

## Performance Considerations
- Interruption rate spikes during AWS re:Invent, Black Friday, Prime Day, and region-specific events
- Tasks restarting after interruption take 30-120 seconds (image pull), causing job processing lag
- Jobs should complete within 5 minutes ideally to survive interruption windows
- Long-running Horizon batches may need checkpointing

## Production Considerations
- Use SIGTERM signal handling in Supervisor to gracefully stop queue workers
- Laravel Horizon workers automatically handle job interruption via timeout settings
- Set `--timeout` on queue workers to less than Spot 2-minute warning window (recommend: 90 seconds)
- Use separate Horizon processes for different queue priorities, with higher priority on On-Demand
- Monitor `SpotInterruptionCount` metric to track interruption frequency

## Common Mistakes
- Running stateful jobs on Spot without checkpointing progress (all work lost on interruption)
- Not configuring fallback to On-Demand when Spot capacity is unavailable (queue stops growing)
- Ignoring interruption rate variance across regions and timeframes
- Using single AZ for Spot tasks (AWS can drain an entire AZ)

## Failure Modes
- Spot capacity drops to 0 during mass-reclamation events (all workers interrupted simultaneously)
- Long-running jobs (>2 min) repeatedly interrupted, never completing (starvation loop)
- Job duplication if `tries` > 1 without proper idempotency handling
- Queue backlog grows during Spot unavailability if no On-Demand fallback configured

## Ecosystem Usage
- **Laravel Horizon on ECS/Fargate**: Spot for cost-optimized queue processing; Horizon manages interruptions via timeout config
- **KEDA scaler integration**: Scale Spot workers based on queue depth, respecting Spot interruption
- **Laravel Cloud**: Auto-hibernation equivalent for Fargate Spot; no dedicated Spot config needed
- **Laravel Vapor**: Lambda-based workers (no Spot equivalent; pay per invocation)

## Related Knowledge Units
- K24: Fargate Pricing Analysis
- K45: KEDA Scale-to-Zero Workers
- K03: Spot Instances Strategy
- K04: Spot Interruption Costs

## Research Notes
Fargate Spot availability varies significantly by region. us-east-1 has the highest capacity and lowest interruption rate. ap-southeast-1 (Singapore) has higher interruption rates due to capacity constraints. AWS improved diversion signals in 2025 with more granular interruption notice. ARM-based Spot tasks generally have lower interruption rates than x86 due to higher spare capacity of newer hardware.
