# Decomposition: Agent Communication Protocols

## Topic Overview

Agent communication protocols define how autonomous agents exchange structured messages, request actions, report results, and signal state transitions. Unlike human-facing chat (free-text), inter-agent communication must be schema-validated, type-safe, and machine-parseable. This KU covers the message formats, transport mechanisms, and protocol patterns for production agent systems. In the Laravel AI ecosystem, protocols are implemented as serializable DTOs transmitted over queues, events, or direct method calls.

## Decomposition Strategy

This Knowledge Unit is atomic. It covers a single well-bounded concept with independent decisions, tradeoffs, and architecture guidance.

## Proposed Folder Structure
```
ku-03/
  02-knowledge-unit.md
  03-decomposition.md
  04-standardized-knowledge.md
```

## Knowledge Unit Inventory

### Agent Communication Protocols
- **Purpose:** Agent communication protocols define how autonomous agents exchange structured messages, request actions, report results, and signal state transitions. Unlike human-facing chat (free-text), inter-agent communication must be schema-validated, type-safe, and machine-parseable. This KU covers the message formats, transport mechanisms, and protocol patterns for production agent systems. In the Laravel AI ecosystem, protocols are implemented as serializable DTOs transmitted over queues, events, or direct method calls.
- **Difficulty:** Intermediate
- **Dependencies:** ku-02, ku-04, ku-07, ku-03, ku-02

## Dependency Graph
**Depends on:**
- ku-02
- ku-04
- ku-07
- ku-03
- ku-02

**Depended by:**
- This KU serves as prerequisite for advanced patterns in the same subdomain

## Boundary Analysis
**In scope:**
- **Agent Message Envelope:** A standardized wrapper containing `message_id`, `source`, `target`, `message_type`, `payload`, `timestamp`, and optional `correlation_id`.
- **Message Types:** `request`, `response`, `error`, `status_update`, `heartbeat`, `handoff`, `cancel`, `escalate`.
- **Correlation ID:** A unique identifier linking related messages across a multi-step workflow. Enables tracing and debugging.
- **Request-Response Pattern:** Agent A sends a `request`, awaits a `response` (sync or async via callback/correlation).
- **Publish-Subscribe Pattern:** Agent broadcasts a message to all subscribed agents (via event bus). Useful for status updates and broadcasts.
- **Handoff Protocol:** A formalized sequence where Agent A transfers a task to Agent B, including context transfer and responsibility ownership.
- **Content Negotiation:** Agents may support multiple payload formats (JSON, Markdown, structured schemas); the envelope declares the format.

**Out of scope:**
- ku-02 topics covered in their respective KUs
- ku-04 topics covered in their respective KUs
- ku-07 topics covered in their respective KUs
- ku-03 topics covered in their respective KUs
- ku-02 topics covered in their respective KUs

## Future Expansion Opportunities
The topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

- No Knowledge Unit is overloaded
- No major concept is missing
- Boundaries are clear
- Future phases can operate on individual units
- The structure can scale without reorganization

