# Decomposition: Action Naming Conventions

## Topic Overview
Naming conventions for action classes — the four competing conventions (VerbNoun, NounVerb, ActionSuffix, Descriptive Method) with tradeoffs for navigation, discoverability, and cognitive load.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
action-naming-conventions/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Action Naming Conventions
- **Purpose:** Naming conventions for action classes — VerbNoun vs NounVerb vs ActionSuffix vs Descriptive Method patterns.
- **Difficulty:** Foundation
- **Dependencies:** Action Class Design

## Dependency Graph
This KU depends on: Action Class Design. It serves as prerequisite for action-vs-service-vs-usecase.

## Boundary Analysis
**In scope:** The four naming conventions, VerbNoun vs NounVerb comparison, ActionSuffix decision, descriptive method names (Jetstream convention), domain subdirectory pattern, naming consistency enforcement.

**Out of scope:** Action class structure (action-class-design KU), directory organization (controller-organization KU), file naming for non-action classes.

## Future Expansion Opportunities
None identified — the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization