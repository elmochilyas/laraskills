# Custom Reverb Driver

## Metadata
- **Domain:** Data Engineering & Analytics
- **Subdomain:** 06-real-time-analytics
- **Knowledge Unit:** custom-reverb-driver
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary

Reverb's broadcasting driver architecture allows replacing the default Redis pub/sub backbone with custom transports (NATS, RabbitMQ, SQS, Google Pub/Sub, in-process IPC) by implementing the `Broadcaster` interface. Custom drivers enable Reverb to operate in specialized infrastructure environments, integrate with existing message broker investments, or achieve performance characteristics not possible with Redis.

---

## Core Concepts

- **Broadcaster Interface:** Central contract for custom Reverb driver — defines how messages are published to channels — includes methods for broadcasting to all connections and to specific connection IDs
- **Subscriber Interface:** Handles the reverse path — listening for messages on subscribed channels and forwarding them to correct WebSocket connections — runs in a background loop polling or streaming from the transport
- **Message Envelope:** Standardized message format for all internal communication — custom drivers must serialize/deserialize correctly — includes channel name, event type, payload, and metadata
- **Server Manager Integration:** Orchestrates multiple server instances — custom drivers must implement hooks to register connections, handle scaling events, and coordinate graceful shutdown
- **Driver Lifecycle:** Initialization → Connection Registration → Message Loop → Disconnection Handling → Shutdown — each phase has specific requirements

---

## Mental Models

- **Driver as Postal Service:** Redis is the default postal service — reliable, well-known, works everywhere. A custom driver is like using a private courier — faster for specific routes, integrates with existing logistics, but requires your own sorting facility and delivery trucks.
- **Transport as Language:** Redis speaks one protocol, NATS speaks another, SQS speaks a third. The custom driver is a translator that allows Reverb to communicate in the transport's native language while the application continues to speak Reverb.

---

## Internal Mechanics

A custom driver implements both the Broadcaster interface (publish side) and Subscriber interface (subscribe side). The Broadcaster takes a message (channel name, event, payload) and publishes it to the custom transport (e.g., NATS subject, RabbitMQ exchange, SQS queue). The Subscriber runs as a background process, subscribing to relevant channels on the transport and receiving messages. When a message arrives, the Subscriber forwards it to the correct WebSocket connections by looking up connection IDs in the local connection registry.

---

## Patterns

- **Implement Both Broadcaster and Subscriber:** A custom driver must implement both publish and subscribe sides — implementing only one while relying on Redis for the other is a valid migration strategy but should be temporary
- **Handle Disconnections Gracefully:** The subscriber must detect and handle broker disconnections — implement reconnection with exponential backoff — log disconnection events at WARN level
- **Document the Transport's Scalability Model:** Each transport has different scalability characteristics — NATS uses distributed hash table for subscription routing, RabbitMQ exchanges fan out differently — document how the chosen transport scales under load

---

## Architectural Decisions

Use custom drivers when existing infrastructure investment in RabbitMQ, NATS, or Google Pub/Sub exists, or when Redis pub/sub throughput limits are exceeded. Do not use for standard Reverb deployments where Redis is sufficient. Choose in-process IPC for single-server deployments where latency is critical. Choose NATS for high-throughput requirements (10M+ messages/sec). Choose SQS for cloud-native serverless architectures.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---------|------|-------------|
| Leverage existing broker infrastructure | Driver development and maintenance | Must keep up with Reverb version changes |
| Higher throughput than Redis (NATS: 10M+/s) | Integration complexity | NATS: distributed hash table routing |
| Cloud-native (SQS) | Higher latency (SQS: 100ms+) | SQS: < 10K messages/sec per queue |
| In-process IPC for single server | No cross-process scaling | Fastest possible, limited to one server |

---

## Performance Considerations

NATS: 10M+ messages/sec throughput, sub-millisecond latency. RabbitMQ: 100K+ messages/sec, millisecond latency, rich routing features. SQS: < 10K messages/sec per queue, 100ms+ latency, fully managed. In-process IPC: fastest possible (memory), but no cross-process scaling.

---

## Production Considerations

Test with Reverb's internal test suite to validate custom driver behavior — the test suite covers edge cases like connection storms, mass disconnections, and channel subscription patterns. Incorrect message envelope serialization is the most common bug — other Reverb instances receive malformed messages. Reconnection logic is mandatory — without it, broker restarts cause silent message delivery failures.

---

## Common Mistakes

- **Missing Subscriber Implementation:** Custom Broadcaster implemented but Subscriber side forgotten — messages published to custom transport but never consumed by other Reverb instances. Better: always implement both interfaces, test end-to-end.
- **Incorrect Message Envelope:** Custom driver serializes message envelope incorrectly — other instances receive malformed messages, WebSocket connections fail to decode events. Better: use Reverb's internal format, validate with unit tests.
- **No Reconnection Logic:** Driver doesn't handle broker disconnections — message broker restarts, subscriber never reconnects, WebSocket messages stop silently. Better: implement reconnection with exponential backoff, alert on sustained disconnection.

---

## Failure Modes

- **Synchronous Blocking Operations:** Subscriber loop makes blocking API calls on main thread — other Reverb operations starved, connection registration delayed. Mitigation: use async/non-blocking I/O, offload long-polling to dedicated task group.
- **Transport-Specific Edge Cases:** NATS subscription routing differs from RabbitMQ fanout — messages delivered to wrong instances. Mitigation: test with production-scale load, document transport behavior.
- **Version Compatibility:** Reverb version update changes internal interfaces — custom driver breaks. Mitigation: maintain driver alongside application, test with each Reverb upgrade.

---

## Ecosystem Usage

Custom Reverb drivers are advanced extensions used by teams with specific infrastructure requirements. Most Laravel applications use the default Redis backbone. The `Broadcaster` interface is part of Reverb's internal architecture and is documented in Reverb's source code. Community drivers exist for specific transports but are not officially maintained.

---

## Related Knowledge Units

### Prerequisites
- Reverb WebSocket — Base Reverb architecture and broadcasting system
- Reverb Scaling — How scaling interacts with custom transport backbones

### Related Topics
- Reverb Scaling — Horizontal scaling with different transport backbones
- Queue Dispatching — Message broker patterns shared with queue infrastructure

### Advanced Follow-up Topics
- Kafka CDC — Using Kafka as both CDC transport and Reverb backbone
- Saga Pattern with Kafka — Distributed transaction coordination via message broker

---

## Research Notes

Custom Reverb drivers are an advanced topic relevant to organizations with existing message broker investments or specialized performance requirements. The default Redis backbone handles the vast majority of use cases. The key architectural insight is that both Broadcaster and Subscriber interfaces must be implemented — single-sided implementations are only valid as temporary migration states.
