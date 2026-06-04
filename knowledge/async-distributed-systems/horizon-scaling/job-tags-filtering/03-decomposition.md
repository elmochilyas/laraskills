# Decomposition: Job Tags for Filtering and Monitoring

## Topic Overview

Horizon displays job tags in the dashboard for filtering and monitoring. Tags are short strings (typically model identifiers) returned by the job's `tags()` method.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k045-job-tags-filtering/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Job Tags for Filtering and Monitoring
- **Purpose:** Horizon displays job tags in the dashboard for filtering and monitoring. Tags are short strings (typically model identifiers) returned by the job's `tags()` method.
- **Difficulty:** Intermediate
- **Dependencies:** - K046 Silenced Jobs and Silenced Tags

## Dependency Graph

This KU depends on: - K046 Silenced Jobs and Silenced Tags
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`tags()` method**: Return an array of strings from the job class. Horizon displays these in the dashboard. - **Automatic tags**: Jobs using `SerializesModels` automatically get tags like `App\Mode...
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