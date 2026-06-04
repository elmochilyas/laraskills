# Decomposition: PSR-4 autoloading configuration for custom directories

## Topic Overview

PSR-4 autoloading is the mechanism that makes custom directory structures possible in Laravel. By modifying the `autoload.psr-4` section in `composer.json`, any directory can be mapped to any namespace prefix.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-03-psr4-autoloading/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### PSR-4 autoloading configuration for custom directories
- **Purpose:** PSR-4 autoloading is the mechanism that makes custom directory structures possible in Laravel. By modifying the `autoload.psr-4` section in `composer.json`, any directory can be mapped to any namespace prefix.
- **Difficulty:** Foundation
- **Dependencies:** Composer autoload basics

## Dependency Graph

This KU depends on: Composer autoload basics
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** PSR-4 maps namespace prefixes to directory roots. `App\` maps to `app/`, so `App\Models\User` maps to `app/Models/User.php`. The namespace prefix is replaced by the directory root, then the remaining ...
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