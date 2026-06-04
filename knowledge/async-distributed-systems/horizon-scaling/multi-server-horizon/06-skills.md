# Skill: Deploy Multi-Server Horizon

## Purpose
Run Horizon across multiple servers sharing the same Redis backend to scale worker capacity linearly and provide high availability.

## When To Use
Scaling worker capacity beyond a single server's resources; HA requirement (one server failure doesn't stop processing); elastic auto-scaling groups; heterogeneous workloads.

## When NOT To Use
Single-server adequate for throughput; when Redis cannot handle connection load from multiple servers; simple apps where `queue:work` with Supervisor is sufficient.

## Prerequisites
- Redis backend accessible from all servers
- Same `config/horizon.php` deployed to all servers
- Redis `maxclients` set appropriately

## Inputs
- Number of servers and worker count per server
- Total Redis connection budget

## Workflow
1. Use symmetric supervisor config on all servers by default
2. Monitor global Redis connection count: workers × servers + master connections
3. Run `horizon:terminate` across ALL servers during deployments (rolling restart)
4. Expect auto-balancing per server — no global cross-server balancing
5. For asymmetric hardware: tune `minProcesses`/`maxProcesses` per server
6. Design for server failure — remaining servers absorb the load
7. Monitor per-server worker counts globally via Horizon dashboard

## Validation Checklist
- [ ] Same config deployed across all servers (symmetric default)
- [ ] Redis `maxclients` >= total workers + headroom across all servers
- [ ] Deployment script terminates Horizon on ALL servers sequentially
- [ ] Auto-balancing expected per-server (not global)
- [ ] Server failure doesn't stop queue processing
- [ ] Dashboard shows supervisors from all servers
- [ ] Redis network-isolated with authentication

## Common Failures
- Assuming cross-server balancing — each server balances independently
- Not monitoring global Redis connections — some connections rejected
- Different config per server — config drift, some queues not processed
- Skipping `horizon:terminate` on some servers — those run old code
- No capacity monitoring after server failure — capacity halved silently

## Decision Points
- Standard: symmetric config on all servers
- Asymmetric hardware: per-server minProcesses/maxProcesses tuning
- Elastic scaling: add/remove servers based on queue depth

## Related Rules
- Rule 1: use-symmetric-config-across-servers
- Rule 2: monitor-global-redis-connections
- Rule 3: rolling-restart-all-servers
- Rule 4: expect-per-server-auto-balancing

## Related Skills
- Configure Horizon Supervisors for Queue Workers
- Tune Auto Balancing with `time` Strategy
- Configure Redis Cluster Support in Horizon

## Success Criteria
All servers run symmetric config, Redis connection budget accounts for all servers, deployments terminate Horizon across all servers, auto-balancing is per-server, and server failure is tolerated.
