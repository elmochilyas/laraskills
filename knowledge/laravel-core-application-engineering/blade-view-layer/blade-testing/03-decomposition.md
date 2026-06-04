# Decomposition: Blade Testing

## Topic Overview
Testing Blade views and components — verifying that templates render correctly with given data using assertSee(), assertDontSee(), assertViewHas(), and the blade() test helper.

## Decomposition Strategy
This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure
```
blade-testing/
  ├── 02-knowledge-unit.md
  └── 03-decomposition.md
```

## Knowledge Unit Inventory

### Blade Testing
- **Purpose:** Testing Blade views and components
- **Difficulty:** Intermediate
- **Dependencies:** Component System, PHPUnit/Pest

## Dependency Graph
This KU depends on: Component System, PHPUnit/Pest. It serves as prerequisite for validating view-layer correctness.

## Boundary Analysis
**In scope:** View rendering in tests, HTTP response assertions, component testing, conditional rendering testing, loop testing, translation testing, blade() helper, assertSee/assertDontSee/assertViewHas, view unit tests vs HTTP integration tests, testing custom directives.
**Out of scope:** Form Request testing (covered in Form Request Testing), browser testing with Dusk (covered in Dusk), controller testing (covered in Controllers).

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