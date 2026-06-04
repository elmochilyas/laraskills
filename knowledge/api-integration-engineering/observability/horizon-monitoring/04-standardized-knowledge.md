# ECC Standardized Knowledge — Laravel Horizon Monitoring for Integration Queues

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | observability-monitoring |
| Knowledge Unit ID | ku-01 |
| Knowledge Unit | Laravel Horizon Monitoring for Integration Queues |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K028, K013, K011, K012 |

## Overview (Engineering Value)
Laravel Horizon provides a dashboard and configuration for monitoring Redis-backed queues, including webhook processing and API integration job queues. Per-queue metrics (throughput, runtime, wait time, failures) enable operators to track integration health, detect processing bottlenecks, and manage worker scaling. For API integrations, Horizon is essential for monitoring webhook jobs, outgoing delivery, and queue-based API consumption.

## Core Concepts
- **Horizon Dashboard**: Real-time UI showing queue status, job throughput, failures, worker metrics
- **Queue Metrics**: Jobs per minute, avg/max runtime, wait time, failures per queue
- **Worker Balancing**: Auto/simple/false strategies for distributing workers across queues
- **Horizon Tags**: Auto-tags and custom tags for job filtering and monitoring
- **Snapshots**: Periodic metrics in Redis for historical trend analysis

## When To Use
- All production Redis-backed queues processing integration jobs
- Multi-queue setups with webhook, API dispatch, and background integration jobs
- Teams needing visibility into integration processing health
- Any queue-first webhook architecture

## When NOT To Use
- Non-Redis queue drivers (database, SQS — Horizon requires Redis)
- Development environments where full monitoring isn't needed
- Single-queue simple applications

## Best Practices
- Route all integration jobs to dedicated queues for isolation
- Use per-service queue isolation for granular monitoring (stripe, mailgun, github)
- Tag jobs with service name and operation type for dashboard filtering
- Configure Horizon notifications for failure rate thresholds
- Track queue wait times as leading indicator of backpressure

## Architecture Guidelines
- Dedicated `integrations` or `webhooks` queue for all API jobs
- Separate queues per critical external service
- "Auto" balancing for variable webhook traffic patterns
- Worker timeout (60-120s) based on expected API response times
- Enable snapshots for historical trending of queue health

## Performance Considerations
- Horizon Redis operations: ~1-5ms per job (negligible overhead)
- Snapshot storage: ~100 bytes per snapshot per queue
- Dashboard polling: near-real-time (1-second refresh)
- Tag indexing: additional Redis memory proportional to unique tag values

## Security Considerations
- Secure Horizon dashboard behind authentication (Horizon gates)
- Restrict access to integration queue monitoring to ops team
- Horizon dashboard may expose job payloads with sensitive data
- Use environment-specific Horizon configs (production vs staging)
- Monitor Horizon's master supervisor for health

## Common Mistakes
- Running all integration jobs on default queue (no isolation, no priority)
- Not configuring Horizon tags on integration jobs (hard to filter per-service)
- Worker timeout too low for APIs that occasionally exceed limit
- Ignoring Horizon notifications (failure rate alerts go unhandled)
- Not monitoring queue wait times (backpressure builds silently)

## Anti-Patterns
- Single queue for all job types (webhooks block application jobs)
- No tag strategy for job filtering
- Unlimited snapshot retention consuming Redis memory
- Horizon dashboard accessible without authentication

## Examples
```php
// config/horizon.php - dedicated integration queues
'environments' => [
    'production' => [
        'webhooks' => ['connection' => 'redis', 'queue' => ['webhooks-high', 'webhooks']],
        'integrations' => ['connection' => 'redis', 'queue' => ['integrations']],
    ],
],
```

```php
// Job tagging for Horizon filtering
class ProcessStripeWebhook implements ShouldQueue
{
    public function tags(): array
    {
        return ['stripe', 'webhook', 'payment:' . $this->webhookCall->id];
    }
}
```

## Related Topics
- **Prerequisites**: Laravel queues, Redis fundamentals
- **Closely Related**: Telescope debugging, queue-first processing
- **Advanced**: Auto-scaling workers, custom Horizon metrics
- **Cross-Domain**: Laravel Horizon, queue infrastructure, Redis

## AI Agent Notes
- Route all integration jobs to dedicated queues
- Add Horizon tags per service for filtering
- Configure notification thresholds for integration queue failures

## Verification
- [ ] Dedicated queue for integration jobs configured
- [ ] Horizon tags applied to all integration jobs
- [ ] Worker timeout set appropriately (60-120s)
- [ ] Notifications configured for failure rate thresholds
- [ ] Snapshots enabled for historical trend analysis
- [ ] Dashboard secured behind authentication
