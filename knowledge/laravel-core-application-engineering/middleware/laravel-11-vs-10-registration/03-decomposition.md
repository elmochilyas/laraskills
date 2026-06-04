# Decomposition: Laravel 11 vs 10 Middleware Registration

## Topic Overview
Middleware registration differences across versions — Kernel.php (Laravel 10) vs bootstrap/app.php (Laravel 11+), the fluent API, HasMiddleware interface, #[Middleware] attribute, and backward compatibility.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
laravel-11-vs-10-registration/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Laravel 11 vs 10 Middleware Registration
- **Purpose:** Middleware registration differences across versions — Kernel.php (Laravel 10) vs bootstrap/app.php (Laravel 11+) fluent API.
- **Difficulty:** Intermediate
- **Dependencies:** Middleware Fundamentals

## Dependency Graph
This KU depends on: Middleware Fundamentals. It serves as prerequisite for upgrading applications between Laravel versions.

## Boundary Analysis
**In scope:** The fundamental shift (Kernel.php → bootstrap/app.php), fluent API methods (append, prepend, alias, group, priority, web, api), Laravel 10 Kernel.php structure, Laravel 11+ bootstrap/app.php structure, Middleware configuration object, HasMiddleware interface (replaces $this->middleware()), #[Middleware] attribute, backward compatibility (old Kernel.php still works), conditional registration pattern, group modification pattern (append/prepend/remove/replace), complete group replacement, upgrade considerations, package compatibility.

**Out of scope:** Pipeline mechanics (middleware-fundamentals KU), registration tiers (global-route-group-middleware KU), controller middleware specifics (controller-middleware KU), general Laravel upgrade guide.

## Future Expansion Opportunities
- Laravel 13+ registration evolution (if further API changes occur)
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization