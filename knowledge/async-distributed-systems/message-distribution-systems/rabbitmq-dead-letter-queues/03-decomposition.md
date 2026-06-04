# Decomposition: RabbitMQ Dead-Letter Queues, Per-Message Ack

## Topic Overview

RabbitMQ provides native dead-letter queue (DLQ) support through exchange-level configuration. When a message is negatively acknowledged (`basic.nack`), rejected (`basic.reject`), or expires (`TTL`), the broker can route it to a configured dead-letter exchange, which routes it to a dead-letter queue.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k037-rabbitmq-dead-letter-queues/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### RabbitMQ Dead-Letter Queues, Per-Message Ack
- **Purpose:** RabbitMQ provides native dead-letter queue (DLQ) support through exchange-level configuration. When a message is negatively acknowledged (`basic.nack`), rejected (`basic.reject`), or expires (`TTL`), the broker can route it to a configured dead-letter exchange, which routes it to a dead-letter queue.
- **Difficulty:** Expert
- **Dependencies:** - K036 RabbitMQ Exchange Types (routing basis for DLX)

## Dependency Graph

This KU depends on: - K036 RabbitMQ Exchange Types (routing basis for DLX)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Dead-letter exchange (DLX)**: An exchange configured on a queue. Messages that are rejected, nack'ed, or expired are routed here. - **Dead-letter queue (DLQ)**: A queue bound to the DLX. Stores fa...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent queue/event patterns covered in related KUs.

## Future Expansion Opportunities

None identified � the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization