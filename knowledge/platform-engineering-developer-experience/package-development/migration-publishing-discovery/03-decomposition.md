# Decomposition: migration publishing discovery

## Topic Overview

Laravel packages that need database tables must register and publish migrations. The pattern involves three paths: (1) automatic loading (`$this->loadMigrationsFrom()`) runs migrations directly from the package's vendor directory, (2) publishing (`$this->publishes()`) copies migrations to the application's `database/migrations/` directory, and (3) Spatie tools' named migrations (`->hasMigration()`) provide selective publishing with timestamp prefixing. The key design consideration is whether ...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
migration-publishing-discovery/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### migration publishing discovery
- **Purpose:** Laravel packages that need database tables must register and publish migrations. The pattern involves three paths: (1) automatic loading (`$this->loadMigrationsFrom()`) runs migrations directly from the package's vendor directory, (2) publishing (`$this->publishes()`) copies migrations to the application's `database/migrations/` directory, and (3) Spatie tools' named migrations (`->hasMigration()`) provide selective publishing with timestamp prefixing. The key design consideration is whether ...
- **Difficulty:** Foundation
- **Dependencies:** config-file-merging-publishing, spatie-laravel-package-tools, and package-service-provider-patterns

## Dependency Graph
**Depends on:** config-file-merging-publishing, spatie-laravel-package-tools, and package-service-provider-patterns
**Depended on by:** Knowledge units that leverage or extend migration publishing discovery patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for migration publishing discovery.
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