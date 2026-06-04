# Decomposition: package asset publishing

## Topic Overview

Package asset publishing (CSS, JavaScript, images, fonts) enables Laravel packages to ship frontend resources that are copied to the consuming application's `public/` or `resources/` directory. The pattern uses `$this->publishes([$source => $destination], 'asset-tag')` in the service provider, and the consumer runs `php artisan vendor:publish --tag=package-name-assets` to copy assets. Modern packages increasingly use Vite for asset bundling and ship pre-built assets in a `dist/` directory, wi...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
package-asset-publishing/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### package asset publishing
- **Purpose:** Package asset publishing (CSS, JavaScript, images, fonts) enables Laravel packages to ship frontend resources that are copied to the consuming application's `public/` or `resources/` directory. The pattern uses `$this->publishes([$source => $destination], 'asset-tag')` in the service provider, and the consumer runs `php artisan vendor:publish --tag=package-name-assets` to copy assets. Modern packages increasingly use Vite for asset bundling and ship pre-built assets in a `dist/` directory, wi...
- **Difficulty:** Foundation
- **Dependencies:** inertia-component-integration-packages, config-file-merging-publishing, and migration-publishing-discovery

## Dependency Graph
**Depends on:** inertia-component-integration-packages, config-file-merging-publishing, and migration-publishing-discovery
**Depended on by:** Knowledge units that leverage or extend package asset publishing patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for package asset publishing.
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