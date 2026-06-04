# Decomposition: Failed Job Events (`Queue::failing`)

## Topic Overview

The `Queue::failing` event fires whenever a job permanently fails, before the job is stored in `failed_jobs`. This event is the primary hook for global failure monitoring, alerting, and logging that applies across all job types.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k022-failed-job-events/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Failed Job Events (`Queue::failing`)
- **Purpose:** The `Queue::failing` event fires whenever a job permanently fails, before the job is stored in `failed_jobs`. This event is the primary hook for global failure monitoring, alerting, and logging that applies across all job types.
- **Difficulty:** Foundation
- **Dependencies:** - K020 `failed_jobs` Table (storage context)

## Dependency Graph

This KU depends on: - K020 `failed_jobs` Table (storage context)
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`Queue::failing`**: Dispatched via `$this->raiseFailedJobEvent()` in the Worker. Receives the job instance and exception. - **Event payload**: `Illuminate\Queue\Events\JobFailed` — contains `$co...
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