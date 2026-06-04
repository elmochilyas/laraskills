# Reverb Scaling

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** reverb-scaling
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Horizontal scaling of Laravel Reverb uses a shared Redis pub/sub backbone to distribute WebSocket connections across multiple server instances — each instance handles a subset of connected clients while sharing the same Redis channels for broadcasting. This enables linear connection scaling beyond a single server's limits (10,000-100,000+ concurrent connections) while maintaining sub-second broadcast latency.

---

## Core Concepts

- **Reverb Instance:** A single Reverb server process handling a subset of all WebSocket connections — typically one instance per CPU core — each instance has a connection registry tracking only its own connections
- **Redis Pub/Sub Backbone:** Shared message bus — when any Reverb instance publishes a broadcast, Redis fans out the message to all subscribed instances — each subscribed instance forwards to its local WebSocket connections
- **Sticky Sessions:** Load balancers must use session affinity to route WebSocket connections to the same Reverb instance for the connection's duration — identified by server-assigned ID
- **Client Connection Registry:** Each instance maintains an in-memory registry of connected clients — maps connection IDs to WebSocket resources — local to each instance, no global registry required
- **Scaling Boundary:** Reverb scales horizontally by adding more instances behind a load balancer — upper bound determined by Redis pub/sub throughput and load balancer's WebSocket handling capacity

---

## Mental Models

- **Reverb Instances as Call Center Agents:** Each Reverb instance is a call center agent handling a subset of customers (connections). Redis is the intercom system — when one agent needs to broadcast a message to all customers, they use the intercom, and every agent passes the message to their customers. Sticky sessions ensure a customer always talks to the same agent.
- **Redis as Party Line:** Redis pub/sub is like a party line telephone — everyone on the line hears when someone speaks. Each Reverb instance is on the line, listening and repeating to its local connections. More instances = more people on the party line = more repeaters.

---

## Internal Mechanics

When a WebSocket connection arrives, the load balancer assigns it to a Reverb instance using sticky session cookies. The instance registers the connection in its local registry. When a broadcast event occurs (from Laravel's `ShouldBroadcast`), the publishing Reverb instance sends the message to Redis pub/sub on the appropriate channel. All subscribed Reverb instances receive the message from Redis and look up which of their local connections are subscribed to that channel, then forward the message over WebSocket.

---

## Patterns

- **Dedicated Redis Instance:** The pub/sub backbone Redis must be separate from Laravel's cache/session Redis — pub/sub operations are CPU-intensive and mixing workloads degrades both
- **Prefer Smaller Instances:** Use multiple small instances (2-4 CPU cores) rather than fewer large instances — better failure isolation, losing one instance affects fewer connections
- **Configure Sticky Sessions Correctly:** Use `REVERB_SCALING_ENABLED=true` and configure load balancer for cookie-based or source-IP-based affinity — validate WebSocket upgrades are routed to same instance

---

## Architectural Decisions

Use horizontal scaling beyond 10,000 concurrent connections or for high-availability requirements. Use dedicated Redis instance for pub/sub backbone — never share with cache/session. Set `REVERB_MAX_CONNECTIONS` per instance to prevent memory overload. Use sticky sessions for load balancer routing. Monitor per-instance connection distribution.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Linear connection scaling | Redis pub/sub adds ~5ms latency | Acceptable for most real-time use cases |
| N+1 redundancy for HA | Sticky session management complexity | Load balancer must support session affinity |
| Better failure isolation with small instances | More instances to manage | Operational overhead of multiple processes |
| Up to 100K+ concurrent connections | Redis network bandwidth bottleneck | Monitor pub/sub throughput limits |

---

## Performance Considerations

Redis pub/sub latency: 1-5ms within same datacenter. Broadcast fanout: one publish to Redis = N messages delivered (one per subscribed instance). Memory per connection: ~2-5KB per WebSocket connection in Reverb's registry. Redis network bandwidth is the bottleneck for high-throughput broadcasts.

---

## Production Considerations

Monitor connections per instance, broadcasts per second, Redis pub/sub latency, and instance memory usage. A single overloaded instance degrades all broadcasts. Uneven connection distribution across instances can cause bottlenecks — monitor and adjust load balancer weights. Set connection limits per instance for graceful rejection under connection storms.

---

## Common Mistakes

- **No Sticky Sessions:** WebSocket connections routed to random Reverb instances — connection authentication works but subsequent broadcasts fail because registry is on wrong instance. Better: configure sticky sessions with `REVERB_SCALING_ENABLED=true`.
- **Shared Redis With Cache:** Redis pub/sub backbone shares same instance as Laravel cache and sessions — cache eviction competes with pub/sub, broadcast latency spikes during cache flushes. Better: use dedicated Redis instance.
- **Uneven Connection Distribution:** Load balancer distributes connections unevenly — one instance has 15,000 connections while others have 5,000 — overloaded instance becomes bottleneck. Better: monitor distribution, adjust weights.

---

## Failure Modes

- **No Connection Limit:** Reverb instances with no upper limit — under connection storms (marketing campaign), instances exceed memory limits, all connections on overloaded instance disconnected. Mitigation: set `REVERB_MAX_CONNECTIONS`, design for graceful rejection.
- **Redis Pub/Sub Saturation:** All instances broadcasting simultaneously — Redis pub/sub reaches throughput limit, messages queued or dropped. Mitigation: monitor Redis pub/sub throughput, scale Redis cluster or reduce broadcast frequency.
- **Load Balancer Sticky Session Failure:** Session affinity breaks during deployment or scaling event — connections routed to wrong instance, broadcasts fail. Mitigation: validate sticky session configuration, test during deployments.

---

## Ecosystem Usage

Reverb scaling is configured through environment variables (`REVERB_SCALING_ENABLED`, `REVERB_MAX_CONNECTIONS`) and the load balancer configuration. No PHP code changes are needed for scaling — the application uses the same `ShouldBroadcast` events regardless of scaling mode. The dedicated Redis pub/sub instance is configured in `config/reverb.php` or through environment variables.

---

## Related Knowledge Units

### Prerequisites
- Reverb WebSocket — Base Reverb architecture
- Redis Pub/Sub — Understanding of Redis pub/sub mechanism

### Related Topics
- Custom Reverb Driver — Alternative backbones beyond Redis
- Reverb WebSocket — Broadcasting fundamentals

### Advanced Follow-up Topics
- Reverb Scaling — Advanced scaling patterns and multi-region deployments

---

## Research Notes

Reverb's scaling architecture is based on the standard pattern for horizontal WebSocket scaling — each server manages its own connections while a shared pub/sub layer (Redis) provides the communication backbone. The key operational insights are: dedicated Redis instance for pub/sub, correct sticky session configuration, and per-instance connection limits. The architecture handles 10,000-100,000+ concurrent connections in production deployments with proper configuration.
