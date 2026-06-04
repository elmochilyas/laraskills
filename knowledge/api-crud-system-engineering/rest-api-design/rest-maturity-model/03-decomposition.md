# Decomposition: REST Maturity Model

## Topic Overview
The Richardson Maturity Model (RMM) describing four levels of REST compliance from Level 0 (POX/XML-RPC) through Level 3 (HATEOAS), with practical guidance on target maturity selection.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single well-defined model with four levels and clear progression guidance. No further decomposition is needed.

## Proposed Folder Structure
```
rest-maturity-model/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### REST Maturity Model
- **Purpose:** Classify and guide API maturity toward REST compliance
- **Difficulty:** Intermediate
- **Dependencies:** REST Architectural Constraints, HTTP Method Semantics, HATEOAS / Hypermedia Controls

## Dependency Graph
This KU depends on: REST Architectural Constraints, HTTP Method Semantics, HATEOAS / Hypermedia Controls. It serves as prerequisite for REST Purity vs Pragmatic, API Lifecycle Governance.

## Boundary Analysis
**In scope:** Four RMM levels, level characteristics, Laravel patterns for each level, ROI comparison, when to target each level, level progression strategy.
**Out of scope:** Detailed HATEOAS implementation (hateoas-hypermedia-controls KU), HTTP verb mechanics (http-method-semantics KU), status code selection (http-status-code-selection KU).

## Future Expansion Opportunities
None identified — the model is well-defined and stable.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization