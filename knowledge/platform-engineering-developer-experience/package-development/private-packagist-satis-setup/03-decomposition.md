# Decomposition: private packagist satis setup

## Topic Overview

Private package registries enable Laravel teams to distribute internal packages without making them publicly available on Packagist. The two primary solutions are Private Packagist (commercial SaaS by the makers of Composer) and Satis (open-source static generator). Private Packagist offers a full-featured interface with team management, webhook integration, automatic mirroring of public packages, and security vulnerability scanning. Satis is a simpler, self-hosted solution that generates a s...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
private-packagist-satis-setup/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### private packagist satis setup
- **Purpose:** Private package registries enable Laravel teams to distribute internal packages without making them publicly available on Packagist. The two primary solutions are Private Packagist (commercial SaaS by the makers of Composer) and Satis (open-source static generator). Private Packagist offers a full-featured interface with team management, webhook integration, automatic mirroring of public packages, and security vulnerability scanning. Satis is a simpler, self-hosted solution that generates a s...
- **Difficulty:** Foundation
- **Dependencies:** package-versioning-semantic-versioning, package-skeleton-structure, and package-auto-discovery

## Dependency Graph
**Depends on:** package-versioning-semantic-versioning, package-skeleton-structure, and package-auto-discovery
**Depended on by:** Knowledge units that leverage or extend private packagist satis setup patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for private packagist satis setup.
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