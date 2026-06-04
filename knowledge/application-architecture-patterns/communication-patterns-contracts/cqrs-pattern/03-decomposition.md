# Decomposition: CQRS pattern

## Topic Overview

Command Query Responsibility Segregation (CQRS) separates read operations from write operations into different models. Writes go through Commands (mutations).

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
CPC-08-cqrs-pattern/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### CQRS pattern
- **Purpose:** Command Query Responsibility Segregation (CQRS) separates read operations from write operations into different models. Writes go through Commands (mutations).
- **Difficulty:** Expert
- **Dependencies:** CPC-02 Domain events basics

## Dependency Graph

This KU depends on: CPC-02 Domain events basics
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Command:** A mutation that changes state. Named in imperative mood (`PlaceOrder`, `CancelInvoice`). Returns no data (or only success/failure). Validates business rules. Dispatched to a command handl...
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