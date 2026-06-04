# Knowledge Unit: Agent Communication Protocols

## Metadata

- **ID:** ku-03
- **Subdomain:** Agentic Workflows
- **Slug:** agent-communication-protocols
- **Version:** 1.0.0
- **Maturity:** Stable
- **Status:** Published

## Executive Summary

Agent communication protocols define how autonomous agents exchange structured messages, request actions, report results, and signal state transitions. Unlike human-facing chat (free-text), inter-agent communication must be schema-validated, type-safe, and machine-parseable. This KU covers the message formats, transport mechanisms, and protocol patterns for production agent systems. In the Laravel AI ecosystem, protocols are implemented as serializable DTOs transmitted over queues, events, or direct method calls.

## Core Concepts

- **Agent Message Envelope:** A standardized wrapper containing `message_id`, `source`, `target`, `message_type`, `payload`, `timestamp`, and optional `correlation_id`.
- **Message Types:** `request`, `response`, `error`, `status_update`, `heartbeat`, `handoff`, `cancel`, `escalate`.
- **Correlation ID:** A unique identifier linking related messages across a multi-step workflow. Enables tracing and debugging.
- **Request-Response Pattern:** Agent A sends a `request`, awaits a `response` (sync or async via callback/correlation).
- **Publish-Subscribe Pattern:** Agent broadcasts a message to all subscribed agents (via event bus). Useful for status updates and broadcasts.
- **Handoff Protocol:** A formalized sequence where Agent A transfers a task to Agent B, including context transfer and responsibility ownership.
- **Content Negotiation:** Agents may support multiple payload formats (JSON, Markdown, structured schemas); the envelope declares the format.

## Mental Models

- **Agent Message Envelope:** A standardized wrapper containing `message_id`, `source`, `target`, `message_type`, `payload`, `timestamp`, and optional `correlation_id`.
- **Message Types:** `request`, `response`, `error`, `status_update`, `heartbeat`, `handoff`, `cancel`, `escalate`.
- **Correlation ID:** A unique identifier linking related messages across a multi-step workflow. Enables tracing and debugging.


## Internal Mechanics

The internal mechanics of Agent Communication Protocols follow established patterns within the Agentic Workflows domain. The implementation leverages the Laravel AI SDK conventions and ecosystem best practices.

- **Schema-validate every message** at the boundary (before dispatching, after receiving). Use a schema registry (JSON Schema, Zod, or PHP attributes).
- **Version all message types** (`research_request.v1`, `research_request.v2`). Never break backward compatibility without a migration.
- **Always include a correlation ID** for tracing; propagate it from the original user request through every agent hop.
- **Implement message timeout handling:** if response isn't received within TTL, the sender retries or escalates.
- **Log all messages** to a structured log store (Elasticsearch, ClickHouse) for debugging and replay.

## Patterns

- **Schema-validate every message** at the boundary (before dispatching, after receiving). Use a schema registry (JSON Schema, Zod, or PHP attributes).
- **Version all message types** (`research_request.v1`, `research_request.v2`). Never break backward compatibility without a migration.
- **Always include a correlation ID** for tracing; propagate it from the original user request through every agent hop.
- **Implement message timeout handling:** if response isn't received within TTL, the sender retries or escalates.
- **Log all messages** to a structured log store (Elasticsearch, ClickHouse) for debugging and replay.

## Architectural Decisions

- Define message schemas as **PHP enums or DTOs** with typed properties and serialization methods.
- Use an **event bus** (Laravel Events + broadcasting) for pub-sub patterns; use **queued jobs** for request-response with correlation IDs.
- The envelope should be **small and fixed** (<1KB); all variable data lives in the payload.
- Implement a **dead letter queue** for messages that cannot be delivered after max retries.
- Transport-agnostic design: the same protocol should work over Redis, SQS, Beanstalkd, or in-memory by swapping the transport adapter.

## Tradeoffs

Standard approach vs Custom implementation is the primary tradeoff in this KU. Standard implementations offer faster development and community support but may have overhead. Custom implementations provide tailored solutions at the cost of maintenance burden.

## Performance Considerations

- Message serialization/deserialization overhead at scale: prefer compact serialization formats (MessagePack, or JSON with short keys) for high-throughput paths.
- Each message hop adds queuing latency (typically 10-100ms with Redis/SQS). For time-sensitive handoffs, consider in-process direct delivery.
- Batch small messages into a single envelope when possible to reduce transport overhead.
- Compression for large payloads (>100KB): gzip the payload field, declare `content-encoding` in the envelope.

## Production Considerations

- **Authenticate message sources:** agents must independently verify the sender identity (API tokens, signed payloads, or mutual TLS).
- **Replay attack prevention:** include nonce or timestamp + threshold in every message; reject messages outside the window.
- **Encrypt sensitive payloads** at the application layer (not just transport). Payload encryption should be transparent to the protocol layer.
- **Schema injection:** validate that the message type matches an allowed set; reject unknown types.
- **Rate limit per source agent:** one rogue agent should not flood the message bus.

## Common Mistakes

- Using free-text messages between agents â€” unparseable, unvalidatable, and unverifiable.
- Not implementing timeouts â€” a lost message causes the sender to wait forever.
- Tight coupling between message schema and internal data models â€” schema changes force agent redeployments.
- Overloading the envelope with business data â€” keep the envelope minimal; business data goes in the payload.
- Forgetting to handle deserialization errors gracefully â€” malformed messages should be logged and dropped, not crash the agent.

## Failure Modes

- **Shared Memory Communication:** Agents reading/writing the same database table directly. Use explicit messages for traceability.
- **Chat as Protocol:** Using the LLM's natural language for inter-agent coordination. Always use structured schemas.
- **Message Sprawl:** Every agent defines its own message types with no central schema registry. Creates integration hell.
- **Synchronous Chains:** Agent A â†’ B â†’ C with synchronous blocking calls. Use async messaging with correlation IDs.

## Ecosystem Usage

### Message Envelope Schema
```json
{
  "message_id": "uuid",
  "source": "agent.researcher.v2",
  "target": "agent.writer.v1",
  "message_type": "research.result",
  "payload_schema": "research.result.v1",
  "payload": { ... },
  "correlation_id": "user-session-uuid",
  "timestamp": "2026-06-02T12:00:00Z",
  "ttl_seconds": 30,
  "signature": "hmac-sha256( ... )"
}
```

### PHP DTO for Agent Message
```php
class AgentMessage {
    public function __construct(
        public readonly string $messageId,
        public readonly string $source,
        public readonly string $target,
        public readonly MessageType $type,
        public readonly array $payload,
        public readonly string $correlationId,
        public readonly int $ttlSeconds = 30,
    ) {}
}
```

## Related Knowledge Units

- ku-02 (Multi-Agent Systems): Where these protocols are used.
- ku-04 (Agent Planning & Reasoning): Plans are communicated via these protocols.
- ku-07 (Orchestration Frameworks): Frameworks implement these protocols.
- ai-middleware-gateway/ku-03: Message routing and transformation at the gateway layer.
- streaming-real-time-ai/ku-02: Real-time message streaming between agents.

## Research Notes

Source: Domain analysis for AI and Intelligence Systems (Laravel/PHP ecosystem)
Source: Laravel AI SDK documentation and ecosystem package references

