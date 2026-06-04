# Decomposition: File placement decision trees and team conventions

## Topic Overview

File placement decision trees codify the rules for where new code belongs. They eliminate the most common source of architectural inconsistency: developer uncertainty about where to put a new file.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-12-file-placement-decision-trees/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### File placement decision trees and team conventions
- **Purpose:** File placement decision trees codify the rules for where new code belongs. They eliminate the most common source of architectural inconsistency: developer uncertainty about where to put a new file.
- **Difficulty:** Advanced
- **Dependencies:** COS-04 Namespace conventions

## Dependency Graph

This KU depends on: COS-04 Namespace conventions
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** Every new file prompts three placement questions: 1. **Which domain?** (Billing, Catalog, Identity, Auth, Shared) 2. **Which layer/role?** (Controller, Service, Action, Model, Event, Job, DTO, Request...
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