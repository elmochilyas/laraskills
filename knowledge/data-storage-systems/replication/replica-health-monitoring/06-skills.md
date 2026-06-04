# Skill: Monitor Replica Health

## Purpose

Continuously monitor replica health and performance, including replication status, resource utilization, and data consistency, to ensure replicas serve correct data reliably.

## When To Use

- Replicas deployed in production
- Need to detect replica failures before they affect reads
- SLA requires replica availability and data freshness
- Capacity planning for replica scaling

## When NOT To Use

- Single-node database (no replicas)
- Cloud-managed replicas (RDS, Aurora — health handled by provider)
- Development or test environments with no SLA

## Prerequisites

- Monitoring system (Prometheus, Datadog, New Relic, Zabbix)
- Access to replica database metrics
- Replication status access (SHOW SLAVE STATUS, pg_stat_replication)

## Inputs

- Replica host list
- Replication status queries
- System metrics (CPU, memory, disk, network, IOPS)
- Query performance metrics

## Workflow (numbered steps)

1. Monitor replication status:
   - Replica IO thread running (Yes/No)
   - Replica SQL thread running (Yes/No)
   - Seconds_Behind_Master or pt-heartbeat lag
   - Last IO/SQL error (capture and alert)
   - Relay log space usage (free space for relay logs)
2. Monitor replica resource health:
   - CPU utilization (should be < 80%)
   - Memory usage (should have free memory for buffers)
   - Disk usage (data + relay logs + binary logs — alert at 80%)
   - IOPS utilization
   - Network throughput and errors
3. Monitor query performance on replica:
   - Slow query log
   - Lock contention (InnoDB locks)
   - Thread pool utilization
   - Connections count vs max_connections
4. Health check every 10-60 seconds, aggregate metrics into dashboard
5. Set alerts:
   - Critical: replica IO/SQL thread stopped
   - Critical: replica lag > 30 seconds (user-facing)
   - Warning: disk usage > 80%
   - Warning: CPU > 80% sustained
   - Warning: replication error (even if auto-resolved)
6. Implement automated response:
   - Restart replica SQL thread if stopped (automated, with alert)
   - Skip transaction if identified as harmless (careful — use with caution)
   - Rebuild replica if replication breaks irrecoverably

## Validation Checklist

- [ ] Replication status monitored for all replicas
- [ ] System metrics collected and dashboarded
- [ ] Alerts configured for all critical and warning conditions
- [ ] Automated response scripts tested and documented
- [ ] Replica rebuild procedure documented and tested
- [ ] Regular verification of data consistency (checksum)

## Common Failures

- Replica running but not applying (IO thread OK, SQL thread stopped — stale data)
- Replica lag accumulating without alert
- Disk full on replica (relay logs, binary logs, slow query log)
- Replica using old data (replication paused, but replica accepts reads)
- Auto-skip-transaction mistakenly skips critical changes

## Decision Points

- Monitoring interval (10-60 seconds) vs database load
- Automated recovery vs manual intervention
- Which errors are safe to auto-skip vs require investigation
- Rebuild replica vs repair in-place

## Performance Considerations

- Health check queries add minimal load (run every 10-60s)
- Resource monitoring agents (telegraf, datadog-agent) use 1-3% CPU
- Slow query log may consume disk if enabled on busy replica

## Security Considerations

- Monitoring agent must have read-only database access
- Dashboard should not expose database credentials
- Health check queries must not include sensitive data

## Related Rules

- 7-21-1: Always Monitor IO and SQL Thread Separately
- 7-21-2: Never Assume Replica Has Current Data Just Because It's Running

## Related Skills

- Monitor Replica Lag
- Configure Replica Health Checks
- Implement Automated Replica Repair
- Implement Replica Rebuild Procedure

## Success Criteria

- All replicas monitored for replication status and resource health
- Alerts fire within 30 seconds of failure or threshold breach
- Automated recovery handles common failures (SQL thread stop)
- Manual recovery procedure for irrecoverable failures documented and tested
- Replica data consistency verified regularly
