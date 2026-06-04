# Skill: Avoid Premature Abstraction and YAGNI Violations

## Purpose

Delay abstraction until concrete variation points emerge, avoiding speculative complexity that adds cost without benefit.

## When To Use

- When deciding to extract an interface, factory, or pattern
- Code review where abstractions seem unnecessary
- Greenfield projects where temptation to over-architect is high
- Revisiting existing abstractions with only one implementation

## When NOT To Use

- Published library interfaces where stability is required
- Security-related logic where abstraction prevents gaps
- Hexagonal architecture ports at system boundaries (always abstract)

## Prerequisites

- YAGNI and KISS principles understanding
- Ability to refactor when duplication reaches the "rule of three"

## Inputs

- Proposed abstraction (interface, pattern, layer)
- Justification for the abstraction
- Current number of implementations/variations

## Workflow

1. When proposing an abstraction, identify the concrete need it solves today
2. Verify there are at least two current implementations (not speculative)
3. Prove the abstraction's value with before/after metrics (complexity, testability, change impact)
4. Prefer duplication over the wrong abstraction — let code diverge before unifying
5. Follow the "rule of three": wait for the third occurrence before extracting a generic solution
6. Remove abstractions that no longer have multiple implementations
7. Document deliberate non-abstraction decisions in ADRs

## Validation Checklist

- [ ] Abstraction solves a current, not future, problem
- [ ] At least two implementations exist (or one confirmed upcoming)
- [ ] Before/after metrics demonstrate improvement
- [ ] Rule of three applied: third occurrence confirmed the pattern
- [ ] Single-implementation abstractions have a removal plan
- [ ] Duplication accepted when abstraction would be incorrect
- [ ] No speculative interfaces, factories, or strategies

## Common Failures

- Abstracting because "we might need it later"
- Interface for everything (navigation overhead)
- Repository for every model (unnecessary abstraction for CRUD)
- Not abstracting at proven variation points
- Over-correcting: never abstracting leading to duplicated logic

## Decision Points

- Is this abstraction paying for itself today?
- Would duplication be less harmful than the wrong abstraction?
- Is this a hexagonal port (always abstract) or internal service (wait for two)?

## Performance Considerations

- Every abstraction layer adds method call overhead
- More files mean slower IDE navigation and longer build times
- Premature abstractions that are never used are pure dead weight

## Security Considerations

- Security logic should be abstracted early (two occurrences minimum, not three)
- Never delay abstraction that prevents security gaps
- Security interfaces should be explicit, not duplicated across services

## Related Rules (from 05-rules.md)

- Rule 1: Add abstraction only when a clear, concrete need for the second implementation exists
- Rule 2: Prove an abstraction's value by showing concrete before/after metrics
- Rule 3: Prefer duplication over the wrong abstraction
- Rule 4: Wait for the third occurrence before extracting a generic solution
- Rule 5: Remove an abstraction that is no longer pulling its weight

## Related Skills

- Balance Interface Granularity
- Detect and Refactor God Classes
- Write an Architecture Decision Record

## Success Criteria

- Every abstraction in the codebase is justified by concrete current need
- No interface has only one implementation without a valid reason
- Team applies "rule of three" consistently before extracting generics
