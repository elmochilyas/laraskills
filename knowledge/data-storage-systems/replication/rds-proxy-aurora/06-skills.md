# Skill: Configure RDS Proxy for Aurora Connection Management

## Purpose

Set up Amazon RDS Proxy to multiplex client connections to Aurora, reducing database load, managing failover transparently, and enabling IAM authentication.

## When To Use

- Aurora MySQL or PostgreSQL database with many short-lived connections
- Serverless/Lambda functions connecting to the database
- Need transparent failover handling without application changes
- Want IAM-based database authentication (no passwords in config)

## When NOT To Use

- Single small database (<100 concurrent connections) — RDS Proxy cost may not be justified
- Direct connections are sufficient and reliable
- Application can't tolerate the slight latency of proxy hop

## Prerequisites

- Aurora cluster (MySQL or PostgreSQL) deployed
- IAM role/permissions to create RDS Proxy
- Security group configured to allow traffic from app to proxy
- RDS Proxy availability in target region and VPC

## Inputs

- Aurora cluster endpoint (writer and reader)
- VPC subnet and security group for proxy
- IAM role for RDS Proxy
- Target max connections (pool size)

## Workflow (numbered steps)

1. Create RDS Proxy via AWS Console/CLI, selecting target Aurora cluster
2. Configure IAM authentication (optional but recommended) or use Secrets Manager for DB credentials
3. Set max connections: typically 80% of Aurora cluster's max_connections
4. Configure connection pool: idle timeout, max connection pool size
5. Update application: use RDS Proxy endpoint instead of direct Aurora endpoint
6. For Lambda: add RDS Proxy to Lambda VPC configuration
7. Verify: connections go through proxy (check RDS Proxy metrics in CloudWatch)

## Validation Checklist

- [ ] Application connects through RDS Proxy endpoint
- [ ] Connection count to Aurora shows only proxy connections (much fewer than app connections)
- [ ] Failover test: manually failover Aurora, verify app reconnects without errors
- [ ] IAM authentication works (if configured)
- [ ] RDS Proxy CloudWatch metrics show healthy connection pool utilization

## Common Failures

- RDS Proxy cost ($15-20/month) exceeds benefit for small deployments
- Security groups block traffic between app and RDS Proxy
- Lambda VPC configuration doesn't include RDS Proxy security group
- IAM authentication misconfigured — application can't authenticate
- Connection pool too small — requests queuing, increased latency

## Decision Points

- IAM auth vs Secrets Manager: IAM auth is simpler (no password rotation), Secrets Manager is compatible with non-IAM apps
- Pool sizing: larger pool handles bursts but keeps more Aurora connections open
- Idle timeout: shorter timeout frees connections faster, longer timeout reduces connection churn

## Performance Considerations

- RDS Proxy adds 1-5ms latency per connection (not per query)
- Connection multiplexing reduces Aurora CPU by 30-50% in Lambda/serverless scenarios
- Cold start Lambda connections: RDS Proxy eliminates connection storm on Aurora

## Security Considerations

- IAM authentication eliminates database passwords from application config
- RDS Proxy automatically rotates credentials when using Secrets Manager
- RDS Proxy supports TLS encryption between client and proxy
- Proxy must be in same VPC or connected via VPC peering

## Related Rules

- 7-19-1: Always Use RDS Proxy with Lambda Database Connections
- 7-19-2: Prefer IAM Authentication Over Database Passwords

## Related Skills

- Configure Connection Pooling for Read Replicas
- Configure Aurora Auto Scaling
- Manage Serverless Database Connections

## Success Criteria

- Aurora connection count reduced by 10x or more
- Zero connection errors during traffic spikes
- Transparent Aurora failover (zero application downtime)
- Lambda cold start connection latency < 20ms

---

# Skill: Configure Aurora Auto Scaling with RDS Proxy

## Purpose

Set up Aurora Auto Scaling to automatically add/remove read replicas based on load, with RDS Proxy distributing traffic across the replica pool transparently.

## When To Use

- Read traffic is variable and unpredictable
- Need to scale read capacity without manual intervention
- RDS Proxy is already deployed for connection management

## When NOT To Use

- Read traffic is stable and predictable
- Manual replica scaling is acceptable
- Aurora Serverless (handles scaling differently)

## Prerequisites

- Aurora cluster with RDS Proxy configured
- Auto Scaling IAM role created
- Read replica metric thresholds defined

## Inputs

- Aurora cluster identifier
- Min and max replica count
- Scale-up threshold (e.g., CPU > 70% for 5 minutes)
- Scale-down threshold (e.g., CPU < 30% for 15 minutes)
- RDS Proxy target group for reader endpoint

## Workflow (numbered steps)

1. Create Auto Scaling policy for Aurora replicas: define min/max replicas
2. Configure scaling triggers: CPU utilization, connections, or custom metrics
3. Set cooldown periods: avoid rapid scale-up/scale-down oscillations
4. Ensure RDS Proxy reader endpoint is configured as the target for application reads
5. Test: generate read load, verify new replicas appear automatically
6. Verify RDS Proxy distributes traffic across all available replicas
7. Validate scale-down: reduce load, verify excess replicas removed

## Validation Checklist

- [ ] Auto Scaling adds replicas when CPU exceeds threshold
- [ ] Auto Scaling removes replicas when CPU drops below threshold
- [ ] RDS Proxy automatically includes new replicas in load balancing
- [ ] Application experiences no interruption during scaling events
- [ ] Scale-down: at least 1 replica remains (never scale to 0)

## Common Failures

- Scale-up too slow: threshold too high or cooldown too long
- Scale-down too fast: replicas removed before load stabilizes
- Read replica connection storm: new replicas appear but connections aren't balanced
- RDS Proxy not configured for reader endpoint — new replicas don't receive traffic
- Auto Scaling policy conflicts with manual scaling actions

## Decision Points

- Scale-up threshold: aggressive (lower) for latency-sensitive apps, conservative for cost-sensitive
- Scale-down threshold: higher cooldown to avoid thrashing
- Min replicas: 1 for cost savings, 2+ for HA of read capacity

## Performance Considerations

- New replicas need time to catch up (lag on creation) — RDS Proxy should handle lag-aware routing
- Scale-up latency: 2-5 minutes for new Aurora replica to be usable
- Aurora Auto Scaling adds/removes replicas without impact to existing connections

## Security Considerations

- New replicas inherit security groups from cluster
- Auto Scaling IAM role must have minimal required permissions
- RDS Proxy IAM auth works with auto-scaled replicas automatically

## Related Rules

- 7-19-3: Always Set Minimum Replicas > 0 for Auto Scaling

## Related Skills

- Configure RDS Proxy for Aurora Connection Management
- Configure Replica Load Balancing Strategy
- Size Read Replicas for Variable Workloads

## Success Criteria

- Read replica count adjusts automatically to match load within 5 minutes
- RDS Proxy evenly distributes traffic across auto-scaled replicas
- Zero application errors during scaling events
