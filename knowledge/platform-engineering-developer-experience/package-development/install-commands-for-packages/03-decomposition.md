# Decomposition: install commands for packages

## Topic Overview

Install commands (`php artisan package-name:install`) provide a single-step setup for Laravel packages, automating the process of publishing configuration files, migrations, and assets, and running initial setup operations. The pattern, popularized by Spatie's Laravel Package Tools, wraps multiple `vendor:publish` calls into a single Artisan command with progress feedback. A well-designed install command reduces the package setup from 3-5 manual steps to one command, significantly improving d...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
install-commands-for-packages/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### install commands for packages
- **Purpose:** Install commands (`php artisan package-name:install`) provide a single-step setup for Laravel packages, automating the process of publishing configuration files, migrations, and assets, and running initial setup operations. The pattern, popularized by Spatie's Laravel Package Tools, wraps multiple `vendor:publish` calls into a single Artisan command with progress feedback. A well-designed install command reduces the package setup from 3-5 manual steps to one command, significantly improving d...
- **Difficulty:** Foundation
- **Dependencies:** spatie-laravel-package-tools, config-file-merging-publishing, and migration-publishing-discovery

## Dependency Graph
**Depends on:** spatie-laravel-package-tools, config-file-merging-publishing, and migration-publishing-discovery
**Depended on by:** Knowledge units that leverage or extend install commands for packages patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for install commands for packages.
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