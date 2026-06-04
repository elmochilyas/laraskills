# Skill: Select and Configure the Right Queue Driver

## Purpose
Choose and configure the optimal queue driver (Redis, SQS, database) for your workload, considering throughput, durability, operational complexity, and ecosystem compatibility.

## When To Use
When setting up a new queue infrastructure, migrating between drivers, or evaluating driver options for a project.

## When NOT To Use
Already have a working driver that meets requirements; short-lived prototype where any driver will do.

## Prerequisites
- Understanding of workload characteristics (volume, latency, durability)
- Access to infrastructure provisioning (Redis, AWS SQS)
- Knowledge of Horizon compatibility requirements

## Inputs
- Expected job throughput (jobs/hour)
- Worker count and concurrency
- Existing infrastructure (Redis, AWS)
- Horizon requirement (yes/no)

## Workflow
1. If Horizon is needed: choose Redis (only compatible driver)
2. Evaluate volume: <100 jobs/hour → database OK; 100-10K → Redis; >10K → Redis or SQS
3. For AWS-native stack: choose SQS for zero-infrastructure management
4. Configure connection in `config/queue.php` with appropriate `retry_after`
5. For Redis: separate queue Redis from cache Redis (separate instances)
6. Set `after_commit` to `true` at connection level
7. For database driver: add index on `(queue, reserved_at)` to `jobs` table
8. Never use `sync` driver in production — configure `QUEUE_CONNECTION` in `.env`

## Validation Checklist
- [ ] Driver selected based on volume, infra, and Horizon requirements
- [ ] Redis queue and cache on separate instances
- [ ] `after_commit=true` configured on connection
- [ ] `retry_after` > longest expected job runtime
- [ ] Database jobs table indexed on `(queue, reserved_at)`
- [ ] `QUEUE_CONNECTION` not set to `sync` in production
- [ ] Worker processes running and processing jobs

## Common Failures
- Database driver for moderate volume — polling query becomes contention point
- Queue and cache sharing Redis — cache eviction deletes queue keys
- `QUEUE_CONNECTION=redis` not set — jobs execute synchronously in HTTP request

## Decision Points
- Need Horizon → Redis
- AWS-native → SQS
- Low volume, no infrastructure → database
- Maximum throughput → Redis (10K jobs/sec per instance)

## Performance Considerations
- Redis: ~10,000 jobs/second per instance
- SQS: ~300 TPS per queue (default), 256KB max payload
- Database: each dispatch = SQL write + read — contention at scale

## Security Considerations
- Separate Redis for queue prevents cache eviction from deleting jobs
- SQS IAM permissions should follow least-privilege principle

## Related Rules
- Rule 1: separate-queue-redis-from-cache
- Rule 2: set-after-commit-per-connection
- Rule 3: retry-after-exceeds-longest-job
- Rule 4: no-database-driver-for-production-volume
- Rule 5: index-jobs-table-for-database-driver
- Rule 6: no-sync-driver-in-production

## Related Skills
- Configure Queue Connections vs Queues
- Configure block_for to Optimize Redis Queue Polling

## Success Criteria
Queue driver handles expected throughput without contention, latency is acceptable, Horizon works (if needed), and operational overhead is appropriate for the team.
