# Decomposition: internal template registries

## Topic Overview

Internal template registries are curated collections of Laravel project skeletons that encode organizational standards—PHP version, code style configuration (pint.json), static analysis setup (phpstan.neon), CI pipelines, Docker Compose services, deployment scripts, and starter kit selections. Teams choose a template when creating a new project, ensuring every Laravel application starts with compliant tooling and configuration. Templates range from minimal (bare Laravel installer) to opinio...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
internal-template-registries/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### internal template registries
- **Purpose:** Internal template registries are curated collections of Laravel project skeletons that encode organizational standards—PHP version, code style configuration (pint.json), static analysis setup (phpstan.neon), CI pipelines, Docker Compose services, deployment scripts, and starter kit selections. Teams choose a template when creating a new project, ensuring every Laravel application starts with compliant tooling and configuration. Templates range from minimal (bare Laravel installer) to opinio...
- **Difficulty:** Foundation
- **Dependencies:** golden-path-paved-road-patterns, self-service-environment-provisioning, and idp-architecture-patterns

## Dependency Graph
**Depends on:** golden-path-paved-road-patterns, self-service-environment-provisioning, and idp-architecture-patterns
**Depended on by:** Knowledge units that leverage or extend internal template registries patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for internal template registries.
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