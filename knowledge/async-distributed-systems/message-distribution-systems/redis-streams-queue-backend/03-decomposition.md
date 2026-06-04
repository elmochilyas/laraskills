# Decomposition: Redis Streams as Queue Backend

## Topic Overview

Redis Streams (introduced in Redis 5.0) provide an append-only log data structure with consumer groups, message acknowledgment, and per-message persistence — features absent from Redis Lists (the default Laravel queue backend). Unlike `LPUSH`/`BRPOP` (Lists), Streams support multiple consumers consuming the same stream independently (like Kafka consumer groups), message acknowledgment to prevent loss, and the ability to replay unacknowledged messages.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k040-redis-streams-queue-backend/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Redis Streams as Queue Backend
- **Purpose:** Redis Streams (introduced in Redis 5.0) provide an append-only log data structure with consumer groups, message acknowledgment, and per-message persistence — features absent from Redis Lists (the default Laravel queue backend). Unlike `LPUSH`/`BRPOP` (Lists), Streams support multiple consumers consuming the same stream independently (like Kafka consumer groups), message acknowledgment to prevent loss, and the ability to replay unacknowledged messages.
- **Difficulty:** Advanced
- **Dependencies:** - K002 Queue Driver Architecture (Redis driver comparison)

## Dependency Graph

This KU depends on: - K002 Queue Driver Architecture (Redis driver comparison)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Stream**: An append-only log of entries. Each entry has a unique ID (timestamp-sequence, e.g., `1516023428173-0`). - **Consumer group**: A group of consumers that coordinate to consume a stream. E...
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