# Skill: Implement Replication Throttling

## Purpose

Limit the rate of replication apply on replicas to prevent overwhelming the replica's I/O or causing excessive lag on other replicas, and to provide backpressure during peak loads.

## When To Use

- Replica is undersized and can't keep up with primary write rate
- Need to control resource consumption on replica (CPU, IO, disk)
- Multiple replicas from same primary — throttling prevents resource contention
- Batch processes on replica must not impact replication

## When NOT To Use

- Replica can handle full write rate without issues
- Replication lag is negligible (under threshold)
- Single replica (resource contention less likely)

## Prerequisites

- Replica performance metrics (CPU, IOPS, disk utilization)
- Replication lag monitoring
- Understanding of replica's resource limits

## Inputs

- Primary write rate (transactions per second)
- Replica resource utilization (CPU, IO, memory, disk)
- Replication lag measurements
- Throttle threshold configuration

## Workflow (numbered steps)

1. Identify bottleneck on replica:
   - High CPU → replica apply thread is CPU-bound
   - High IOPS → replica apply is IO-bound
   - Outgoing network → replica is serving reads and can't keep up
2. Choose throttle method:
   - **MySQL**: `slave_net_timeout` and connection throttling not effective; use pt-slave-delay or external throttling
   - **Application**: pause writes during peak hours
   - **Batch jobs**: schedule during low-write periods
3. For pt-slave-delay:
   - Configure intentional delay: `pt-slave-delay --delay=1m --interval=15s`
   - Replica intentionally lags by a constant time (for point-in-time recovery)
   - Not true throttling, but limits resource use (replica only applies at intervals)
4. For MySQL Group Replication:
   - Flow control throttles the whole group when a replica falls behind
   - Configure: `group_replication_flow_control_mode=QUOTA`
   - Adjust: `group_replication_flow_control_member_quota_percent` (default 0 = no throttling)
5. Monitor: watch replica lag, reduce primary write rate if needed, or throttle at the application level
6. Implement backpressure: application detects replica lag > threshold and reduces write throughput

## Validation Checklist

- [ ] Throttling mechanism configured on replica
- [ ] Replica resource utilization stays within acceptable range
- [ ] Replication lag doesn't exceed critical threshold
- [ ] Application-level backpressure works
- [ ] Throttling doesn't cause unintended side effects (e.g., connection pool exhaustion)

## Common Failures

- Throttling too aggressively — replica useless for reads
- Flow control in Group Replication — throttles primary, reducing write throughput
- pt-slave-delay not real throttling — replica may be behind intentionally but still consuming resources
- Application backpressure causes queue buildup — timeouts and errors

## Decision Points

- Intentional delay (pt-slave-delay) vs resource-based throttling
- Flow control (Group Replication) vs manual throttle
- Replica upgrade vs throttle (upgrade is often better long-term)
- Application-level backpressure vs database-level throttling

## Performance Considerations

- Flow control: limits write throughput cluster-wide (affects all nodes)
- pt-slave-delay: replica stays behind but applies normally (no throttling of actual apply rate)
- Application backpressure: reduces write throughput, may affect user experience
- Upgrade replica: most effective but costs more

## Security Considerations

- Throttling mechanisms should not require superuser access from application
- Application backpressure must not lead to denial of service

## Related Rules

- 7-18-1: Always Monitor Replica Resource Utilization Before Throttling
- 7-18-2: Never Throttle Without Testing Effect On User Traffic

## Related Skills

- Monitor Replica Lag
- Diagnose Replica Lag Causes
- Implement Application Backpressure
- Implement Flow Control in Group Replication

## Success Criteria

- Replica resource utilization stays below 80%
- Replication lag within acceptable threshold
- Flow control (if used) doesn't unnecessarily throttle writes
- Application backpressure works without causing user-facing errors
