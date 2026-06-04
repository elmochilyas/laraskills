# Decomposition: accessibility regression testing

## Topic Overview

Accessibility regression testing ensures that UI changes do not introduce barriers for users with disabilities. For Laravel applications, the primary approach integrates axe-core (via Dusk JavaScript execution) for automated accessibility audits and Pa11y CLI for scheduled checks. Key regression points include error-summary focus management, `aria-invalid` on invalid fields, `role="alert"`/`role="status"` announcements, and keyboard operability. This practice is emerging in 2026 but is becomi...

## Decomposition Strategy

This Knowledge Unit is atomic — it covers a single, well-bounded concept with independent decisions, tradeoffs, and architecture guidance. No further decomposition is needed.

## Proposed Folder Structure

`
accessibility-regression-testing/
  02-knowledge-unit.md
  03-decomposition.md
`

## Knowledge Unit Inventory

### accessibility regression testing
- **Purpose:** Accessibility regression testing ensures that UI changes do not introduce barriers for users with disabilities. For Laravel applications, the primary approach integrates axe-core (via Dusk JavaScript execution) for automated accessibility audits and Pa11y CLI for scheduled checks. Key regression points include error-summary focus management, `aria-invalid` on invalid fields, `role="alert"`/`role="status"` announcements, and keyboard operability. This practice is emerging in 2026 but is becomi...
- **Difficulty:** Foundation
- **Dependencies:** **Prerequisites**: Laravel Dusk fundamentals, JavaScript DOM basics, WCAG 2.1 understanding, **Related Topics**: Dusk selectors and page objects, Flaky test prevention, Post-deployment health checks, **Advanced Follow-up**: Screen reader testing automation, WCAG 2.2 compliance migration, and Visual regression + a11y combined testing

## Dependency Graph
**Depends on:** **Prerequisites**: Laravel Dusk fundamentals, JavaScript DOM basics, WCAG 2.1 understanding, **Related Topics**: Dusk selectors and page objects, Flaky test prevention, Post-deployment health checks, **Advanced Follow-up**: Screen reader testing automation, WCAG 2.2 compliance migration, and Visual regression + a11y combined testing
**Depended on by:** Knowledge units that leverage or extend accessibility regression testing patterns.

## Boundary Analysis
**In scope:** Core concepts and implementation patterns for accessibility regression testing.
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