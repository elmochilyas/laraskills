---
id: ku-03
title: "Agent Communication Protocols"
subdomain: "agent-architecture-orchestration"
ku-type: "protocol"
date-created: "2026-06-02"
domain-maturity: "emerging"
status: "standardized"
file-path: "research/workspaces/ai-intelligence-systems/agent-architecture-orchestration/ku-03/04-standardized-knowledge.md"
---

# Agent Communication Protocols

## Overview

Agent communication protocols define how autonomous agents exchange structured messages, request actions, report results, and signal state transitions. Unlike human-facing chat (free-text), inter-agent communication must be schema-validated, type-safe, and machine-parseable. This KU covers the message formats, transport mechanisms, and protocol patterns for production agent systems. In the Laravel AI ecosystem, protocols are implemented as serializable DTOs transmitted over queues, events, or direct method calls.

## Core Concepts

- **Agent Message Envelope:** A standardized wrapper containing `message_id`, `source`, `target`, `message_type`, `payload`, `timestamp`, and optional `correlation_id`.
- **Message Types:** `request`, `response`, `error`, `status_update`, `heartbeat`, `handoff`, `cancel`, `escalate`.
- **Correlation ID:** A unique identifier linking related messages across a multi-step workflow. Enables tracing and debugging.
- **Request-Response Pattern:** Agent A sends a `request`, awaits a `response` (sync or async via callback/correlation).
- **Publish-Subscribe Pattern:** Agent broadcasts a message to all subscribed agents (via event bus). Useful for status updates and broadcasts.
- **Handoff Protocol:** A formalized sequence where Agent A transfers a task to Agent B, including context transfer and responsibility ownership.
- **Content Negotiation:** Agents may support multiple payload formats (JSON, Markdown, structured schemas); the envelope declares the format.

## When To Use

- Multi-agent systems where agents are distributed across processes, servers, or queues.
- Systems requiring audit trails of all inter-agent decisions and data flows.
- When agents are developed by different teams and need a stable contract.
- Scenarios requiring graceful degradation: one agent can fail without crashing others.

## When NOT To Use

- Single-process, single-thread agent systems (direct method calls are simpler).
- Tightly coupled agents that are always deployed together and never substituted.
- Prototypes where communication patterns are still evolving (start simple, formalize later).

## Best Practices

- **Schema-validate every message** at the boundary (before dispatching, after receiving). Use a schema registry (JSON Schema, Zod, or PHP attributes).
- **Version all message types** (`research_request.v1`, `research_request.v2`). Never break backward compatibility without a migration.
- **Always include a correlation ID** for tracing; propagate it from the original user request through every agent hop.
- **Implement message timeout handling:** if response isn't received within TTL, the sender retries or escalates.
- **Log all messages** to a structured log store (Elasticsearch, ClickHouse) for debugging and replay.

## Architecture Guidelines

- Define message schemas as **PHP enums or DTOs** with typed properties and serialization methods.
- Use an **event bus** (Laravel Events + broadcasting) for pub-sub patterns; use **queued jobs** for request-response with correlation IDs.
- The envelope should be **small and fixed** (<1KB); all variable data lives in the payload.
- Implement a **dead letter queue** for messages that cannot be delivered after max retries.
- Transport-agnostic design: the same protocol should work over Redis, SQS, Beanstalkd, or in-memory by swapping the transport adapter.

## Performance Considerations

- Message serialization/deserialization overhead at scale: prefer compact serialization formats (MessagePack, or JSON with short keys) for high-throughput paths.
- Each message hop adds queuing latency (typically 10-100ms with Redis/SQS). For time-sensitive handoffs, consider in-process direct delivery.
- Batch small messages into a single envelope when possible to reduce transport overhead.
- Compression for large payloads (>100KB): gzip the payload field, declare `content-encoding` in the envelope.

## Security Considerations

- **Authenticate message sources:** agents must independently verify the sender identity (API tokens, signed payloads, or mutual TLS).
- **Replay attack prevention:** include nonce or timestamp + threshold in every message; reject messages outside the window.
- **Encrypt sensitive payloads** at the application layer (not just transport). Payload encryption should be transparent to the protocol layer.
- **Schema injection:** validate that the message type matches an allowed set; reject unknown types.
- **Rate limit per source agent:** one rogue agent should not flood the message bus.

## Common Mistakes

- Using free-text messages between agents — unparseable, unvalidatable, and unverifiable.
- Not implementing timeouts — a lost message causes the sender to wait forever.
- Tight coupling between message schema and internal data models — schema changes force agent redeployments.
- Overloading the envelope with business data — keep the envelope minimal; business data goes in the payload.
- Forgetting to handle deserialization errors gracefully — malformed messages should be logged and dropped, not crash the agent.

## Anti-Patterns

- **Shared Memory Communication:** Agents reading/writing the same database table directly. Use explicit messages for traceability.
- **Chat as Protocol:** Using the LLM's natural language for inter-agent coordination. Always use structured schemas.
- **Message Sprawl:** Every agent defines its own message types with no central schema registry. Creates integration hell.
- **Synchronous Chains:** Agent A → B → C with synchronous blocking calls. Use async messaging with correlation IDs.

## Examples

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

## Related Topics

- ku-02 (Multi-Agent Systems): Where these protocols are used.
- ku-04 (Agent Planning & Reasoning): Plans are communicated via these protocols.
- ku-07 (Orchestration Frameworks): Frameworks implement these protocols.
- ai-middleware-gateway/ku-03: Message routing and transformation at the gateway layer.
- streaming-real-time-ai/ku-02: Real-time message streaming between agents.

## AI Agent Notes

- When asked to implement inter-agent communication, always produce the message schema first, then the transport layer.
- For debugging, request the full message trace (all envelopes with correlation ID). This reveals exactly where the breakdown occurred.
- Prefer reading the schema registry files before agent implementations when analyzing a multi-agent system.
- The message envelope is the single most important artifact for observability — never skip it.

## Verification

- [ ] All inter-agent messages use a standardized envelope with message_id, source, target, type, and correlation_id.
- [ ] Message schemas are versioned (e.g., `research.request.v1`) and validated at runtime.
- [ ] Every message has a TTL; the sender handles timeout (retry, escalate, or fail).
- [ ] Source authentication: agents verify sender identity before processing messages.
- [ ] Dead letter queue is configured for undeliverable messages.
- [ ] Payloads containing sensitive data are encrypted at the application layer.
- [ ] Protocol is transport-agnostic: same messages work over queue, event bus, or in-memory.
