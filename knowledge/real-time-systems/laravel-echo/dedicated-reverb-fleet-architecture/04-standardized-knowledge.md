# Standardized Knowledge: Dedicated Reverb Fleet Architecture

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | Real-Time Systems |
| Subdomain | Client-Side Subscriptions (Echo) |
| Knowledge Unit ID | K33 |
| Knowledge Unit | Dedicated Reverb Fleet Architecture |
| Difficulty | Advanced |
| Maturity | Stable |
| Confidence | High |
| Last Updated | 2026-06-02 |

## Overview

A dedicated Reverb fleet separates WebSocket servers from application servers, deploying Reverb instances as an independent service layer behind a load balancer. This architecture isolates WebSocket connection lifecycle from HTTP request processing, enabling independent scaling, deployment, and failure domains. The fleet consists of multiple Reverb instances that handle only WebSocket connections, while separate application servers handle HTTP traffic and queue processing. Redis pub/sub bridges the two layers. This pattern is essential for high-scale deployments (>10k concurrent connections) where co-locating Reverb with the application server is insufficient.

## Core Concepts

In a dedicated fleet, Reverb instances become stateless workers that only manage WebSocket connections. They receive broadcast events from application servers via Redis pub/sub. The application layer handles event dispatch, and the Reverb fleet handles client delivery. This separation allows each layer to scale independently: more application servers for HTTP throughput, more Reverb instances for WebSocket connections. The load balancer in front of the Reverb fleet must use sticky sessions to maintain connection affinity.

## When To Use

- Applications exceeding single-instance connection capacity (>10k concurrent)
- Kubernetes deployments (ReplicaSet for Reverb pods)
- SaaS platforms needing independent WebSocket availability from application updates
- Blue-green deployment strategies for real-time applications
- Enterprise deployments with dedicated infrastructure teams

## When NOT To Use

- Small to medium deployments (<10k connections) where a single Reverb instance suffices
- Development/staging environments where infrastructure complexity is not justified
- Teams without operational expertise to manage multi-service architecture

## Best Practices (WHY)

- **Separate scaling domains**: Scale application servers based on HTTP throughput, Reverb instances based on connection count—each dimension independently
- **Stateless Reverb nodes**: All shared state lives in Redis; Reverb instances can be destroyed and recreated freely
- **Connection draining on deploy**: Reverb instances should stop accepting new connections, allow existing connections to drain, then restart—prevents mass disconnections
- **Separate Redis instance**: Use a dedicated Redis for fleet pub/sub vs cache/queue Redis to limit blast radius

## Architecture Guidelines

- Redis pub/sub is the coupling point between application and WebSocket layers
- Sticky sessions are required—WebSocket connections are stateful at the instance level
- The fleet only handles WebSocket protocol; HTTP auth goes through the application
- No direct HTTP traffic to Reverb—always behind Nginx or load balancer
- Fleet instances should be right-sized for WebSocket workload (network I/O optimized, memory-bound)

## Performance Considerations

- Fleet instances can be right-sized for WebSocket workload (network I/O optimized, memory-bound rather than CPU-bound)
- Redis pub/sub throughput becomes the bottleneck; benchmark with `redis-benchmark` for pub/sub capacity
- Sticky sessions reduce load balancer flexibility compared to round-robin
- Connection distribution depends on load balancer algorithm; IP hash can cause uneven distribution
- File descriptors (`ulimit -n`) must be provisioned adequately

## Security Considerations

- Redis pub/sub partition creates isolated island Reverb instances, losing cross-instance event delivery
- Load balancer session affinity loss bounces clients between instances, losing subscription state
- Fleet misconfiguration (wrong app credentials) silently drops broadcasts
- Deployment storms trigger reconnection waves that overwhelm auth endpoint

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| No sticky sessions on load balancer | Round-robin default | Clients bounce between instances; channel state lost | Configure IP hash or cookie-based sticky sessions |
| Shared Redis for fleet, cache, queue | Convenience; single Redis instance | Contention under load; fleet pub/sub suffers | Use dedicated Redis for Reverb pub/sub |
| No connection draining during deploy | Immediate restart | All clients disconnect simultaneously | Set `stopwaitsecs` for graceful drain |
| Under-provisioning file descriptors | Default ulimit too low | Connection limit below target | Set `ulimit -n` to expected max connections + buffer |
| Wrong fleet credentials on app servers | Config drift between deploys | Events never reach Reverb fleet | Automate config propagation via CI/CD |

## Anti-Patterns

- **Single Reverb instance at scale**: Trying to handle 50k connections on one instance without horizontal scaling
- **Round-robin load balancer**: Doesn't work for WebSocket; clients lose state on reconnect
- **Monolithic Redis**: Using the same Redis for everything, creating a single point of failure for all systems

## Examples

```env
# Reverb fleet .env
REVERB_SCALING_ENABLED=true
REVERB_SCALING_DRIVER=redis
REVERB_SCALING_CHANNEL=reverb-production
```

## Related Topics

- K04: Reverb Horizontal Scaling via Redis
- K14: Sticky Sessions & Load Balancing for WebSocket
- K32: Nginx WebSocket Proxy Configuration
- K15: Reconnection Strategies & Storm Mitigation
- K34: Redis Dependency & Failure Modes

## AI Agent Notes

- The dedicated fleet architecture is recommended for "extremely large applications" in Laravel docs
- Most teams should start with a single Reverb instance and only adopt a dedicated fleet when reaching connection limits
- Laravel 13's database scaling driver is NOT suitable for fleet architectures—Redis remains mandatory for cross-host communication

## Verification

- [ ] Sticky sessions are configured on the load balancer
- [ ] Redis pub/sub is operational between application and Reverb layers
- [ ] Connection draining is implemented for deployments
- [ ] Fleet instances have adequate file descriptor limits
- [ ] Monitoring shows even connection distribution across fleet
- [ ] Auto-scaling is configured based on aggregate connection count
- [ ] Rolling deployments do not cause full reconnection storms
- [ ] Application server broadcasting config matches Reverb fleet credentials
