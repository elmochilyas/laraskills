# Metadata
Domain: Real-Time Systems
Subdomain: Client-Side Subscriptions (Echo)
Knowledge Unit: Dedicated Reverb Fleet Architecture
Difficulty Level: Advanced
Last Updated: 2026-06-02

## Executive Summary
A dedicated Reverb fleet separates WebSocket servers from application servers, deploying Reverb instances as an independent service layer behind a load balancer. This architecture isolates WebSocket connection lifecycle from HTTP request processing, enabling independent scaling, deployment, and failure domains. The fleet consists of multiple Reverb instances (pods, containers, or VMs) that handle only WebSocket connections, while separate application servers handle HTTP traffic and queue processing. Redis pub/sub bridges the two layers. This pattern is essential for high-scale deployments (>10k concurrent connections) where co-locating Reverb with the application server is insufficient or operationally problematic.

## Core Concepts
In a dedicated fleet, Reverb instances become stateless workers that only manage WebSocket connections. They receive broadcast events from application servers via Redis pub/sub. The application layer handles event dispatch (HTTP + queue), and the Reverb fleet handles client delivery. This separation allows each layer to scale independently: more application servers for HTTP throughput, more Reverb instances for WebSocket connections. The load balancer in front of the Reverb fleet must use sticky sessions (IP hash or cookie-based) to maintain connection affinity.

## Mental Models
The application servers are factories that produce events. The Reverb fleet is a distribution network that delivers those events to subscribed clients. They are connected by a conveyor belt (Redis pub/sub) that carries events from factory to distribution centers.

## Internal Mechanics
The dedicated fleet requires: (1) Reverb instances configured with `REVERB_SCALING_ENABLED=true` and shared Redis, (2) application servers configured with the same broadcasting credentials so queue workers can publish to the correct Reverb app, (3) a load balancer (Nginx, HAProxy, AWS ALB) with WebSocket upgrade support and sticky sessions, (4) Redis connectivity from both application and Reverb layers. The application queue worker calls the broadcast driver, which publishes to Reverb's Redis channel. Reverb instances subscribed to Redis receive the event and deliver to locally connected clients. The `REVERB_SCALING_CHANNEL` env var can be used to namespace the fleet's communication channel.

## Patterns
- **Separate scaling domains**: Application servers scale based on HTTP throughput; Reverb instances scale based on concurrent connections
- **Independent deployment lifecycle**: Reverb fleet can be updated without affecting application servers and vice versa
- **Stateless Reverb nodes**: All shared state lives in Redis; Reverb instances can be destroyed and recreated freely
- **Load-balanced WebSocket ingress**: Clients connect to a single endpoint; the load balancer distributes across the fleet

## Architectural Decisions
- **Redis as the bridge**: Redis pub/sub is the coupling point between application and WebSocket layers
- **Sticky sessions required**: WebSocket connections are stateful at the instance level; reconnections must return to the same instance
- **No direct HTTP traffic to Reverb**: The fleet only handles WebSocket protocol; HTTP auth goes through the application
- **Connection draining on deploy**: Reverb instances should stop accepting new connections, allow existing connections to drain, then restart

## Tradeoffs
- **Infrastructure complexity**: Multiple service layers, load balancer configuration, and Redis dependency increase operational burden
- **Redis as single point of failure**: Redis pub/sub disruption breaks the bridge between applications and the fleet
- **Connection state at instance level**: If a Reverb instance goes down, its clients must reconnect and re-subscribe
- **Cost**: Separate Reverb instances mean additional compute resources beyond the application servers
- **Sticky session management**: Session persistence at the load balancer level adds configuration and potential failure points

## Performance Considerations
- Fleet instances can be right-sized for WebSocket workload (network I/O optimized, memory-bound rather than CPU-bound)
- Redis pub/sub throughput becomes the bottleneck; monitor with `redis-benchmark` for pub/sub capacity
- Sticky sessions reduce load balancer flexibility compared to round-robin distribution
- Connection distribution across the fleet depends on load balancer algorithm; IP hash can cause uneven distribution
- Fleet instances should be provisioned with adequate file descriptors (`ulimit -n`)

## Production Considerations
- Deploy Reverb fleet in the same region/availability zone as Redis to minimize pub/sub latency
- Configure load balancer health checks to ping Reverb's connection endpoint
- Implement connection draining: stop accepting new connections, set `stopwaitsecs` in Supervisor to allow graceful client migration
- Monitor connection distribution across fleet instances to detect uneven load
- Use auto-scaling groups for the fleet based on aggregate connection count
- Consider a separate Redis instance for fleet pub/sub vs cache/queue Redis
- Implement rolling deployments to avoid mass disconnection events

## Common Mistakes
- Not configuring sticky sessions on the load balancer, causing reconnection storms and channel state loss
- Using the same Redis instance for fleet pub/sub, cache, and queue without capacity planning
- Not implementing connection draining during deployments, causing all clients to disconnect simultaneously
- Under-provisioning file descriptors on fleet instances, limiting connections below target
- Forgetting to update `config/broadcasting.php` on application servers when Reverb fleet credentials change

## Failure Modes
- **Redis pub/sub partition**: Network issue between fleet and Redis; Reverb instances become isolated islands
- **Load balancer session affinity loss**: Sticky session configuration failure; clients bounce between instances
- **Uneven connection distribution**: IP hash algorithm distributes poorly for certain client IP ranges
- **Fleet misconfiguration**: New Reverb instance joins with wrong app credentials; broadcasts do not reach its clients
- **Deployment storm**: All fleet instances restart simultaneously, creating a reconnection wave that overloads the auth endpoint

## Ecosystem Usage
- Required for applications exceeding single-instance connection capacity (>10k concurrent)
- Standard pattern in Kubernetes deployments (ReplicaSet for Reverb pods)
- Used by SaaS platforms that must guarantee WebSocket availability independently from application updates
- Common in enterprise deployments with dedicated infrastructure teams
- Required for blue-green deployment strategies for real-time applications

## Related Knowledge Units
- K04: Reverb Horizontal Scaling via Redis
- K14: Sticky Sessions & Load Balancing for WebSocket
- K32: Nginx WebSocket Proxy Configuration
- K15: Reconnection Strategies & Storm Mitigation
- K34: Redis Dependency & Failure Modes

## Research Notes
The dedicated fleet architecture is recommended by the Laravel documentation for "extremely large applications." The bubble.ro deep-dive (May 2026) noted that most teams should start with a single Reverb instance and only adopt a dedicated fleet when reaching connection limits. Laravel 13's database scaling driver is explicitly not suitable for fleet architectures—Redis remains mandatory for cross-host communication. Load balancer configuration for WebSocket sticky sessions varies by provider: Nginx uses `ip_hash`, HAProxy uses `balance roundrobin` with `stick-table`, AWS ALB uses stickiness on the target group.
