# Decomposition: `failed_jobs` Table and DynamoDB Storage

## Topic Overview

Failed jobs are persisted for inspection and retry in either the `failed_jobs` database table or an Amazon DynamoDB table. The database implementation is the default — a simple table with columns for ID, UUID, connection, queue, payload, exception, and timestamps.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k020-failed-jobs-storage/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `failed_jobs` Table and DynamoDB Storage
- **Purpose:** Failed jobs are persisted for inspection and retry in either the `failed_jobs` database table or an Amazon DynamoDB table. The database implementation is the default — a simple table with columns for ID, UUID, connection, queue, payload, exception, and timestamps.
- **Difficulty:** Intermediate
- **Dependencies:** - K021 `failed()` Method on Jobs

## Dependency Graph

This KU depends on: - K021 `failed()` Method on Jobs
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Database storage**: Default `failed_jobs` table with columns: `id`, `uuid`, `connection`, `queue`, `payload` (TEXT), `exception` (TEXT), `failed_at` (timestamp). - **DynamoDB storage**: Configurab...
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