# Decomposition: dusk fundamentals

## Topic Overview

Laravel Dusk provides browser-based E2E testing using ChromeDriver (or Selenium-compatible drivers) to automate real browser interactions. While Pest Playwright is recommended for new projects (2026+), Dusk remains widely deployed in existing projects and is fully supported. Dusk tests catch JavaScript rendering, DOM interaction, and cross-page flow regressions that HTTP tests cannot. They are the slowest test type (~1-5 seconds per test) and constitute ~10% of a balanced test suite.

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
dusk-fundamentals/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### dusk fundamentals
- **Purpose:** Laravel Dusk provides browser-based E2E testing using ChromeDriver (or Selenium-compatible drivers) to automate real browser interactions. While Pest Playwright is recommended for new projects (2026+), Dusk remains widely deployed in existing projects and is fully supported. Dusk tests catch JavaScript rendering, DOM interaction, and cross-page flow regressions that HTTP tests cannot. They are the slowest test type (~1-5 seconds per test) and constitute ~10% of a balanced test suite.
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: HTTP test helpers, JavaScript/DOM basics, CSS selectors, **Related Topics**: Dusk page objects, Dusk waiting strategies, Pest Playwright, Accessibility testing, **Advanced Follow-up**: Dusk CI integration, Multi-browser Dusk testing, and Visual regression with Dusk

## Dependency Graph
**Depends on:** **Prerequisites**: HTTP test helpers, JavaScript/DOM basics, CSS selectors, **Related Topics**: Dusk page objects, Dusk waiting strategies, Pest Playwright, Accessibility testing, **Advanced Follow-up**: Dusk CI integration, Multi-browser Dusk testing, and Visual regression with Dusk
**Depended on by:** Knowledge units that leverage or extend dusk fundamentals patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for dusk fundamentals.
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