# Decomposition: Laravel Prunable Trait

## Topic Overview
Laravel's `Prunable` trait provides scheduled hard-deletion of Eloquent models via the `model:prune` Artisan command. It is the framework's native mechanism for enforcing data retention periods. Models implement a `prunable()` query scope defining which records to delete (typically based on `created_at`).

## Decomposition Strategy
This Knowledge Unit is atomic -- it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-prunable-trait/
  02-knowledge-unit.md
  03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel Prunable Trait
- **Purpose:** Laravel's `Prunable` trait provides scheduled hard-deletion of Eloquent models via the `model:prune` Artisan command.
- **Difficulty:** Intermediate
- **Dependencies:** GCE-DRA-002 (retainable-contract-pattern) — Alternative for field-level retention/anonymization, GCE-DRA-003 (laravel-data-scrubber) — Scrubbing strategies complement pruning, GCE-GDP-001 (rylxes-laravel-gdpr) — Right to erasure integrates with pruning workflow

## Dependency Graph
**Depends on:**
- GCE-DRA-002 (retainable-contract-pattern) — Alternative for field-level retention/anonymization
- GCE-DRA-003 (laravel-data-scrubber) — Scrubbing strategies complement pruning
- GCE-GDP-001 (rylxes-laravel-gdpr) — Right to erasure integrates with pruning workflow

**Depended by:**
- Other Knowledge Units within this domain that reference this topic as a dependency.

## Boundary Analysis
**In scope:**
- Prunable trait
- MassPrunable trait
- Pruning vs SoftDeletes
- `model:prune` command
**Out of scope:**
- Related topics covered in other Knowledge Units within this domain.
- GCE-DRA-002 (retainable-contract-pattern) — Alternative for field-level retention/anonymization, GCE-DRA-003 (laravel-data-scrubber) — Scrubbing strategies complement pruning, GCE-GDP-001 (rylxes-laravel-gdpr) — Right to erasure integrates with pruning workflow

## Future Expansion Opportunities
None identified -- the topic is stable and well-bounded at this granularity.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization