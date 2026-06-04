# Decomposition: Simple Balancing and No Balancing Modes

## Topic Overview

Beyond `auto` balancing, Horizon offers `simple` and `false` balancing modes. **`simple`** distributes workers evenly across all configured queues (round-robin).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
k043-simple-and-no-balancing-modes/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Simple Balancing and No Balancing Modes
- **Purpose:** Beyond `auto` balancing, Horizon offers `simple` and `false` balancing modes. **`simple`** distributes workers evenly across all configured queues (round-robin).
- **Difficulty:** Intermediate
- **Dependencies:** - K041 Horizon Supervisor Configuration

## Dependency Graph

This KU depends on: - K041 Horizon Supervisor Configuration
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - **`simple` balancing**: Workers are evenly distributed among queues. If a supervisor has `minProcesses=4` and 2 queues, each queue gets 2 workers. - **`false` balancing**: No dynamic scaling. The `p...
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