# Skills

## Skill 1: Implement agent communication protocols with standardized message envelopes

### Purpose
Create type-safe, schema-validated inter-agent communication using standardized message envelopes with message_id, source, target, message_type, payload, correlation_id, and timestamp, supporting request-response, publish-subscribe, and handoff patterns.

### When To Use
- Use when multiple agents need to exchange structured messages
- Use when you need traceability across multi-step agent workflows
- Use when implementing request-response or publish-subscribe patterns between agents
- Use when agent handoffs require context transfer and responsibility tracking

### When NOT To Use
- Do NOT use for single-agent applications with no inter-agent communication
- Do NOT use without defining message types and envelope structure first
- Do NOT use when agents can communicate via shared state (simpler but less traceable)

### Prerequisites
- Serializable DTOs for message envelope and payloads
- Message transport mechanism (queue, event bus, or direct method calls)
- Understanding of correlation IDs for tracing multi-step workflows
- Schema validation for message payloads

### Inputs
- Agent message content (payload)
- Source and target agent identifiers
- Message type classification (request, response, error, status_update, handoff)
- Correlation ID for workflow tracing

### Workflow
1. Define the standardized message envelope DTO:
   ```php
   class AgentMessage {
       public string $messageId,
       public string $source,
       public string $target,
       public MessageType $messageType,
       public array $payload,
       public string $correlationId,
       public Timestamp $timestamp,
   }
   ```
2. Never send raw payloads without envelope metadata
3. Define message types: request, response, error, status_update, heartbeat, handoff, cancel, escalate
4. Implement request-response pattern: Agent A sends request, awaits response via callback/correlation
5. Implement publish-subscribe pattern: agent broadcasts to all subscribers via event bus
6. Implement handoff protocol: formalized context transfer with responsibility ownership
7. Use correlation IDs to link related messages across multi-step workflows
8. Validate message payloads against schemas before sending
9. Set up logging and tracing for all inter-agent messages

### Validation Checklist
- [ ] Every message uses standardized envelope with all required fields
- [ ] Message types are defined and validated (request, response, error, etc.)
- [ ] Correlation IDs trace messages across multi-step workflows
- [ ] Request-response pattern works with timeouts and error handling
- [ ] Publish-subscribe pattern delivers to all subscribers
- [ ] Handoff protocol transfers context and ownership correctly
- [ ] Payloads are schema-validated before transmission
- [ ] Logging captures all inter-agent messages for audit
- [ ] Error messages propagate correctly with source agent info

### Common Failures
- **Raw payloads**: Messages sent without envelope — no routing or tracing metadata
- **Missing correlation ID**: Multi-step workflow messages not linked — can't trace the full flow
- **Schema mismatch**: Agent A sends format Agent B can't parse — use shared schema validation
- **No timeout**: Request-response pattern hangs if response never comes — set timeouts
- **Handoff without context**: Handoff transfers responsibility but not context — agent B starts blind

### Decision Points
- **Transport mechanism**: Queue (async, durable) vs. event bus (pub/sub, broadcast) vs. direct (sync, fast)
- **Payload format**: JSON (standard) vs. serialized PHP objects (type-safe but fragile)
- **Correlation strategy**: UUID per workflow (standard) vs. hierarchical IDs (nested workflows)
- **Timeout handling**: Fixed timeout vs. adaptive based on task complexity

### Performance Considerations
- Message envelope overhead is minimal (<100 bytes per message)
- Serialization/deserialization adds <1ms per message
- Queue-based transport adds latency (1-50ms) vs. direct method calls (<1ms)
- Correlation ID lookups in logs can be indexed for fast querying
- Payload validation adds latency proportional to payload size

### Security Considerations
- Validate source agent identity before processing messages
- Encrypt message payloads for sensitive data in transit
- Don't include secrets or credentials in message payloads
- Rate limit message sending per agent to prevent flooding
- Audit log all inter-agent messages for security monitoring

### Related Rules
- R1: Use Standardized Message Envelopes — never send raw payloads without envelope metadata

### Related Skills
- Design multi-agent systems with strict tool boundaries
- Implement agent planning and reasoning strategies
- Build agent orchestration frameworks with async execution
- Implement agent memory and state persistence

### Success Criteria
- All inter-agent messages use standardized envelopes with complete metadata
- Correlation IDs enable full traceability across multi-step workflows
- Request-response patterns complete with reliable timeout handling
- Publish-subscribe patterns deliver messages to all intended subscribers
- Handoff protocols transfer context and ownership correctly
- Message payloads are validated against schemas before transmission
