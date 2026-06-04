# Decomposition: Retry Workflow (`queue:retry`, Horizon Retry Button)

## Topic Overview

Failed jobs can be retried via `queue:retry` (individual or batch retry), `queue:retry-batch` (retry all failed jobs in a batch), or the Horizon dashboard retry button. These mechanisms re-dispatch the job from the stored `failed_jobs` record — the original payload is extracted, a new job instance is unserialized, and dispatched to the original connection and queue.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k024-retry-workflow/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Retry Workflow (`queue:retry`, Horizon Retry Button)
- **Purpose:** Failed jobs can be retried via `queue:retry` (individual or batch retry), `queue:retry-batch` (retry all failed jobs in a batch), or the Horizon dashboard retry button. These mechanisms re-dispatch the job from the stored `failed_jobs` record — the original payload is extracted, a new job instance is unserialized, and dispatched to the original connection and queue.
- **Difficulty:** Foundation
- **Dependencies:** - K016 Failure Taxonomy (where retry fits in state machine)

## Dependency Graph

This KU depends on: - K016 Failure Taxonomy (where retry fits in state machine)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`queue:retry {id}`**: Retries a specific failed job by UUID or `all` for all failed jobs. - **`queue:retry-batch {batchId}`**: Retries all failed jobs within a specific batch. - **Horizon retry**:...
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