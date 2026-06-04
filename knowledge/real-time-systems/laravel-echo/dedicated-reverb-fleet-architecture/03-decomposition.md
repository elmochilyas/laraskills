# Decomposition: Dedicated Reverb Fleet Architecture

## Topic Overview
A dedicated Reverb fleet separates WebSocket servers from application servers, deploying Reverb instances as an independent service layer behind a load balancer. This architecture isolates WebSocket connection lifecycle from HTTP request processing, enabling independent scaling, deployment, and failure domains. The fleet consists of multiple Reverb instances (pods, containers, or VMs) that handle only WebSocket connections, while separate application servers handle HTTP traffic and queue proc...

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
client-side-subscriptions-echo/K33-dedicated-reverb-fleet-architecture/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Dedicated Reverb Fleet Architecture
- **Purpose:** A dedicated Reverb fleet separates WebSocket servers from application servers, deploying Reverb instances as an independent service layer behind a load balancer. This architecture isolates WebSocket connection lifecycle from HTTP request processing, enabling independent scaling, deployment, and failure domains. The fleet consists of multiple Reverb instances (pods, containers, or VMs) that handle only WebSocket connections, while separate application servers handle HTTP traffic and queue proc...
- **Difficulty:** Advanced
- **Dependencies:
  - K04: Reverb Horizontal Scaling via Redis
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K32: Nginx WebSocket Proxy Configuration
  - K15: Reconnection Strategies & Storm Mitigation
  - K34: Redis Dependency & Failure Modes

## Dependency Graph
**Depends on:**
  - K04: Reverb Horizontal Scaling via Redis
  - K14: Sticky Sessions & Load Balancing for WebSocket
  - K32: Nginx WebSocket Proxy Configuration
  - K15: Reconnection Strategies & Storm Mitigation
  - K34: Redis Dependency & Failure Modes

**Depended by:**
  (Referenced by other KUs at the subdomain level)

## Boundary Analysis
**In scope:**
  - **Separate scaling domains**: Application servers scale based on HTTP throughput; Reverb instances scale based on concurrent connections**Independent deployment lifecycle**: Reverb fleet can be updated without affecting application servers and vice versa**Stateless Reverb nodes**: All shared state lives in Redis; Reverb instances can be destroyed and recreated freely**Load-balanced WebSocket ingress**: Clients connect to a single endpoint; the load balancer distributes across the fleet**Redis as the bridge**: Redis pub/sub is the coupling point between application and WebSocket layers**Sticky sessions required**: WebSocket connections are stateful at the instance level; reconnections must return to the same instance**No direct HTTP traffic to Reverb**: The fleet only handles WebSocket protocol; HTTP auth goes through the application**Connection draining on deploy**: Reverb instances should stop accepting new connections, allow existing connections to drain, then restart**Infrastructure complexity**: Multiple service layers, load balancer configuration, and Redis dependency increase operational burden**Redis as single point of failure**: Redis pub/sub disruption breaks the bridge between applications and the fleet**Connection state at instance level**: If a Reverb instance goes down, its clients must reconnect and re-subscribe**Cost**: Separate Reverb instances mean additional compute resources beyond the application servers**Sticky session management**: Session persistence at the load balancer level adds configuration and potential failure pointsFleet instances can be right-sized for WebSocket workload (network I/O optimized, memory-bound rather than CPU-bound)Redis pub/sub throughput becomes the bottleneck; monitor with `redis-benchmark` for pub/sub capacitySticky sessions reduce load balancer flexibility compared to round-robin distributionConnection distribution across the fleet depends on load balancer algorithm; IP hash can cause uneven distributionFleet instances should be provisioned with adequate file descriptors (`ulimit -n`)Deploy Reverb fleet in the same region/availability zone as Redis to minimize pub/sub latencyConfigure load balancer health checks to ping Reverb's connection endpointImplement connection draining: stop accepting new connections, set `stopwaitsecs` in Supervisor to allow graceful client migrationMonitor connection distribution across fleet instances to detect uneven loadUse auto-scaling groups for the fleet based on aggregate connection countConsider a separate Redis instance for fleet pub/sub vs cache/queue RedisImplement rolling deployments to avoid mass disconnection eventsNot configuring sticky sessions on the load balancer, causing reconnection storms and channel state lossUsing the same Redis instance for fleet pub/sub, cache, and queue without capacity planningNot implementing connection draining during deployments, causing all clients to disconnect simultaneouslyUnder-provisioning file descriptors on fleet instances, limiting connections below targetForgetting to update `config/broadcasting.php` on application servers when Reverb fleet credentials change**Redis pub/sub partition**: Network issue between fleet and Redis; Reverb instances become isolated islands**Load balancer session affinity loss**: Sticky session configuration failure; clients bounce between instances**Uneven connection distribution**: IP hash algorithm distributes poorly for certain client IP ranges**Fleet misconfiguration**: New Reverb instance joins with wrong app credentials; broadcasts do not reach its clients**Deployment storm**: All fleet instances restart simultaneously, creating a reconnection wave that overloads the auth endpointRequired for applications exceeding single-instance connection capacity (>10k concurrent)Standard pattern in Kubernetes deployments (ReplicaSet for Reverb pods)Used by SaaS platforms that must guarantee WebSocket availability independently from application updatesCommon in enterprise deployments with dedicated infrastructure teamsRequired for blue-green deployment strategies for real-time applicationsK04: Reverb Horizontal Scaling via RedisK14: Sticky Sessions & Load Balancing for WebSocketK32: Nginx WebSocket Proxy ConfigurationK15: Reconnection Strategies & Storm MitigationK34: Redis Dependency & Failure Modes

**Out of scope:**
  (Related topics are covered in other Knowledge Units within the same subdomain)

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization