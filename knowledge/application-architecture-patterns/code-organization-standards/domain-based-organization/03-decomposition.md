# Decomposition: Organizing by domain: app/Domains/{Domain} structure

## Topic Overview

Domain-based organization places code into directories named after business domains (Bounded Contexts in DDD terminology), each containing all the layers needed for that domain. Instead of `app/Models/`, `app/Http/Controllers/`, `app/Services/`, a domain-based structure has `app/Domains/Billing/`, `app/Domains/Catalog/`, `app/Domains/Identity/`, each with its own `Models/`, `Http/Controllers/`, `Services/`, `Events/`, etc.

## Decomposition Strategy

This Knowledge Unit is atomic � it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

``
COS-06-domain-based-organization/
  02-knowledge-unit.md
  03-decomposition.md
``

## Knowledge Unit Inventory

### Organizing by domain: app/Domains/{Domain} structure
- **Purpose:** Domain-based organization places code into directories named after business domains (Bounded Contexts in DDD terminology), each containing all the layers needed for that domain. Instead of `app/Models/`, `app/Http/Controllers/`, `app/Services/`, a domain-based structure has `app/Domains/Billing/`, `app/Domains/Catalog/`, `app/Domains/Identity/`, each with its own `Models/`, `Http/Controllers/`, `Services/`, `Events/`, etc.
- **Difficulty:** Intermediate
- **Dependencies:** COS-01 Default structure

## Dependency Graph

This KU depends on: COS-01 Default structure
This KU is depended on by: Related KUs in the same subdomain and advanced topics referencing this concept.

## Boundary Analysis

**In scope:** ``` app/ ├── Domains/
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