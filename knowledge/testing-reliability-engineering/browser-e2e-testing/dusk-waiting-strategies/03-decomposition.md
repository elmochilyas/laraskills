# Decomposition: dusk waiting strategies

## Topic Overview

Dusk waiting strategies control how browser tests handle time-dependent page states: element availability, text rendering, dialog appearance, and JavaScript execution. Using explicit `waitFor()`/`waitForText()` over fixed `pause()` is the single most important factor in Dusk test reliability. Proper waiting strategies eliminate the

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
dusk-waiting-strategies/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### dusk waiting strategies
- **Purpose:** Dusk waiting strategies control how browser tests handle time-dependent page states: element availability, text rendering, dialog appearance, and JavaScript execution. Using explicit `waitFor()`/`waitForText()` over fixed `pause()` is the single most important factor in Dusk test reliability. Proper waiting strategies eliminate the
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Dusk fundamentals, Dusk selectors, JavaScript/DOM timing, **Related Topics**: Dusk page objects, Dusk components, Flaky test prevention, **Advanced Follow-up**: Custom waiting macros, Network condition simulation, and JavaScript execution assertions

## Dependency Graph
**Depends on:** **Prerequisites**: Dusk fundamentals, Dusk selectors, JavaScript/DOM timing, **Related Topics**: Dusk page objects, Dusk components, Flaky test prevention, **Advanced Follow-up**: Custom waiting macros, Network condition simulation, and JavaScript execution assertions
**Depended on by:** Knowledge units that leverage or extend dusk waiting strategies patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for dusk waiting strategies.
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