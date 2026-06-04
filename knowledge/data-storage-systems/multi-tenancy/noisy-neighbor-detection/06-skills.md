# Skill: Detect and Mitigate Noisy Neighbor Tenants

## Purpose

Monitor per-tenant resource consumption and automatically detect tenants that degrade performance for others on shared infrastructure.

## When To Use

- Shared-table or schema-per-tenant with multiple tenants on shared infrastructure
- Proactive capacity management
- SLA monitoring for multi-tenant platforms

## When NOT To Use

- DB-per-tenant with dedicated resources per tenant
- Very small number of tenants (< 10) where manual monitoring suffices

## Prerequisites

- Per-tenant resource monitoring (query log, performance schema)
- Alerting infrastructure
- Tenant identification in database connections

## Inputs

- Database performance metrics (per-tenant CPU, IOPS, connection count)
- Platform baseline metrics
- Alert threshold configuration

## Workflow (numbered steps)

1. Enable per-tenant metric collection: tag connections with tenant ID, enable performance_schema
2. Monitor signals: per-tenant CPU, IOPS, connection count, query count/sec, slow query count, response time deviation
3. Define thresholds: alert when tenant exceeds 2× platform average on any signal
4. Create automated mitigation tiers:
   - Tier 1: Rate limit tenant queries
   - Tier 2: Enforce query timeout
   - Tier 3: Move tenant to dedicated resources
5. Alert operations team on Tier 1 escalation
6. Periodically review noisy tenant reports and plan capacity upgrades

## Validation Checklist

- [ ] Per-tenant metrics collected and visible in dashboard
- [ ] Alert thresholds configured and tested
- [ ] Automated mitigation escalates correctly
- [ ] Noisy tenant report generated daily

## Common Failures

- Metrics not tagged per tenant — cannot identify noisy neighbor
- Thresholds too sensitive — false alarms
- Mitigation too aggressive — blocks legitimate tenant traffic

## Decision Points

- Metric collection frequency (real-time vs periodic)
- Mitigation: automatic vs manual approval
- Threshold: absolute vs relative to platform average

## Performance Considerations

- Performance schema overhead: 5-15% on write-heavy workloads
- Metric collection interval: 10-60 seconds for OLTP
- Slow query log: sample, not log all queries

## Security Considerations

- Tenant metrics are business-sensitive
- Automated mitigation must not permanently block legitimate traffic
- Alert escalation must have human oversight for account-level actions

## Related Rules

- 5-15-1: Always Tag Metrics Per Tenant
- 5-15-2: Never Block Tenant Without Alerting

## Related Skills

- Implement Per-Tenant Scaling
- Implement Tenant Rate Limiting
- Implement Tenant Resource Limits

## Success Criteria

- Noisy neighbors detected within 60 seconds of threshold breach
- Automated mitigation prevents platform-wide degradation
- Zero false-positive escalations that block legitimate traffic

---

# Skill: Implement Tenant Resource Quotas

## Purpose

Enforce per-tenant limits on database resources (connections, queries per second, storage) to prevent any single tenant from degrading platform performance.

## When To Use

- Shared infrastructure with multiple tenants
- Platform SLA guarantees for all tenants
- Preventing runaway queries from affecting other tenants

## When NOT To Use

- Dedicated infrastructure per tenant
- Single-tenant applications

## Prerequisites

- Per-tenant identification in database connections
- ProxySQL, PgBouncer, or application-level query interceptor
- Tenant plan configuration with resource limits

## Inputs

- Per-tenant plan limits (max connections, max QPS, max storage)
- Current per-tenant usage metrics
- Enforcement mechanism configuration

## Workflow (numbered steps)

1. Define per-tenant resource limits based on plan (free, pro, enterprise)
2. Enforce connection limits via ProxySQL/PgBouncer user-based limits or application-level pool per tenant
3. Enforce query rate limits via application middleware or ProxySQL query rules
4. Enforce storage limits via database schema monitoring and application checks
5. On limit breach: throttle, queue, or reject with clear error message
6. Monitor quota utilization and alert on approaching limits

## Validation Checklist

- [ ] Per-tenant connection limits configured
- [ ] Per-tenant query rate limits configured
- [ ] Storage limit enforcement in place
- [ ] Tenants receive clear error when limits exceeded

## Common Failures

- Limits not applied to queue jobs (batch process exceeds quota)
- Limits reset incorrectly (tenant gets unlimited access)
- Hard limit blocks legitimate traffic spike

## Decision Points

- Hard limit (reject) vs soft limit (throttle with warning)
- Database-level enforcement vs application-level enforcement
- Per-second vs per-minute rate limiting

## Performance Considerations

- Application-level rate limiting adds < 1ms per request
- ProxySQL rate limiting has no per-query overhead
- Storage monitoring queries impact database if run too frequently

## Security Considerations

- Limits should apply to all access paths (API, queue, commands)
- Admin tenants should have separate, higher limits
- Rate limit headers should not expose internal configuration

## Related Rules

- 5-15-1: Always Tag Metrics Per Tenant

## Related Skills

- Implement Noisy Neighbor Detection
- Implement Tenant Rate Limiting
- Implement Per-Tenant Scaling

## Success Criteria

- Zero tenants can degrade platform performance for others
- Per-tenant limits are configurable per plan
- Tenants receive actionable feedback when approaching or exceeding limits
