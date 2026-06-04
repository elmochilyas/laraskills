# Metadata

**Domain:** ai-intelligence-systems
**Subdomain:** agentic-workflows
**Knowledge Unit:** ku-03
**Generated:** 2026-06-03
**Based on:** 04-standardized-knowledge.md, 05-rules.md, 06-skills.md, 07-decision-trees.md, 08-anti-patterns.md

---

# Quick Checklist

- [ ] Always include a correlation ID
- [ ] Implement message timeout handling:
- [ ] Log all messages
- [ ] Schema-validate every message
- [ ] Version all message types
- [ ] All inter-agent messages use a standardized envelope with message_id, source, target, type, and correlation_id.
- [ ] Dead letter queue is configured for undeliverable messages.
- [ ] Every message has a TTL; the sender handles timeout (retry, escalate, or fail).
- [ ] Always Include Correlation IDs for Tracing
- [ ] Authenticate Message Sources
- [ ] Implement Dead Letter Queue for Undeliverable Messages
- [ ] Implement Message Timeout Handling
- [ ] Use Standardized Message Envelopes

---

# Architecture Checklist

- [ ] Basic input sanitization is sufficient
- [ ] Bind to specific provider at the class or config level
- [ ] Configure long timeouts, disable proxy buffering, implement keep-alive
- [ ] Configure provider selection via environment variables
- [ ] Default timeout configuration is sufficient
- [ ] Direct request/response without caching layer
- [ ] Fixed capacity with appropriate headroom
- [ ] Implement audit logging, data residency controls, and pseudonymization
- [ ] Implement auto-scaling and queue-based processing for peak loads
- [ ] Implement defense layers: input validation, output guarding, and content filtering

---

# Implementation Checklist

- [ ] Always include a correlation ID
- [ ] Implement message timeout handling:
- [ ] Log all messages
- [ ] Schema-validate every message
- [ ] Version all message types
- [ ] Always Include Correlation IDs for Tracing
- [ ] Authenticate Message Sources
- [ ] Implement Dead Letter Queue for Undeliverable Messages
- [ ] Implement Message Timeout Handling
- [ ] Use Standardized Message Envelopes
- [ ] Version All Message Schemas

---

# Performance Checklist

- [ ] Batch small messages into a single envelope when possible to reduce transport overhead.
- [ ] Compression for large payloads (>100KB): gzip the payload field, declare `content-encoding` in the envelope.
- [ ] Each message hop adds queuing latency (typically 10-100ms with Redis/SQS). For time-sensitive handoffs, consider in-process direct delivery.
- [ ] Message serialization/deserialization overhead at scale: prefer compact serialization formats (MessagePack, or JSON with short keys) for high-throughput paths.

---

# Security Checklist

- [ ] Authenticate message sources:
- [ ] Encrypt sensitive payloads
- [ ] Rate limit per source agent:
- [ ] Replay attack prevention:
- [ ] Schema injection:

---

# Reliability Checklist

- [ ] Forgetting to handle deserialization errors gracefully â€” malformed messages should be logged and dropped, not crash the agent.
- [ ] Not implementing timeouts â€” a lost message causes the sender to wait forever.
- [ ] Overloading the envelope with business data â€” keep the envelope minimal; business data goes in the payload.
- [ ] Tight coupling between message schema and internal data models â€” schema changes force agent redeployments.
- [ ] Using free-text messages between agents â€” unparseable, unvalidatable, and unverifiable.
- [ ] Always Include Correlation IDs for Tracing
- [ ] Implement Message Timeout Handling

---

# Testing Checklist

- [ ] All inter-agent messages use a standardized envelope with message_id, source, target, type, and correlation_id.
- [ ] Dead letter queue is configured for undeliverable messages.
- [ ] Every message has a TTL; the sender handles timeout (retry, escalate, or fail).
- [ ] Message schemas are versioned (e.g., `research.request.v1`) and validated at runtime.
- [ ] Payloads containing sensitive data are encrypted at the application layer.
- [ ] Protocol is transport-agnostic: same messages work over queue, event bus, or in-memory.
- [ ] Source authentication: agents verify sender identity before processing messages.

---

# Maintainability Checklist

- [ ] Code follows domain conventions
- [ ] Documentation is up to date

---

# Anti-Pattern Prevention Checklist

- [ ] [Full Conversation History Sent Every Request â€” Context Window Overflow]
- [ ] [No Sliding Window or Summarization for Long Histories]
- [ ] [Storing State in Global/Session Instead of Agent Context]
- [ ] [Not Pruning Tool Results from Context]
- [ ] [Loading All Conversation History Synchronously]
- [ ] Chat as Protocol:
- [ ] Message Sprawl:
- [ ] Shared Memory Communication:
- [ ] Synchronous Chains:

---

# Production Readiness Checklist

- [ ] Monitoring and alerting configured
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy defined

---

# Final Approval Checklist

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge: ./04-standardized-knowledge.md
# Related Rules: ./05-rules.md
# Related Skills: ./06-skills.md
# Related Decision Trees: ./07-decision-trees.md
# Related Anti-Patterns: ./08-anti-patterns.md


