# Standardized Knowledge: Multi-Instance Cache Coordination

## Metadata

| Field | Value |
|-------|-------|
| Domain | Performance & Runtime Engineering |
| Subdomain | Deployment & Cache Invalidation |
| Knowledge Unit | Multi-Instance Cache Coordination |
| Difficulty | Advanced |
| Lifecycle | Deploy, Operate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |

## Overview

In horizontally scaled PHP deployments (multiple servers behind a load balancer), each instance has its own OpCache. There is no shared OpCache across instances. Cache coordination requires: invalidating all instances (cachetool with multi-host support), ensuring all instances are warmed before accepting traffic, and handling the transition window where some instances serve old code and some serve new.

## Core Concepts

- **No Shared OpCache**: OpCache memory is per-machine (SysV shared memory). Horizontal scaling with N instances means N independent OpCaches. Each must be invalidated separately.
- **cachetool Multi-Host**: `cachetool opcache:reset --all` or iterate over hosts. Each host's web endpoint executes opcache_reset() independently.
- **Rolling Warm-Up**: In a rolling deployment, instances are updated one at a time. New instance is warmed and health-checked before the next instance begins. At any point, 1/N instances are new, others are old.
- **Sticky Sessions**: Load balancer session affinity prevents a user from hitting old and new instances during the transition window. Session cookie ensures consistent versioning per user session.

## When To Use

- Multi-server PHP-FPM deployments behind a load balancer
- Autoscaling groups where instances are added/removed dynamically
- Rolling deployment strategies across a fleet
- Any horizontally scaled PHP application

## When NOT To Use

- Single-server deployments (no coordination needed)
- Blue-green deployments with full environment cutover (traffic switch is atomic)
- Environments where OpCache is not used (rare in production)
- Containerized deployments with pre-warmed file cache (cache is in the image)

## Best Practices

- **Use cachetool with --all flag**: cachetool opcache:reset --all iterates across all configured hosts. No need for per-host loops in custom scripts.
- **Implement sticky sessions**: Load balancer session affinity (same client → same server) prevents mixed-version execution during rolling deployments.
- **Warm before enabling traffic**: Each instance must be warmed and health-checked before it receives traffic. Never let a cold instance serve users.
- **Monitor the transition window**: During rolling deployment, track error rates per instance. Anomalies in an instance may indicate deployment issues.
- **Coordinate via configuration management**: Ansible/Chef/Puppet deploys code across the fleet. Post-deployment step: run cachetool on all hosts in parallel.

## Architecture Guidelines

- **OpCache Is Per-Machine**: This is a fundamental architectural constraint. OpCache uses SysV shared memory (or mmap), which is local to the machine. There is no network-distributed OpCache.
- **Rolling Deployment Consistency**: At any point during rolling deployment, some instances serve old code and some serve new. The application must handle this gracefully — backward-compatible API responses, no schema changes that break old code.
- **cachetool Architecture**: Each instance runs a PHP web endpoint (e.g., /opcache.php) that executes opcache_reset(). cachetool sends HTTP requests to each endpoint. The endpoint should be authentication-protected.
- **Autoscaling Implications**: When a new instance is added by the autoscaler, it has no OpCache. It must be pre-warmed before it can serve traffic effectively.

## Performance Considerations

- Per-instance warm-up: 5-30s each. For a 10-server fleet: 50-300s total deployment time.
- OpCache hit rate during warm-up on new instances: 0% → 99% over 30-120s
- Mixed version window: during rolling deployment, different instances serve different code versions
- CPU spike on each instance during warm-up: all files compile simultaneously

## Security Considerations

- cachetool web endpoints must be authentication-protected to prevent unauthorized cache manipulation.
- Multi-instance deployment automation must use secure communication (HTTPS, API tokens).
- Sticky sessions using cookies may have privacy implications — use secure, short-lived session cookies.
- SSH-based cache invalidation (cachetool --ssh) is more secure than HTTP but requires SSH key management.

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Assuming OpCache is shared across instances | Not understanding OpCache architecture | Only one instance invalidated, others serve stale code | Use cachetool --all or iterate per-instance |
| Not using sticky sessions | Load balancer default config | User requests hit old and new instances, inconsistent state | Enable load balancer session affinity |
| Warming only one endpoint | Incomplete warm-up | Unexpected endpoints hit cold OpCache | Warm all critical endpoints per instance |
| No health check after warm-up | Assuming warm-up always succeeds | Cold instances serve traffic | Verify OpCache hit rate before enabling traffic |

## Anti-Patterns

- **Invalidating all instances simultaneously**: Causes a fleet-wide performance spike as all instances recompile simultaneously. Stagger invalidations.
- **Manual per-instance invalidation**: Human error will miss an instance. Automate with cachetool or configuration management.
- **Ignoring the mixed-version window**: Code that can't handle backward compatibility breaks during rolling deployments.
- **Not testing multi-instance deployment**: The first time you test is during a production incident. Test multi-instance deployments in staging.

## Examples

```bash
# Multi-instance OpCache reset via cachetool
cachetool opcache:reset --all

# Manual per-instance iteration
for host in web1 web2 web3; do
    cachetool opcache:reset --web-path=http://$host/opcache.php
done

# Rolling warm-up per instance
for host in web1 web2 web3; do
    for url in / /api/health /api/products; do
        curl -s -o /dev/null http://$host$url
    done
done
```

## Related Topics

- Deployment Cache Invalidation
- CI/CD Cache Invalidation Steps
- Zero-Downtime Deployment OpCache
- OpCache Reset Strategies

## AI Agent Notes

- OpCache is ALWAYS per-machine. There is no network-shared OpCache. This is fundamental to PHP's architecture.
- cachetool --all iterates across hosts configured in your cachetool config.
- Sticky sessions prevent users from experiencing mixed versions during rolling deployments.
- Each instance must be independently invalidated and warmed. No single operation covers the fleet.

## Verification

- [ ] All instances identified and inventory documented
- [ ] cachetool configured with --all or per-host iteration
- [ ] Sticky sessions enabled on load balancer
- [ ] Each instance warmed independently before traffic enable
- [ ] Health check verifies OpCache hit rate per instance
- [ ] Mixed-version window duration documented
- [ ] Backward-compatible code changes for rolling deployments
- [ ] Autoscaling warm-up configured for new instances
