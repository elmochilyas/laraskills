# Skill: Measure and Improve Cohesion

## Purpose

Assess how closely the responsibilities of a module are related and refactor classes with low cohesion.

## When To Use

- Code review shows utility classes with unrelated methods
- LCOM4 metrics indicate cohesive classes
- Team reports difficulty finding where logic lives
- Before splitting or merging classes

## When NOT To Use

- Facade classes designed to orchestrate multiple services (intentionally low cohesion)
- Infrastructure classes (service providers, middleware) with natural multiple dependencies
- When improving cohesion would dramatically increase coupling

## Prerequisites

- Understanding of the cohesion spectrum (coincidental to functional)
- LCOM4 measurement tooling (PhpMetrics, PHP Depend)

## Inputs

- Source code class definitions
- LCOM4 metric reports
- Team knowledge of class responsibilities

## Workflow

1. Run LCOM4 measurement tool across the codebase
2. Flag classes with LCOM4 > 2 for review
3. Apply the Single Responsibility Prompt test: describe the class in one sentence without "and"
4. Identify field subsets used by disjoint method groups
5. Extract unrelated responsibilities into separate classes
6. Target functional cohesion within each new class
7. Ensure coupling does not increase excessively after splitting
8. Re-measure and validate improvement

## Validation Checklist

- [ ] LCOM4 measured and flagged per class
- [ ] Classes with LCOM4 > 2 have refactoring plans
- [ ] Single Responsibility Prompt test applied
- [ ] Disjoint field usage identified and extracted
- [ ] Coupling not sacrificed for cohesion
- [ ] Utility classes with coincidental cohesion are eliminated
- [ ] Package-level cohesion reviewed, not just class-level

## Common Failures

- Treating cohesion as boolean (it's a spectrum)
- Functional cohesion for everything (not all classes need to be single-method)
- High cohesion at expense of increased coupling
- Measuring without acting on findings
- Ignoring package-level cohesion

## Decision Points

- Is this class deliberately a facade (low cohesion by design)?
- Would splitting increase coupling unacceptably?
- Which cohesion level is appropriate for this class's purpose?

## Performance Considerations

- Over-splitting can increase method call overhead
- Keep frequently-called paths cohesive but not over-split
- Balance cohesion with reasonable class sizes (100-300 lines typical)

## Security Considerations

- Cohesive security classes (Authentication, Authorization) prevent gaps
- Avoid scattering security logic across low-cohesion utility classes

## Related Rules (from 05-rules.md)

- Rule 1: Keep LCOM4 at 1 for non-infrastructure classes; investigate values > 2
- Rule 2: Prefer high-cohesion (functional cohesion) over sequential or communicational
- Rule 3: Use the Single Responsibility Prompt test to evaluate class cohesion
- Rule 4: Extract methods or classes when they use different subsets of fields
- Rule 5: Do not sacrifice coupling quality to improve cohesion artificially

## Related Skills

- Measure Coupling Types
- Detect and Refactor God Classes
- Perform Dependency Analysis

## Success Criteria

- 90%+ of non-infrastructure classes have LCOM4 = 1
- Team can describe every class's responsibility in one sentence
- Related functionality is easy to find (grouped in cohesive classes)
