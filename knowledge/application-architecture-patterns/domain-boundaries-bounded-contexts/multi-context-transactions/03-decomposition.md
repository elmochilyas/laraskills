# Decomposition: Multi-context transactions and saga patterns

## Topic Overview

Multi-context transactions (spanning multiple bounded contexts) cannot use ACID transactions because each context owns its data independently. The solution is the Saga pattern: a sequence of local transactions where each step publishes an event that triggers the next step.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
DBC-11-multi-context-transactions/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Multi-context transactions and saga patterns
- **Purpose:** Multi-context transactions (spanning multiple bounded contexts) cannot use ACID transactions because each context owns its data independently. The solution is the Saga pattern: a sequence of local transactions where each step publishes an event that triggers the next step.
- **Difficulty:** Expert
- **Dependencies:** DBC-07 Cross-context queries

## Dependency Graph

This KU depends on: DBC-07 Cross-context queries
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Saga:** A sequence of local transactions. Each step commits independently. If a step fails, compensating transactions undo the effects of previous steps. **Choreographed Saga:** Each step publishes ...
**Out of scope:** Specific implementation details covered in other KUs, framework-specific internals beyond Laravel, and adjacent architectural patterns covered in related KUs.

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