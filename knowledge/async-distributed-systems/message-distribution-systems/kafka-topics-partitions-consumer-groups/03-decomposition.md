# Decomposition: Kafka Topics, Partitions, Consumer Groups, Offsets

## Topic Overview

Apache Kafka is a distributed event log platform fundamentally different from queue systems. Messages in Kafka are stored durably in **topics** (append-only logs partitioned across brokers).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k038-kafka-topics-partitions-consumer-groups/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Kafka Topics, Partitions, Consumer Groups, Offsets
- **Purpose:** Apache Kafka is a distributed event log platform fundamentally different from queue systems. Messages in Kafka are stored durably in **topics** (append-only logs partitioned across brokers).
- **Difficulty:** Expert
- **Dependencies:** - K036 RabbitMQ Exchange Types (contrast architecture)

## Dependency Graph

This KU depends on: - K036 RabbitMQ Exchange Types (contrast architecture)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Topic**: A category/feed name for messages. Analogous to a table in a database. - **Partition**: A unit of parallelism within a topic. Each partition is an ordered log. Messages within a partition...
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