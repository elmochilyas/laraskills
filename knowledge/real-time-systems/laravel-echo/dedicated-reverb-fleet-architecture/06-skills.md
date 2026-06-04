# Skill: Deploy and Operate a Dedicated Reverb Fleet

## Purpose
Architect and operate a horizontally scaled Reverb fleet that separates WebSocket servers from application servers for high-scale real-time deployments.

## When To Use
- Applications exceeding single-instance connection capacity (>10k concurrent)
- Kubernetes deployments requiring independent Reverb scaling
- Blue-green deployment strategies for real-time applications
- Enterprise deployments requiring independent WebSocket availability

## When NOT To Use
- Small to medium deployments (<10k connections) where a single instance suffices
- Development/staging environments where fleet complexity is not justified
- Teams lacking operational expertise for multi-service architecture

## Prerequisites
- Multiple Reverb instances deployed behind a load balancer
- Redis instance for pub/sub cross-instance coordination
- Nginx or HAProxy configured as WebSocket load balancer
- Supervisor or container orchestration for process management

## Inputs
- Load balancer configuration (sticky sessions, health checks)
- Redis connection details for fleet pub/sub
- Reverb environment variables per instance
- Deployment pipeline configuration

## Workflow
1. Provision a dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
2. Configure `REVERB_SCALING_ENABLED=true` and `REVERB_SCALING_DRIVER=redis` on all instances
3. Set a unique `REVERB_SCALING_CHANNEL` per environment
4. Configure the load balancer with cookie-based sticky sessions (not IP hash)
5. Set `proxy_read_timeout` higher than Reverb's activity timeout
6. Configure health checks that verify Reverb is accepting WebSocket connections
7. Set Supervisor `stopwaitsecs` to at least 2x `activity_timeout` for connection draining
8. Implement rolling deployments: restart one instance at a time
9. Monitor per-instance connection distribution for balanced load
10. Set `ulimit -n` to exceed expected max connections by at least 25%

## Validation Checklist
- [ ] Sticky sessions configured (cookie-based preferred over IP hash)
- [ ] Dedicated Redis instance for fleet pub/sub (not shared with cache/queue)
- [ ] Unique `REVERB_SCALING_CHANNEL` per environment
- [ ] Connection draining (`stopwaitsecs`) matches deployment strategy
- [ ] File descriptor limits adequate for expected connections
- [ ] Per-instance connection monitoring in place
- [ ] Rolling deployment tested without full reconnection storm

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Clients bounce between instances | No sticky sessions on load balancer | Verify load balancer has `ip_hash` or cookie affinity |
| Events don't reach some clients | `REVERB_SCALING_ENABLED` not set | Check env var on all instances |
| Cross-environment event leakage | Same scaling channel in staging and production | Verify unique `REVERB_SCALING_CHANNEL` per env |
| Reconnection storm on deploy | No connection draining | Set `stopwaitsecs` to 2x `activity_timeout` |

## Decision Points
- **Cookie-based vs IP hash**: Cookie-based works through NAT and mobile networks; IP hash fails with shared corporate gateways
- **Separate Reverb DNS**: Use `ws.example.com` to isolate WebSocket routing from HTTP
- **Redis Sentinel/Cluster**: Required for high-availability Redis in the fleet

## Performance/Security Considerations
- Right-size fleet instances for WebSocket workload (network I/O optimized, memory-bound)
- Redis pub/sub throughput is the bottleneck—benchmark with `redis-benchmark`
- File descriptor limits must exceed expected max connections by 25%
- Use unique app credentials per environment to prevent data leakage

## Related Rules (from 05-rules.md)
- Always Configure Sticky Sessions on the Load Balancer
- Always Use a Dedicated Redis Instance for Fleet Pub/Sub
- Always Implement Connection Draining on Deployment
- Always Monitor Connection Distribution Across Fleet Instances
- Never Share Fleet Credentials Across Environments

## Related Skills
- Scale Reverb Horizontally via Redis Pub/Sub
- Deploy Reverb Behind Nginx Reverse Proxy
- Configure Sticky Sessions for WebSocket Load Balancing

## Success Criteria
- Fleet handles target concurrent connections with headroom
- Events reach all clients regardless of which instance they're connected to
- Rolling deployments cause no noticeable disruption to connected clients
- Connection distribution is balanced across fleet instances
