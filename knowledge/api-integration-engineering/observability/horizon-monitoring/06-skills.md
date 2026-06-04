# Skill: Monitor Queue Workers with Laravel Horizon for Integration Jobs

## Purpose
Use Laravel Horizon to monitor queue workers processing integration jobs (webhook processing, API calls), with per-queue metrics and failure monitoring.

## When To Use
- Queue-driven integration workloads
- Multiple queues for different integration tasks
- Monitoring webhook/API job throughput and failures
- Redis queue driver with Horizon

## When NOT To Use
- Database queue driver (Horizon requires Redis)
- Simple, low-volume integration jobs

## Prerequisites
- Redis queue driver
- `composer require laravel/horizon`
- Queue workers running

## Workflow
1. Install Horizon: `composer require laravel/horizon`
2. Configure per-integration queues in `config/horizon.php`
3. Set supervisor per queue with worker count and timeout
4. Tag integration jobs for filtering in Horizon dashboard
5. Monitor job throughput, failures, and runtime
6. Set failure alert thresholds per integration queue
7. Use `horizon:snapshot` for metrics to external monitoring
8. Configure balanced vs simple queue balancing

## Validation Checklist
- [ ] Horizon installed and configured
- [ ] Per-integration queues configured with supervisors
- [ ] Integration jobs tagged for dashboard filtering
- [ ] Job throughput, failures, and runtime monitored
- [ ] Failure alert thresholds configured
- [ ] Metrics export configured for external monitoring
