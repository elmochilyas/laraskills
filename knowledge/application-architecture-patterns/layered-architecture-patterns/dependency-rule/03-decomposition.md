# Decomposition: The Dependency Rule: inward-pointing dependencies

## Topic Overview

The Dependency Rule is the fundamental constraint of layered architectures: source code dependencies can only point inward toward the domain core. Outer layers (Presentation, Infrastructure) can depend on inner layers (Application, Domain), but inner layers must never depend on outer layers.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
LAP-04-dependency-rule/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### The Dependency Rule: inward-pointing dependencies
- **Purpose:** The Dependency Rule is the fundamental constraint of layered architectures: source code dependencies can only point inward toward the domain core. Outer layers (Presentation, Infrastructure) can depend on inner layers (Application, Domain), but inner layers must never depend on outer layers.
- **Difficulty:** Advanced
- **Dependencies:** LAP-02 Clean Architecture

## Dependency Graph

This KU depends on: LAP-02 Clean Architecture
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** The Dependency Rule across layers: - **Presentation layer** can depend on: Application, Domain - **Infrastructure layer** can depend on: Application, Domain
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