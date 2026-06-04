# Decomposition: Transaction management: where transactions belong

## Topic Overview

Transaction management answers: who calls `DB::transaction()`? The consensus: the Service layer owns transactions. Services coordinate multiple operations that must be atomic.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
SLP-11-transaction-management/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Transaction management: where transactions belong
- **Purpose:** Transaction management answers: who calls `DB::transaction()`? The consensus: the Service layer owns transactions. Services coordinate multiple operations that must be atomic.
- **Difficulty:** Advanced
- **Dependencies:** SLP-01 Service classes

## Dependency Graph

This KU depends on: SLP-01 Service classes
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Transaction ownership by layer:** - **Controller: Never** — Controllers handle HTTP, not data consistency - **Service: Yes** — Services orchestrate operations that must be atomic
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