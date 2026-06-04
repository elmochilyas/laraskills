# Skill: Isolate Applications Using Multiple FPM Pools

## Purpose

Configure multiple PHP-FPM pools to isolate applications, control resource allocation, and prevent noisy-neighbor problems on shared servers.

## When To Use

- Running multiple applications on the same server
- Separating admin API from public API for resource control
- Isolating resource-intensive endpoints
- Multi-tenant hosting environments

## When NOT To Use

- For a single application on a dedicated server
- When containerization (Docker) provides better isolation
- Without understanding per-pool resource requirements

## Prerequisites

- PHP-FPM configured and running
- Understanding of pooling and per-pool settings
- Resource usage profiles for each application/endpoint

## Inputs

- Number of applications or endpoint groups to isolate
- Per-application resource requirements (memory, request rate)
- Shared server total RAM and CPU
- Isolation requirements (security, reliability)

## Workflow (numbered steps)

1. Identify groups that need isolation: different applications, admin vs public, high-traffic vs low-traffic
2. Create a separate pool configuration file for each group in `/etc/php/X.Y/fpm/pool.d/`
3. Configure each pool with: `[poolname]`, `listen = /run/php/poolname.sock`, `user`, `group`, and pm settings
4. Set per-pool `pm.max_children` based on the group's resource budget
5. Configure separate `pm.status_path` per pool if monitoring individually
6. Configure separate slow log per pool: `slowlog = /var/log/php/poolname-slow.log`
7. Configure separate `request_terminate_timeout` per pool if different endpoint types need different timeouts
8. Update web server configuration to route traffic to the appropriate pool socket
9. Verify isolation: a resource spike in one pool should not affect other pools
10. Document the pool configuration and isolation boundaries

## Validation Checklist

- [ ] Applications/endpoints grouped by isolation requirements
- [ ] Per-pool configuration files created
- [ ] Per-pool pm.max_children set within resource budget
- [ ] Separate listen sockets configured
- [ ] Separate slow logs per pool
- [ ] Web server routes traffic to correct pool
- [ ] Isolation verified (resource spike in one pool does not affect others)
- [ ] Configuration documented

## Common Failures

- **Not setting per-pool resource limits**: Without max_children per pool, one pool can exhaust all workers
- **Using the same socket for all pools**: Defeats the purpose of isolation — use separate Unix sockets
- **Forgetting separate slow logs**: Pool-specific debugging requires pool-specific logs
- **Over-isolating**: Too many pools with small worker counts fragment the worker pool and reduce efficiency

## Decision Points

- Separate applications with different owners: always isolate (different users, separate pools)
- Admin vs public API: isolate admin pool with lower max_children (admin traffic is lighter)
- Resource-intensive endpoint: isolate to prevent it from starving other endpoints
- Same application, different environments (staging, production): isolate for resource control
- Multi-tenant: mandatory isolation — each tenant gets its own pool with resource limits

## Performance Considerations

- Each pool maintains its own worker pool — total memory = sum of all pool max_children × per-worker RSS
- Pools do not share workers — idle workers in one pool cannot serve requests from another pool
- Pool overhead: minimal — each pool adds a small amount of shared memory for the scoreboard
- Unix socket overhead: 1-5% per additional pool for socket communication
- Pool fragmentation: many small pools have less flexibility than one large pool

## Security Considerations

- Pools can run as different OS users — provides process-level isolation between applications
- Separate Unix sockets with appropriate permissions prevent cross-pool access
- A compromise in one pool's application does not affect other pools
- Slow logs per pool help with security investigations (which pool was affected)

## Related Rules (from 05-rules.md)

- Isolate Applications with Separate Pools
- Set Per-Pool Resource Limits
- Run Pools as Different Users for Security

## Related Skills

- FPM Process Manager Mode Selection
- Capacity Planning and Safety Margins
- FPM Status Page Monitoring

## Success Criteria

- Applications/endpoints isolated into separate pools
- Per-pool resource limits prevent noisy-neighbor issues
- Resource spike in one pool does not affect others
- Separate monitoring and logging per pool
- Configuration documented with isolation rationale
