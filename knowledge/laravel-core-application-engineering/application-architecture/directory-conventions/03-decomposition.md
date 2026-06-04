# Decomposition: Directory Conventions

## Topic Overview
Laravel's directory structure is a convention-based scaffold organizing application code by technical layer. The default layout maps to PSR-4 autoloading and establishes a predictable file layout.

## Decomposition Strategy
This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
`
directory-conventions/
  +-- 02-knowledge-unit.md
  +-- 03-decomposition.md
`

## Knowledge Unit Inventory

### Directory Conventions
- **Purpose:** Default and custom directory structure conventions, PSR-4 autoloading mapping, and organizational patterns.
- **Difficulty:** Foundation
- **Dependencies:** Application Class

## Dependency Graph
This KU depends on: Application Class. It serves as prerequisite for Application Organization Patterns and Feature-based Structure.

## Boundary Analysis
**In scope:** Default Laravel 11+ directory structure; PSR-4 namespace-to-path mapping; technical-layer, domain, modular, and hybrid organizational patterns; Artisan generator conventions; bootstrap cache interaction.
**Out of scope:** Feature-based structure internals; cross-feature communication; service provider file placement rules.

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