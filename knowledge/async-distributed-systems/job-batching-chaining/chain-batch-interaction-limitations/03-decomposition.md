# Decomposition: Chain-Batch Interaction Limitations

## Topic Overview

The interaction between chains and batches has several undocumented limitations. Chains inside batches (batch-of-chains) have the `finally()` never-firing bug when mid-chain failure occurs.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k089-chain-batch-interaction-limitations/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Chain-Batch Interaction Limitations
- **Purpose:** The interaction between chains and batches has several undocumented limitations. Chains inside batches (batch-of-chains) have the `finally()` never-firing bug when mid-chain failure occurs.
- **Difficulty:** Expert
- **Dependencies:** - K012 `allowFailures()` Behavior

## Dependency Graph

This KU depends on: - K012 `allowFailures()` Behavior
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **Batch-of-chains**: `Bus::batch([[$a1, $a2], [$b1, $b2]])` — parallel chains under batch tracking. - **Chain-of-batches**: `Bus::chain([Bus::batch([$a, $b]), Job2])` — ordered pipeline with par...
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