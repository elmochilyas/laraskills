# Controller Inheritance — Phase 3: Operations & Lifecycle

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Versioning
- **Last Updated:** 2026-06-02

## Executive Summary
Phase 3 covers maintaining controller inheritance hierarchies over time: preventing hierarchy rot, managing base controller evolution as versions diverge, detecting accidental shared behavior, and safely refactoring inheritance into composition.

## Core Concepts
- **Hierarchy Rot:** Base controller grows as shared logic between versions shrinks over time.
- **Divergent Versions:** When V1 and V2 share less than 50% of controller logic, inheritance becomes a burden.
- **Base Evolution:** Safe patterns for evolving the base controller without breaking existing versions.
- **Refactoring to Composition:** Migrating from deep inheritance to strategy or decorator patterns.

## Mental Models
- **Family Tree:** Controller inheritance is a family tree. Over generations, branches diverge. At some point, cousins (V1, V2) share only a last name (base controller) but little else.
- **Platform Foundation:** Base controller is a building foundation. As you add floors (versions), the foundation must hold. But if a new wing (new feature) goes in a different direction, it needs its own foundation.

## Internal Mechanics
- A `ControllerInheritanceAnalyzer` tool calculates the percentage of overridden methods per version controller.
- When override rate exceeds 60%, the tool reports potential refactoring opportunity.
- Base controller changes trigger a full test suite run against ALL version controllers.
- Static analysis detects unused base controller methods in version subclasses.

## Patterns
- Regular hierarchy health reports with override ratios.
- Base controller freeze: after a threshold, the base controller is marked stable and new versions get their own base.
- Deprecation path for base controller methods that are no longer shared.
- Refactoring from inheritance to composition: extract shared logic into injected services.

## Architectural Decisions

| Decision | Option | Rationale |
|----------|--------|-----------|
| Refactoring threshold | >60% overridden methods | Empirical tipping point |
| Base controller stability | Minor changes only after 2+ versions | Reduces regression risk |
| Method deprecation | `@deprecated` docblock + trigger_error | Runtime warning for extenders |
| New version approach | Extend existing base vs new base | New base for significantly different versions |

## Tradeoffs

| Aspect | Pros | Cons |
|--------|------|------|
| Keep inheritance | Minimal refactoring | Growing tech debt |
| Refactor to composition | Clean separation of concerns | Large refactoring effort |
| New base controller | Fresh start for new version | Duplication with old base |
| Hybrid approach | Gradual migration | Complexity of mixed patterns |

## Performance Considerations
- No runtime performance implications from refactoring inheritance to composition.
- Static analysis tooling runs offline, zero production impact.
- Test suite execution time increases with hierarchy complexity.

## Production Considerations
- Run hierarchy health checks in CI and alert when override ratio exceeds threshold.
- Schedule base controller audits quarterly.
- When base controller needs a breaking change, create a new base and keep old base for existing versions.
- Document the inheritance strategy in the project's architecture guide.

## Common Mistakes
- Letting base controller grow into a "god" object with methods used by only one version.
- Adding base controller logic that subtly couples all versions together.
- Not recognizing when inheritance has outlived its usefulness (too many overrides).
- Refactoring an inheritance hierarchy that has no tests — regression risk.

## Failure Modes
- **Ripple regression:** A well-meaning change to base controller breaks V1, V2, and V3 because they all inherit it.
- **Refactoring paralysis:** Team knows inheritance should be replaced but the hierarchy is too tangled to safely refactor.
- **Abandoned base:** Base controller methods are overridden in every version, making the base an empty shell with dead code.
- **Version bleed:** Base controller accidentally references V2-specific logic, causing V1 runtime errors.

## Ecosystem Usage
- **Symfony CMF:** Documented evolution from deep controller inheritance to composition-based versioning.
- **WordPress REST API:** Uses inheritance for WP REST controllers; deprecated base controller methods marked clearly.
- **Laravel Nova:** Controllers evolved with platform; base controller stabilized early, new features use traits.

## Related Knowledge Units
- **Prerequisites:** OOP refactoring techniques, Test-driven development
- **Related Topics:** Resource class organization, Form request organization
- **Advanced Follow-up:** Strategy pattern, Decorator pattern, Composition over inheritance

## Research Notes
### Source Analysis
Fowler's "Refactoring: Improving the Design of Existing Code" (3rd ed., 2021) covers "Replace Inheritance with Delegation" — the key refactoring for controller hierarchy rot.

### Key Insight
Controller inheritance is a "young API" pattern. As the API matures and versions diverge, inheritance must evolve into composition or the hierarchy becomes technical debt.

### Version-Specific Notes
PHP 8.3+ `#[Override]` attribute helps catch accidental signature drift in inherited controllers.
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization