# Standardized Knowledge: Zero-Downtime Deployment and OpCache

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Zero-Downtime Deployment with OpCache |
| Difficulty | Enterprise |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Zero-downtime PHP deployment combines: PHP-FPM graceful reload (no dropped connections), OpCache pre-warming (no slow first requests), health check sequencing (verify workers before serving traffic), and load balancer orchestration (drain/warm/rejoin). The complete sequence takes 30-120 seconds with zero user-facing impact.

## Core Concepts

- **Load Balancer Orchestration**: Mark server as draining (stop sending new connections), wait for in-flight requests to complete (10-30s), deploy code, reload PHP-FPM gracefully, warm OpCache, health check passes, mark server as active (resume traffic).
- **OpCache Pre-Warming**: After reload, critical endpoints may be slow. Run a warm-up script hitting key URLs (/, /api/health, /api/users). Ensures OpCache is populated before user traffic resumes.
- **Health Check Sequencing**: Load balancer checks health endpoint. Health endpoint verifies: PHP-FPM responding, OpCache hit rate > 95%, database connection OK, listen queue = 0. Server stays in draining until all checks pass.
- **Rolling Across Fleet**: Repeat for each server. At fleet level, one server drains while others serve. When it rejoins, the next server drains. No server sits idle.

## When To Use

- Production environments with multiple server instances behind a load balancer
- Services with strict uptime requirements (99.9%+)
- Automated CI/CD pipelines with staging/production deployments
- Any deployment where request dropping is unacceptable

## When NOT To Use

- Single-server deployments (no load balancer to orchestrate)
- Development/staging environments where brief downtime is acceptable
- Emergency patches requiring immediate fix (accept brief disruption)
- Systems without process supervision or load balancer integration

## Best Practices

- **Always drain before deploying**: Signal the load balancer to stop sending traffic before touching PHP-FPM. This prevents serving partial states or dropped connections.
- **Warm OpCache before re-enabling traffic**: After reload, run warm-up requests on all critical endpoints. First real user requests must not trigger cold-compilation.
- **Health check includes OpCache hit rate**: The health endpoint should report OpCache statistics. Load balancer only re-enables traffic when hit rate > 95%.
- **Stagger warm-ups across fleet**: If all servers warm simultaneously, backend services (database, Redis) see a thundering herd. Stagger warm-ups by 5-10 seconds.
- **Monitor during transition**: Track error rate, latency, and listen queue during deployment. Any anomaly should trigger immediate investigation or rollback.

## Architecture Guidelines

- **Load Balancer Integration**: AWS ALB/NLB, HAProxy, Nginx, or Kubernetes Service. The load balancer must support connection draining with configurable timeout.
- **Health Check Design**: Health endpoint returns 200 only when: PHP-FPM accepting connections, OpCache hit rate > 95%, database responsive, no listen queue buildup. Multiple checks provide deployment confidence.
- **Rolling vs Blue-Green**: Rolling is more resource-efficient (no duplicate infrastructure). Blue-green provides stronger consistency guarantees. Choose based on acceptable complexity.
- **Pre-Warm Script Design**: Cachetool or curl-based warm-up hitting endpoint groups. Each endpoint populates OpCache for a different code path. Cover all critical user flows.

## Performance Considerations

- Pre-warming takes 5-30 seconds depending on the number of unique endpoints
- OpCache hit rate after full warm: >99%. Hit rate during warm: 0% → rapidly increasing
- Load balancer drain timeout: set to 2x max request duration (typically 60-120s)
- Thundering herd during warm: multiple servers hitting the same endpoints simultaneously can overwhelm backend services

## Security Considerations

- Health check endpoint should not expose internal details publicly. Restrict to load balancer IP range.
- Warm-up scripts may trigger security monitoring. Exclude warm-up traffic from security alerts.
- Drain/rejoin cycle should be logged and monitored for anomalies.
- Pre-warming requests should be authenticated the same way as regular requests.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Skipping warm-up | Not understanding OpCache cold-start | Users see 3-5s response times | Always warm before re-enabling traffic |
| No health check validation | Assuming reload always succeeds | Unknown worker issues serve users | Verify PHP-FPM + OpCache + DB in health check |
| Draining too quickly | Not waiting for in-flight requests | Request termination errors | Set drain timeout to 2x max request duration |
| All servers warm simultaneously | No warm-up staggering | Backend services overwhelmed | Stagger warm-ups by 5-10s per server |

## Anti-Patterns

- **Deploying to all servers at once**: Zero-downtime requires rolling. Deploying everywhere simultaneously causes fleet-wide latency spikes during warm-up.
- **Not testing the deployment pipeline**: The zero-downtime process should be tested in staging. Failed deployments in production cause longer incidents.
- **Ignoring database migration compatibility**: Code changes that require new schema break old workers during rolling deployments.
- **Manual deployment process**: Human error in drain/warm/rejoin sequence causes downtime. Automate the entire pipeline.

## Examples

```bash
# Zero-downtime deployment sequence per server
# 1. Drain (via load balancer API)
aws elbv2 deregister-targets --target-group-arn $TG --targets Id=$INSTANCE
# 2. Wait for drain
sleep 30
# 3. Deploy code
rsync -a --delete /build/ /app/
# 4. Reload PHP-FPM
systemctl reload php8.3-fpm
sleep 5
# 5. Warm OpCache
for url in / /api/health /api/products; do curl -s -o /dev/null http://localhost$url; done
# 6. Verify health
curl -s http://localhost/health | grep '"status":"ok"'
# 7. Rejoin
aws elbv2 register-targets --target-group-arn $TG --targets Id=$INSTANCE
```

## Related Topics

- PHP-FPM Graceful Reload Patterns
- OpCache Reset Strategies
- Blue-Green Deployment OpCache
- Containerized Deployment Cache Strategies

## AI Agent Notes

- Zero-downtime PHP deployment requires load balancer orchestration, not just PHP-FPM graceful reload.
- OpCache pre-warming is essential — cold OpCache means 3-5s response times for first users.
- Health checks should verify OpCache hit rate, not just HTTP 200 status.
- Rolling deployments are more resource-efficient than blue-green but require backward-compatible schema changes.

## Verification

- [ ] Load balancer drain configured with appropriate timeout
- [ ] OpCache warm-up script covers all critical endpoints
- [ ] Health check verifies OpCache hit rate > 95%
- [ ] Rolling deployment sequence tested in staging
- [ ] Warm-ups staggered across fleet (5-10s apart)
- [ ] Database schema changes backward-compatible
- [ ] Deployment pipeline automated with rollback capability
- [ ] Monitoring configured to detect anomalies during deployment
