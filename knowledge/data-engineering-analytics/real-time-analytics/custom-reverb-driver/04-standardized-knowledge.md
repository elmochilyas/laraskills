# Metadata

**Domain:** data-engineering-analytics
**Subdomain:** 06-real-time-analytics
**Knowledge Unit:** custom-reverb-driver
**Difficulty:** Advanced
**Category:** Reverb Broadcasting
**Last Updated:** 2026-06-03

---

# Overview

Reverb's broadcasting driver architecture allows replacing the default Redis pub/sub backbone with custom transports (NATS, RabbitMQ, SQS, Google Pub/Sub, in-process IPC) by implementing the `Broadcaster` interface. Custom drivers enable Reverb to operate in specialized infrastructure environments, integrate with existing message broker investments, or achieve performance characteristics not possible with Redis (e.g., lower latency with NATS, or cloud-native integration with SQS).

Engineers must care because the default Redis backbone is not optimal for every deployment. Organizations already invested in RabbitMQ, NATS, or cloud-native pub/sub services can leverage existing infrastructure. Custom drivers also unlock niche use cases: in-process IPC for single-server deployments, or SQS for serverless WebSocket architectures.

---

# Core Concepts

## Broadcaster Interface

The central contract for a custom Reverb driver. Implementations define how messages are published to channels. The interface includes methods for broadcasting to all connections and to specific connection IDs.

## Subscriber Interface

Handles the reverse path: listening for messages on subscribed channels and forwarding them to the correct WebSocket connections. The subscriber runs in a background loop, polling or streaming messages from the transport.

## Message Envelope

The standardized message format that Reverb uses for all internal communication. Custom drivers must serialize/deserialize this envelope correctly. The envelope includes channel name, event type, payload, and metadata.

## Server Manager Integration

Reverb's server manager orchestrates multiple server instances. Custom drivers must implement the server manager hooks to register connections, handle scaling events, and coordinate graceful shutdown.

## Driver Lifecycle

Custom drivers go through lifecycle phases: initialization, connection registration, message loop, disconnection handling, and shutdown. Each phase has specific requirements for the driver implementation.

---

# When To Use

- Existing infrastructure investment in RabbitMQ, NATS, or Google Pub/Sub
- Cloud-native architectures requiring SQS integration
- Single-server deployments where in-process IPC is faster than Redis loopback
- Performance requirements exceeding Redis pub/sub throughput limits
- Regulatory environments where Redis is not approved

---

# When NOT To Use

- Standard Reverb deployment with Redis scaling — Redis is the default for a reason
- Teams without the expertise to maintain custom message broker infrastructure
- Use cases where Redis pub/sub performance is already sufficient

---

# Best Practices

## Implement Both Broadcaster and Subscriber

A custom driver must implement both the publish and subscribe sides. Implementing only one side while relying on Redis for the other is a valid migration strategy but should be a temporary state.

## Handle Disconnections Gracefully

The subscriber must detect and handle broker disconnections. Implement reconnection with exponential backoff. Log disconnection events at WARN level.

## Test With Reverb Test Suite

Use Reverb's internal test suite to validate custom driver behavior. The test suite covers edge cases like connection storms, mass disconnections, and channel subscription patterns.

## Document the Transport's Scalability Model

Each transport has different scalability characteristics. NATS uses a distributed hash table for subscription routing. RabbitMQ exchanges fan out differently. Document how the chosen transport scales under load.

---

# Performance Considerations

- NATS: 10M+ messages/sec throughput, sub-millisecond latency.
- RabbitMQ: 100K+ messages/sec, millisecond latency, rich routing features.
- SQS: < 10K messages/sec per queue, 100ms+ latency, fully managed.
- In-process IPC: fastest possible (memory), but no cross-process scaling.

---

# Common Mistakes

## Mistake: Missing Subscriber Implementation

A custom Broadcaster is implemented, but the Subscriber side is forgotten. Messages are published to the custom transport but never consumed by other Reverb instances.

**Better approach:** Always implement both interfaces. Test end-to-end message flow before deployment.

## Mistake: Incorrect Message Envelope

The custom driver serializes the message envelope incorrectly. Other Reverb instances receive malformed messages. WebSocket connections fail to decode events.

**Better approach:** Use Reverb's internal message envelope format. Validate serialization/deserialization with unit tests.

## Mistake: No Reconnection Logic

The custom driver doesn't handle broker disconnections. When the message broker restarts, the subscriber never reconnects. WebSocket messages stop being delivered silently.

**Better approach:** Implement reconnection with exponential backoff. Alert on sustained disconnection state.

## Mistake: Synchronous Blocking Operations

The subscriber loop makes blocking API calls (e.g., SQS long-poll) on the main thread. Other Reverb operations are starved. Connection registration and disconnection handling are delayed.

**Better approach:** Use async/non-blocking I/O. Offload long-polling to a dedicated task group.
