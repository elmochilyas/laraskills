# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** reverb-scaling
**Difficulty:** Advanced
**Category:** Reverb Broadcasting
**Last Updated:** 2026-06-03

---

# Overview

Horizontal scaling of Laravel Reverb uses a shared Redis pub/sub backbone to distribute WebSocket connections across multiple Reverb server instances. Each Reverb instance handles a subset of connected clients, but all instances share the same Redis pub/sub channels for publishing and receiving broadcasts. This enables linear connection scaling beyond a single server's limits (10,000-100,000+ concurrent connections) while maintaining sub-second broadcast latency.

Engineers must care because WebSocket connections are long-lived and stateful — they cannot be load-balanced arbitrarily like HTTP requests. Reverb's scaling architecture solves this by splitting the problem: each server manages its own connections, while Redis provides the shared communication layer that allows any server to broadcast to any connection.

---

# Core Concepts

## Reverb Instance

A single Reverb server process handling a subset of all WebSocket connections. Typically one instance per CPU core. Each instance has a connection registry tracking only its own connections.

## Redis Pub/Sub Backbone

Redis pub/sub channels serve as the shared message bus. When any Reverb instance publishes a broadcast to a channel, Redis fans out the message to all subscribed Reverb instances. Each subscribed instance then forwards the message to its local WebSocket connections.

## Sticky Sessions

Load balancers must use sticky sessions (session affinity) to route WebSocket connections to the same Reverb instance for the duration of the connection. Reverb identifies connections by a server-assigned ID, and routing must not change mid-connection.

## Client Connection Registry

Each Reverb instance maintains an in-memory registry of connected clients. The registry maps connection IDs to WebSocket resources. This registry is local to each instance — no global registry is required.

## Scaling Boundary

Reverb scales horizontally by adding more instances behind a load balancer. The upper bound is determined by Redis pub/sub throughput and the load balancer's WebSocket handling capacity. Practical limits: 10,000-50,000 connections per instance, 100,000+ total.

---

# When To Use

- Beyond 10,000 concurrent WebSocket connections (single-server limit)
- High-availability requirements (N+1 redundancy)
- Multi-region WebSocket deployments
- Broadcasting to 50,000+ clients simultaneously

---

# When NOT To Use

- Less than 5,000 concurrent connections (single instance is simpler)
- Low-latency requirements below 10ms (Redis pub/sub adds ~5ms per hop)
- Development and staging environments (single instance is sufficient)

---

# Best Practices

## Use Dedicated Redis Instance

The pub/sub backbone Redis must be separate from Laravel's cache/session Redis. Pub/sub operations are CPU-intensive, and mixing workloads degrades both.

## Prefer Smaller Instances

Use multiple small instances (2-4 CPU cores) rather than fewer large instances. Smaller instances have better failure isolation — losing one instance affects fewer connections.

## Configure Sticky Sessions Correctly

Use `REVERB_SCALING_ENABLED=true` and configure the load balancer for cookie-based or source-IP-based affinity. Validate that WebSocket upgrades are routed to the same instance.

## Monitor Per-Instance Metrics

Track connections per instance, broadcasts per second, Redis pub/sub latency, and instance memory usage. A single overloaded instance degrades all broadcasts.

---

# Performance Considerations

- Redis pub/sub latency: 1-5ms within the same datacenter.
- Broadcast fanout: one publish to Redis = N messages delivered (one per subscribed instance).
- Memory per connection: ~2-5KB per WebSocket connection in Reverb's registry.
- Redis network bandwidth: the bottleneck for high-throughput broadcasts.

---

# Common Mistakes

## Mistake: No Sticky Sessions

WebSocket connections are routed to random Reverb instances by the load balancer. Connection authentication works, but subsequent broadcasts fail because the registry is on the wrong instance.

**Better approach:** Configure sticky sessions using `REVERB_SCALING_ENABLED=true` and load balancer session affinity. Validate with WebSocket upgrade traffic.

## Mistake: Shared Redis With Cache

Redis pub/sub backbone shares the same Redis instance as Laravel cache and sessions. Cache eviction operations compete with pub/sub messages. Broadcast latency spikes during cache flush operations.

**Better approach:** Use a dedicated Redis instance (or Redis cluster with dedicated pub/sub node) for the Reverb backbone.

## Mistake: Uneven Connection Distribution

Load balancer distributes WebSocket connections unevenly across instances. One instance has 15,000 connections while others have 5,000. The overloaded instance becomes the bottleneck for all broadcasts.

**Better approach:** Monitor connection distribution. Adjust load balancer weights. Consider connection-limiting per instance.

## Mistake: No Connection Limit

Reverb instances have no upper connection limit. Under connection storms (marketing campaign), instances exceed memory limits. All WebSocket connections on the overloaded instance are disconnected.

**Better approach:** Set `REVERB_MAX_CONNECTIONS` per instance. Design for graceful rejection before overload.
