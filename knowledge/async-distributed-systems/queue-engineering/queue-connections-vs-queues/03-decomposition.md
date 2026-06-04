# Decomposition: Queue Connections vs. Queues Distinction

## Topic Overview

The connection-vs-queue distinction is the most misunderstood concept in Laravel queue configuration. A connection is a backend driver instance (Redis, SQS, database) — it defines where and how jobs are stored.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k001-queue-connections-vs-queues/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Queue Connections vs. Queues Distinction
- **Purpose:** The connection-vs-queue distinction is the most misunderstood concept in Laravel queue configuration. A connection is a backend driver instance (Redis, SQS, database) — it defines where and how jobs are stored.
- **Difficulty:** Foundation
- **Dependencies:** - K002 Queue Driver Architecture (technical foundation)

## Dependency Graph

This KU depends on: - K002 Queue Driver Architecture (technical foundation)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Connection**: A configured backend service. Each connection has a driver type (redis, sqs, database), credentials, and driver-specific options. Defined in `config/queue.php` under `connections`. -...
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