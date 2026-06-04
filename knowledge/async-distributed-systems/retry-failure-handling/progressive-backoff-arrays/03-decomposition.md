# Decomposition: `$backoff` Property with Array for Progressive Delays

## Topic Overview

Laravel's `$backoff` property accepts an array of integers to define per-attempt delay progression: `$backoff = [10, 30, 60, 120, 300]`. Each element corresponds to the delay (in seconds) before retry attempt N.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k019-progressive-backoff-arrays/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### `$backoff` Property with Array for Progressive Delays
- **Purpose:** Laravel's `$backoff` property accepts an array of integers to define per-attempt delay progression: `$backoff = [10, 30, 60, 120, 300]`. Each element corresponds to the delay (in seconds) before retry attempt N.
- **Difficulty:** Advanced
- **Dependencies:** - K016 Failure Taxonomy

## Dependency Graph

This KU depends on: - K016 Failure Taxonomy
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Array indexing**: `$backoff[0]` = seconds before attempt 2 (first retry). `$backoff[n]` = seconds before attempt `n+2`. - **Last-value reuse**: If `$tries > count($backoff) + 1`, the last array el...
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