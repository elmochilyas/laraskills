# Standardized Knowledge: Blue-Green Deployment with OpCache

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Blue-Green Deployment with OpCache |
| Difficulty | Intermediate |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

Blue-green deployment for PHP-FPM maintains two identical environments (blue = current, green = new). Deploy to green with all caches warmed. Switch traffic from blue to green via load balancer. Blue remains as rollback target. Each environment has independent OpCache instances — no cache sharing, no cross-contamination, immediate full cache warm without affecting production.

## Core Concepts

- **Infrastructure**: Two sets of PHP-FPM instances. Each has own OpCache shared memory, own preloading, own OpCache file cache. Load balancer routes traffic to active set.
- **Deployment Flow**: Deploy to green (inactive) → Start green PHP-FPM → Preloading executes → Warm green OpCache (hit all endpoints) → Health check green → Switch load balancer to green → Verify → Decommission blue or keep as rollback.
- **Rollback**: Switch load balancer back to blue. Blue OpCache is still warm (unchanged during deployment). Instant rollback with zero warm-up time.
- **Cold-Start Elimination**: Green is fully warmed before receiving traffic. First request to green is as fast as steady-state because OpCache and preloading are fully populated.

## When To Use

- Critical production services requiring instant rollback capability
- Applications where cold-start latency after deployment is unacceptable
- Teams with infrastructure budget to maintain duplicate environments
- High-traffic services where any performance degradation during deployment is unacceptable

## When NOT To Use

- Single-server deployments (no capacity for duplicate environment)
- Cost-constrained environments (2x infrastructure cost)
- Small services where deployment cold-start is acceptable (30s of slower requests)
- Environments without load balancer traffic switching capability

## Best Practices

- **Warm green fully before switching**: Run a comprehensive warm-up script that hits all critical endpoints. Verify 100% OpCache hit rate before routing traffic.
- **Health check before switch**: Green must pass all health checks (OpCache hit rate, database connectivity, worker count, listen queue) before receiving traffic.
- **Keep blue for rollback**: After switching, keep blue running until the next deployment. Instant rollback is the primary advantage of blue-green.
- **Automate the switch**: Manual traffic switching is error-prone. Use load balancer API or infrastructure-as-code for automated cutover.
- **Test green independently**: Green should be fully functional without blue. Independent database connections, cache stores, and queue workers.

## Architecture Guidelines

- **Independent OpCache**: Each environment has separate OpCache shared memory. There is no cache sharing. This is inherent to PHP-FPM's architecture — OpCache is per-machine shared memory.
- **Independent Preloading**: Each environment runs its own preloading script at startup. Green's preloading doesn't affect blue.
- **Database Compatibility**: Both environments must work with the same database schema during transition. Apply backward-compatible schema changes before blue-green switch.
- **Load Balancer Requirements**: The load balancer must support weighted routing or instant switch between target groups. AWS ALB, HAProxy, and Nginx all support this.

## Performance Considerations

- No cold-start latency for green — fully warmed before traffic
- Zero rollback latency — blue is already warm
- 2x infrastructure cost during transition (both environments running)
- Warm-up time: 30-120 seconds depending on endpoint count

## Security Considerations

- Green environment introduces additional attack surface (running alongside production)
- Ensure green is not accidentally exposed to external traffic before switch
- Load balancer configuration changes should be logged and audited
- Blue-green environments must use separate secrets and credentials

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Switching traffic without warming green | Impatience | Users experience 3-5x latency on first requests | Always warm fully before switching |
| Not keeping blue after switch | Cost savings | No instant rollback capability | Keep blue running until next deployment |
| Shared database configuration | Infrastructure reuse | Green affects production database during warm-up | Use dedicated or isolated database connections |
| Manual traffic switch | Convenience | Human error causes traffic loss | Automate switch via load balancer API |

## Anti-Patterns

- **Using the same OpCache file cache directory for both environments**: File cache collisions cause undefined behavior. Use separate directories per environment.
- **Sharing database connections between environments**: Green's warm-up queries affect blue's production database. Isolate connection pools.
- **Skipping green health checks**: Green may start with preloading errors. Verify before switching traffic.
- **Blue-green without rollback testing**: The rollback path must be tested. A failed switch with untested rollback becomes a major incident.

## Examples

```bash
# Blue-green deployment
# Deploy to green environment
# Warm green OpCache
cachetool opcache:reset --web --web-path=http://green/opcache.php
for url in / /api/health /api/products; do
    curl -s -o /dev/null http://green$url
done
# Verify green health
curl -s http://green/health | grep '"opcache_hit_rate":100'
# Switch traffic
aws elbv2 modify-target-group-attributes \
    --target-group-arn $GREEN_TG \
    --attributes Key=slow_start.duration_seconds,Value=0
# Monitor after switch
# Keep blue running for rollback
```

## Related Topics

- Zero-Downtime Deployment OpCache
- OpCache Reset Strategies
- Deployment Cache Invalidation
- CI/CD Cache Invalidation Steps

## AI Agent Notes

- Blue-green is the ultimate solution for avoiding deployment-related performance degradation.
- Each environment gets its own OpCache — this is automatic with PHP-FPM's per-machine architecture.
- The rollback speed (instant, no warm-up) is the primary operational advantage.
- The 2x infrastructure cost is the primary disadvantage. Use rolling deployments when cost is a concern.
- Database schema changes must be backward-compatible for blue-green to work.

## Verification

- [ ] Two independent environments provisioned (blue/green)
- [ ] Each environment has separate OpCache instances
- [ ] Warm-up script covers all critical endpoints
- [ ] Health check verifies OpCache hit rate before switch
- [ ] Load balancer switch automated (not manual)
- [ ] Blue kept running after switch (instant rollback)
- [ ] Database schema changes backward-compatible
- [ ] Green tested independently before receiving traffic
- [ ] Rollback procedure tested and documented
