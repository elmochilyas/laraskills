# Skill: Implement Bulkhead Pattern for Isolated Resource Pools

## Purpose
Use the bulkhead pattern to partition resources (connections, threads, queue workers) per external service or integration, preventing one failing service from consuming all resources.

## When To Use
- Multiple external API integrations in the same application
- Preventing one slow/failing integration from affecting others
- Queue workers making calls to multiple external services
- Concurrency-limited external services

## When NOT To Use
- Single external integration
- When resource pooling abstraction adds unnecessary complexity

## Prerequisites
- Queue system for worker partitioning
- Understanding of per-service resource limits

## Workflow
1. Identify external services with different resource profiles
2. Create separate queue connections per service or group
3. Configure per-queue worker count and concurrency limits
4. Assign integration jobs to their respective queues
5. Set queue-specific retry and timeout configurations
6. Implement thread/semaphore pools for synchronous calls
7. Monitor per-queue backlog and worker utilization
8. Alert on bulkhead breaches (queue buildup)

## Validation Checklist
- [ ] Services partitioned into separate resource pools
- [ ] Queue connections configured per service/group
- [ ] Per-queue worker count and concurrency configured
- [ ] Jobs dispatched to correct queue
- [ ] Per-queue retry/timeout configured
- [ ] Per-queue backlog monitored with alerts
