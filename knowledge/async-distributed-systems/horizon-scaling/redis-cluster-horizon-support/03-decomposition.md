# Decomposition: Redis Cluster Support in Horizon (v5.46+)

## Topic Overview

Horizon v5.46+ added support for Redis Cluster, enabling distributed Redis topologies for high-availability and sharded throughput. Redis Cluster distributes keys across multiple nodes using hash slots, providing automatic failover and horizontal write scaling.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k081-redis-cluster-horizon-support/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Redis Cluster Support in Horizon (v5.46+)
- **Purpose:** Horizon v5.46+ added support for Redis Cluster, enabling distributed Redis topologies for high-availability and sharded throughput. Redis Cluster distributes keys across multiple nodes using hash slots, providing automatic failover and horizontal write scaling.
- **Difficulty:** Expert
- **Dependencies:** - K040 Redis Streams as Queue Backend (alternative to Cluster)

## Dependency Graph

This KU depends on: - K040 Redis Streams as Queue Backend (alternative to Cluster)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Redis Cluster**: Data is sharded across 16384 hash slots, distributed across N nodes. Each key belongs to one slot. - **Hash tags**: `{...}` in key names force slot calculation to use the content ...
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