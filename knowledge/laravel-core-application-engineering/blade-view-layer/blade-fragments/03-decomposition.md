# Decomposition: Blade Fragments

## Topic Overview
Partial re-rendering of view sections (Laravel 12+) using @fragment and fragment() on the response for Turbo Drive and HTMX integration — returning only changed content without full page reload.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
blade-fragments/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Blade Fragments
- **Purpose:** Partial re-rendering (Laravel 12+)
- **Difficulty:** Advanced
- **Dependencies:** Component System

## Dependency Graph
This KU depends on: Component System. It also compares with Livewire/Inertia patterns.

## Boundary Analysis
**In scope:** @fragment directive, fragment() response method, fragment request detection, Turbo Drive integration, HTMX integration, fragment vs Livewire comparison, fragment vs section distinction, caching fragment responses, SEO considerations.
**Out of scope:** Livewire component architecture (covered in Livewire/Inertia subdomain), Turbo Drive configuration, HTMX client-side setup.

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