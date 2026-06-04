# Skill: Monitor Replica Lag

## Purpose

Track replication lag using `Seconds_Behind_Master` (MySQL) or `pt-heartbeat` (precise) and alert when lag exceeds acceptable thresholds.

## When To Use

- Master-replica replication deployed
- Need to detect and alert on excessive lag
- Measuring lag for read-splitting decisions
- Compliance or SLA requirements for data freshness

## When NOT To Use

- Single database node (no replication)
- Lag is not a concern (async reporting replicas)
- Third-party monitoring handles this (RDS, CloudWatch)

## Prerequisites

- Access to replica database
- Monitoring system (Prometheus, Datadog, New Relic)
- Understanding of lag measurement methods

## Inputs

- Replica connection details
- Lag measurement method (SBM vs pt-heartbeat)
- Alert threshold configuration

## Workflow (numbered steps)

1. Configure lag monitoring:
   - MySQL: `SHOW REPLICA STATUS` → `Seconds_Behind_Master` (SBM)
   - PostgreSQL: `pg_current_wal_lsn()` - `pg_last_wal_receive_lsn()`
   - pt-heartbeat: update timestamp on primary, compare on replica
2. For production, prefer pt-heartbeat (more accurate, works during replication errors)
3. Collect lag metric every 10-60 seconds
4. Set alert thresholds:
   - Warning: lag > 5 seconds (user-facing replicas)
   - Critical: lag > 30 seconds (stale data risk)
   - Analytics replicas: warning at 60s, critical at 300s
5. Create dashboard showing lag over time per replica
6. Alert on prolonged lag or increasing trend

## Validation Checklist

- [ ] Lag measurement configured and collecting data
- [ ] Alert thresholds set and tested
- [ ] Dashboard shows lag per replica over time
- [ ] Lag spikes correlate with events (DDL, traffic, deployments)

## Common Failures

- `Seconds_Behind_Master` shows 0 but replica hasn't processed events (relay log gap)
- pt-heartbeat not set up — rely on unreliable SBM
- Lag check too frequent — adds load; too infrequent — misses spikes
- No alert on replica where replication has stopped (SBM stays constant)

## Decision Points

- SBM vs pt-heartbeat vs third-party monitoring
- Check frequency vs database load tradeoff

## Performance Considerations

- `SHOW REPLICA STATUS`: lightweight, negligible impact
- pt-heartbeat: writes to heartbeat table every second (negligible)
- Collection interval: 10s for critical, 60s for standard

## Security Considerations

- Monitoring credentials must be read-only
- Lag metrics are operational, not sensitive

## Related Rules

- 7-6-1: Always Monitor All Replicas For Lag
- 7-6-2: Never Rely Solely On Seconds_Behind_Master

## Related Skills

- Diagnose Replica Lag Causes
- Implement Lag-Aware Read Splitting
- Implement Replica Health Monitoring

## Success Criteria

- Lag metrics collected for every replica
- Alerts fire within 30 seconds of threshold breach
- Lag data available for post-incident analysis
- pt-heartbeat (or equivalent) is the primary lag source

---

# Skill: Set Up pt-heartbeat for Accurate Lag Measurement

## Purpose

Install and configure pt-heartbeat to provide precise, reliable replica lag measurement regardless of replication errors or long transactions.

## When To Use

- Production MySQL replicas needing accurate lag measurement
- `Seconds_Behind_Master` is unreliable (shows 0 when replica is behind)
- Need lag measurement during replication errors
- Precise lag monitoring for read-splitting decisions

## When NOT To Use

- PostgreSQL (use different tools: pg_stat_replication)
- Non-production environments where approximate lag is sufficient
- pt-heartbeat cannot be installed (permissions, restrictions)

## Prerequisites

- Percona Toolkit installed
- Write access to primary database for heartbeat table
- Read access to replica for lag check

## Inputs

- Primary database connection
- Replica database connections
- Heartbeat interval (default: 1 second)

## Workflow (numbered steps)

1. Install Percona Toolkit on a monitoring server
2. Create heartbeat table on primary: `pt-heartbeat --create-table --database percona --update`
3. Run heartbeat updater on primary: `pt-heartbeat --update --database percona --interval=1`
4. On replica, check lag: `pt-heartbeat --check --database percona --monitor --host=replica_host`
5. Integrate lag metrics into monitoring system
6. Set up alerting on pt-heartbeat lag values

## Validation Checklist

- [ ] pt-heartbeat installed and heartbeat table created
- [ ] Heartbeat updates running on primary (every 1 second)
- [ ] Lag check runs on replicas
- [ ] Lag values match expected replication state
- [ ] Monitoring integration configured

## Common Failures

- Heartbeat updater stops — no lag data
- pt-heartbeat monitoring queries impact replica performance
- Lag values show negative (clock skew between primary and replica)

## Decision Points

- Percona Toolkit vs custom heartbeat implementation
- Heartbeat interval: 1s vs 5s

## Performance Considerations

- Heartbeat update: small write every second (negligible)
- Lag check: lightweight query on replica
- Monitor 10+ replicas from one heartbeat source

## Security Considerations

- Heartbeat table access should be restricted
- pt-heartbeat monitoring credentials must be read-only

## Related Rules

- 7-6-1: Always Monitor All Replicas For Lag

## Related Skills

- Monitor Replica Lag
- Implement Replica Health Monitoring
- Implement Lag-Aware Read Splitting

## Success Criteria

- pt-heartbeat provides accurate lag measurement for all replicas
- Lag values available in monitoring dashboard
- Zero lag measurement gaps during replication errors
