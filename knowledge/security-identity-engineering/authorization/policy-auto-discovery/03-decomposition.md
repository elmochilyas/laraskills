# Decomposition: policy auto discovery

## Topic Overview

Laravel automatically discovers Policy classes by matching model names to policy names with the `Policy` suffix, scanning `app/Policies/` and `app/Models/Policies/` directories. This eliminates manual registration for convention-following projects. Alternative registration methods include the `$policies` array on `AuthServiceProvider` and the `

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
policy-auto-discovery/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### policy auto discovery
- **Purpose:** Laravel automatically discovers Policy classes by matching model names to policy names with the `Policy` suffix, scanning `app/Policies/` and `app/Models/Policies/` directories. This eliminates manual registration for convention-following projects. Alternative registration methods include the `$policies` array on `AuthServiceProvider` and the `
- **Difficulty:** Foundation
- **Dependencies:** Prerequisites: Policies (model-centric authorization classes), Related: Gates (closure-based authorization), Super-admin bypass, Advanced Follow-up: Custom Gate::guessPolicyNamesUsing implementation, and Testing policy discovery with alternate namespaces

## Dependency Graph
**Depends on:** Prerequisites: Policies (model-centric authorization classes), Related: Gates (closure-based authorization), Super-admin bypass, Advanced Follow-up: Custom Gate::guessPolicyNamesUsing implementation, and Testing policy discovery with alternate namespaces
**Depended on by:** Knowledge units that leverage or extend policy auto discovery patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for policy auto discovery.
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