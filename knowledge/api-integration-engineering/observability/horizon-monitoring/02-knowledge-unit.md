# Metadata
Domain: API Integration Engineering
Subdomain: Observability & Monitoring
Knowledge Unit: Laravel Horizon Monitoring for Integration Queues
Difficulty Level: Intermediate
Last Updated: 2026-06-02

## Executive Summary
Laravel Horizon provides a dashboard and configuration system for monitoring Redis-backed queues, including webhook processing queues and API integration job queues. Horizon's per-queue metrics (throughput, runtime, wait time, failures) enable operators to track integration health, detect processing bottlenecks, and manage worker scaling. For API integrations, Horizon is essential for monitoring webhook processing jobs, outgoing webhook delivery, and any queue-based API consumption patterns.

## Core Concepts
- **Horizon Dashboard**: Real-time UI showing queue status, job throughput, failed jobs, and worker metrics
- **Queue Metrics**: Jobs per minute, average runtime, maximum runtime, wait time, failures per queue
- **Worker Balancing**: Auto-scaling strategies (auto, simple, false) for distributing workers across queues
- **Job Monitoring**: Per-job status pages with payload, exception details, and retry history
- **Horizon Tags**: Auto-tags (model ID, job class) and custom tags for job filtering and monitoring
- **Horizon Notifications**: Configurable alerts for delayed queues, long runtimes, and high failure rates
- **Horizon Snapshots**: Periodic metrics snapshots stored in Redis for historical trend analysis

## Mental Models
- **Control Tower**: Horizon is the control tower for all background work; you can see every job in flight
- **Air Traffic Control**: Each queue is a runway; Horizon shows which planes (jobs) are waiting, taking off, and crashed
- **Health Monitor**: Like a patient monitor in a hospital; Horizon shows the vital signs of each integration queue

## Internal Mechanics
- Horizon monitors Redis queue lists via `LRANGE` and `LLEN` for queue depth and job composition
- Job processing lifecycle: `pending` → `reserved` (processing) → `completed`/`failed`; transitions tracked in Redis
- Snapshots: `horizon:snapshots` key stores per-minute metrics (jobs processed, failures, average time)
- Queue balancing: "auto" mode monitors job throughput and adjusts worker pool allocation dynamically
- Worker count per queue is configured in `config/horizon.php` with environment-specific configurations
- Notifications: dispatched as Laravel events when queue wait time exceeds threshold or failure rate spikes

## Patterns
- **Dedicated Integration Queue**: Route all API integration jobs to a dedicated `integrations` or `webhooks` queue
- **Per-Service Queue Isolation**: Separate queues per external service (stripe, mailgun, github) for granular monitoring
- **Horizon Tags for Filtering**: Tag jobs with service name and operation type for dashboard filtering
- **Failure Rate Alerting**: Configure Horizon notifications for failure rate thresholds on integration queues
- **Wait Time Monitoring**: Track queue wait times as a leading indicator of integration backpressure
- **Balanced Worker Allocation**: Allocate more workers to critical integration queues (payment processing) over non-critical ones

## Architectural Decisions
- Run integration jobs on dedicated Horizon queues to isolate from application background tasks
- Use "auto" balancing for integration queues to handle variable webhook traffic patterns
- Configure separate Horizon environments for production vs staging to match infrastructure budgets
- Set worker timeout (60-120s) based on expected API response times
- Enable Horizon metrics snapshots for historical trending of integration queue health
- Route webhook processing jobs to a high-priority queue with dedicated worker pool

## Tradeoffs
- Per-service queue isolation provides granular monitoring but increases queue management overhead
- "Auto" balancing optimizes worker allocation but may cause latency spikes during traffic bursts
- Long snapshot retention enables trend analysis but consumes Redis memory
- Detailed job monitoring (all payloads stored) helps debugging but may contain sensitive data

## Performance Considerations
- Horizon's Redis operations add negligible overhead to queue operations (~1-5ms per job)
- Snapshot storage: ~100 bytes per snapshot per queue; 1M snapshots for 10 queues over a week = ~70MB Redis
- Dashboard polling: near-real-time (1-second refresh) for active views
- Tag indexing: additional Redis memory proportional to number of unique tag values
- Large number of failed jobs in the failed_jobs table may slow the Horizon failures view

## Production Considerations
- Secure Horizon dashboard behind authentication (Horizon gates, middleware)
- Configure separate Horizon environments for production with appropriate worker counts
- Set up Horizon notifications for integration queue anomalies (high failure rate, long wait times)
- Monitor Horizon's `master` supervisor process and restart if unhealthy
- Use Redis Sentinel or Cluster for high-availability Horizon backend
- Regularly prune failed jobs table to prevent performance degradation

## Common Mistakes
- Running all integration jobs on the default queue (no isolation, no priority)
- Not configuring Horizon tags on integration jobs (hard to filter and monitor per-service)
- Setting worker timeout too low for API calls that occasionally exceed the limit
- Ignoring Horizon notifications (failure rate alerts go unhandled)
- Not monitoring queue wait times (backpressure builds silently)
- Forgetting to scale queue workers when webhook traffic volume increases

## Failure Modes
- Redis connection failure: Horizon dashboard goes dark, but queues continue processing (resilient)
- Worker pool exhaustion: all workers blocked on slow API calls, queue backs up
- Supervisor crash: Horizon stops monitoring, workers continue but no oversight
- Snapshot storage overflow: Redis memory exhaustion from unbounded snapshot retention
- Failed jobs table growth: query performance degradation on failures view

## Ecosystem Usage
- Standard Laravel queue monitoring tool for Redis-backed queues
- Integrates with Laravel Pulse for combined application and queue health metrics
- Used alongside Telescope for request-level debugging of failed jobs
- Community standard for monitoring webhook processing queues in production
- Often paired with Laravel Pulse for integration health dashboards

## Related Knowledge Units
- K029: Laravel Telescope Debugging (complementary debugging for HTTP client calls)
- K013: Laravel Queue Integration (queue-first processing pattern monitored by Horizon)
- K024: Fuse Circuit Breaker (circuit breaker state monitoring complements Horizon)
- K011: Spatie laravel-webhook-client (webhook processing jobs monitored by Horizon)
- K012: Spatie laravel-webhook-server (webhook delivery jobs monitored by Horizon)

## Research Notes
- Laravel 13.x Horizon documentation covers queue configuration, balancing, and monitoring
- Horizon's "auto" balancing mode was introduced in Laravel 5.5 and has been refined through 13.x
- Horizon tags use Redis Sets for indexing; tag cardinality affects Redis memory usage
- Horizon notifications support Slack, SMS (Nexmo), email, and custom webhook channels
- Community practice: maintain separate Horizon dashboards per application domain
