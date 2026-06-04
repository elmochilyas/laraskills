# Decomposition: Queue Driver Architecture (sync/database/redis/sqs/beanstalkd/null)

## Topic Overview

Laravel ships six queue drivers plus a failover driver, each implementing the same `Illuminate\Contracts\Queue\Queue` contract. The driver choice determines throughput, durability, operational complexity, and ecosystem compatibility (Horizon, Horizon only works with Redis).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k002-queue-driver-architecture/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Queue Driver Architecture (sync/database/redis/sqs/beanstalkd/null)
- **Purpose:** Laravel ships six queue drivers plus a failover driver, each implementing the same `Illuminate\Contracts\Queue\Queue` contract. The driver choice determines throughput, durability, operational complexity, and ecosystem compatibility (Horizon, Horizon only works with Redis).
- **Difficulty:** Foundation
- **Dependencies:** - K001 Queue Connections vs. Queues (topology context)

## Dependency Graph

This KU depends on: - K001 Queue Connections vs. Queues (topology context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **sync**: Executes jobs immediately in the current process. No serialization, no queue storage. Used for testing and local development. - **database**: Stores jobs in a MySQL/PostgreSQL table. Worke...
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