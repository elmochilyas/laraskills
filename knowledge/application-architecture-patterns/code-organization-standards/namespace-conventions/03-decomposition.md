# Decomposition: Namespace conventions and directory-to-namespace mapping

## Topic Overview

PHP namespaces in Laravel follow the PSR-4 convention where namespace segments map directly to directory segments. The root namespace `App\` maps to the `app/` directory.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-04-namespace-conventions/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Namespace conventions and directory-to-namespace mapping
- **Purpose:** PHP namespaces in Laravel follow the PSR-4 convention where namespace segments map directly to directory segments. The root namespace `App\` maps to the `app/` directory.
- **Difficulty:** Foundation
- **Dependencies:** PHP namespace syntax

## Dependency Graph

This KU depends on: PHP namespace syntax
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** - `namespace App\Models;` → file must be in `app/Models/` - `namespace App\Http\Controllers\Api;` → file must be in `app/Http/Controllers/Api/` - Class `User` in namespace `App\Models` → FQCN `A...
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