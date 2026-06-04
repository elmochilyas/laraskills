# Decomposition: Module extraction path: from module to independent service

## Topic Overview

Module extraction is the process of moving a module from the monolith to a standalone microservice. Extraction is justified when a module's resource requirements (CPU, memory, scaling), team ownership, or deployment cadence diverge significantly from the monolith.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
MMD-11-module-extraction-path/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Module extraction path: from module to independent service
- **Purpose:** Module extraction is the process of moving a module from the monolith to a standalone microservice. Extraction is justified when a module's resource requirements (CPU, memory, scaling), team ownership, or deployment cadence diverge significantly from the monolith.
- **Difficulty:** Advanced
- **Dependencies:** MMD-09 Module dependency mgmt

## Dependency Graph

This KU depends on: MMD-09 Module dependency mgmt
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** **Extraction triggers:** - Resource divergence: Module needs different scaling than the monolith - Team independence: Module team needs independent deployment
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