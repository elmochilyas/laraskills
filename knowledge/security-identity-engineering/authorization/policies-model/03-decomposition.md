# Decomposition: policies model

## Topic Overview

Policies are classes that organize authorization logic per Eloquent model. Each method (`view`, `create`, `update`, `delete`, `restore`, `forceDelete`) corresponds to a user action against that model. Policies are auto-discovered by naming convention, can be registered explicitly via `$policies` array or `

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
policies-model/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### policies model
- **Purpose:** Policies are classes that organize authorization logic per Eloquent model. Each method (`view`, `create`, `update`, `delete`, `restore`, `forceDelete`) corresponds to a user action against that model. Policies are auto-discovered by naming convention, can be registered explicitly via `$policies` array or `
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Gates (closure-based authorization), Auth guards/providers architecture, Related: Policy auto-discovery by naming convention, Super-admin bypass, Blade authorization directives, Advanced Follow-up: Policy security patterns, Testing authorization, and Policy + Spatie Permission integration

## Dependency Graph
**Depends on:** Prerequisites: Gates (closure-based authorization), Auth guards/providers architecture, Related: Policy auto-discovery by naming convention, Super-admin bypass, Blade authorization directives, Advanced Follow-up: Policy security patterns, Testing authorization, and Policy + Spatie Permission integration
**Depended on by:** Knowledge units that leverage or extend policies model patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for policies model.
**Out of scope:** Adjacent topics covered in their own knowledge units; advanced or specialized use cases that extend beyond the core scope.

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