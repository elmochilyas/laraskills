# Skill: Scale Reverb Horizontally with Redis Pub/Sub

## Purpose
Configure multiple Reverb instances behind a load balancer using Redis pub/sub for cross-instance event coordination, enabling elastic scaling and high availability.

## When To Use
- Multi-server Reverb deployments beyond single-instance capacity
- Kubernetes deployments with multiple Reverb pods behind a service
- Applications requiring high availability and elastic scaling
- Any deployment where a single Reverb instance cannot handle the connection load

## When NOT To Use
- Single-server deployments (use database scaling driver in Laravel 13+)
- Deployments where Redis reliability cannot be maintained
- Applications using managed WebSocket services (Pusher, Ably)

## Prerequisites
- Multiple Reverb server instances configured
- Redis instance dedicated to Reverb pub/sub
- Load balancer with sticky session support (Nginx, HAProxy, ALB)
- `phpredis` extension installed for production

## Inputs
- Reverb env vars: `REVERB_SCALING_ENABLED=true`, `REVERB_SCALING_DRIVER=redis`
- Redis connection details (host, port, password)
- Load balancer configuration with sticky sessions
- Scaling channel name (unique per environment)

## Workflow
1. Provision a dedicated Redis instance for Reverb pub/sub (separate from cache/queue)
2. Configure `REVERB_SCALING_ENABLED=true` and `REVERB_SCALING_DRIVER=redis`
3. Set Redis connection details (`REVERB_REDIS_HOST`, `REVERB_REDIS_PORT`, `REVERB_REDIS_PASSWORD`)
4. Set a unique `REVERB_SCALING_CHANNEL` per environment
5. Install `phpredis` extension for production performance
6. Configure sticky sessions on load balancer (cookie-based preferred)
7. Configure Redis authentication and network isolation
8. Update Reverb to v1.7.0+ (CVE-2026-23524 fix)
9. Deploy Redis with replication (Sentinel or Cluster) for HA
10. Test: disconnect a Reverb instance and verify clients reconnect to remaining instances

## Validation Checklist
- [ ] `REVERB_SCALING_ENABLED=true` configured
- [ ] Dedicated Redis instance for Reverb scaling
- [ ] `phpredis` extension installed in production
- [ ] Redis authentication and network isolation configured
- [ ] Sticky sessions configured on load balancer
- [ ] Unique `REVERB_SCALING_CHANNEL` per environment
- [ ] Reverb version v1.7.0+
- [ ] Redis deployed with replication for HA

## Common Failures
| Failure | Likely Cause | Diagnostic |
|---------|-------------|------------|
| Events reach only clients on one instance | `REVERB_SCALING_ENABLED` not set | Set `REVERB_SCALING_ENABLED=true` |
| Clients lose subscriptions on reconnect | No sticky sessions on load balancer | Configure cookie-based or IP hash stickiness |
| Cross-environment message leakage | Same scaling channel for staging and production | Set unique `REVERB_SCALING_CHANNEL` per env |
| Redis becomes bottleneck at high load | Shared Redis with cache/queue contention | Use dedicated Redis for Reverb pub/sub |
| High broadcast latency | `Predis` instead of `phpredis` | Install `phpredis` extension |
| RCE vulnerability | Reverb <1.7.0 or Redis exposed | Update Reverb, bind Redis to internal IP |

## Decision Points
- **phpredis vs Predis**: `phpredis` for production (2-3x faster); Predis acceptable for development
- **Dedicated vs shared Redis**: Dedicated for production to prevent contention; shared for single-server or dev
- **Scaling channel name**: Use environment-based naming (`reverb-staging`, `reverb-production`) to prevent cross-environment leakage

## Performance/Security Considerations
- Redis pub/sub adds ~1-5ms latency per broadcast event (same datacenter)
- `phpredis` is 2-3x faster than Predis for pub/sub operations
- Each Reverb instance consumes a Redis connection for subscribing — monitor `maxclients`
- Redis must be protected with authentication and network isolation
- Use TLS for Redis connections in production

## Related Rules (from 05-rules.md)
- Always Enable `REVERB_SCALING_ENABLED=true` for Multi-Instance Setups
- Always Use a Dedicated Redis Instance for Reverb Scaling
- Always Use `phpredis` in Production Over Predis
- Always Configure Sticky Sessions on the Load Balancer
- Always Use a Unique Scaling Channel Per Environment

## Related Skills
- Manage Redis Dependency and Failure Modes for Reverb
- Set Up Sticky Sessions for Multi-Server Reverb Deployments
- Deploy and Operate a Dedicated Reverb Fleet

## Success Criteria
- Events broadcast on any Reverb instance reach clients connected to all instances
- Reconnecting clients return to their original instance (sticky sessions)
- Redis pub/sub handles peak message rates without bottleneck
- Each environment has isolated scaling channels (no cross-environment leakage)
- Redis is secured with authentication and network isolation
