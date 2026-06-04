# Decomposition: package auto discovery

## Topic Overview

Laravel's package auto-discovery provides automatic service provider and facade registration for packages installed via Composer. When a package declares providers and facades in its `composer.json` `extra.laravel` section, Laravel automatically loads them without requiring manual entry in `config/app.php`. The mechanism uses Composer's vendor directory scanning and caches discovered packages in `bootstrap/cache/packages.php`. Auto-discovery is the standard approach for the vast majority of L...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
package-auto-discovery/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### package auto discovery
- **Purpose:** Laravel's package auto-discovery provides automatic service provider and facade registration for packages installed via Composer. When a package declares providers and facades in its `composer.json` `extra.laravel` section, Laravel automatically loads them without requiring manual entry in `config/app.php`. The mechanism uses Composer's vendor directory scanning and caches discovered packages in `bootstrap/cache/packages.php`. Auto-discovery is the standard approach for the vast majority of L...
- **Difficulty:** Foundation
- **Dependencies:** package-service-provider-patterns, spatie-laravel-package-tools, and service-provider-registration-boot

## Dependency Graph
**Depends on:** package-service-provider-patterns, spatie-laravel-package-tools, and service-provider-registration-boot
**Depended on by:** Knowledge units that leverage or extend package auto discovery patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for package auto discovery.
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