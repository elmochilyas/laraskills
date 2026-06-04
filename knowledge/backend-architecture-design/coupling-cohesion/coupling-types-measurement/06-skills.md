# Skill: Measure and Reduce Coupling

## Purpose

Quantify the degree of interdependence between modules and refactor toward weaker coupling levels.

## When To Use

- Evaluating module extractability for microservices
- Code review of cross-module dependencies
- Quarterly architecture health assessments
- Before introducing new shared libraries or events

## When NOT To Use

- Framework internals where coupling is an accepted cost
- Orchestrator/entry-point modules that naturally have high fan-out
- When decoupling would introduce more complexity than the coupling it prevents

## Prerequisites

- Fowler's coupling taxonomy (content, common, external, control, stamp, data)
- Dependency analysis tooling (PHPStan, PhpMetrics, Deptrac)

## Inputs

- Source code with defined module boundaries
- Coupling analysis tool reports

## Workflow

1. Classify existing cross-module references by coupling type (content -> common -> external -> control -> stamp -> data)
2. Measure efferent coupling (Ce) per class; flag values above 10
3. Measure fan-out (Ce) and fan-in (Ca) per module
4. Compute Instability (I = Ce / (Ce + Ca)) per module
5. Detect and flag cyclic dependencies for immediate resolution
6. Apply Law of Demeter: replace long chains (getA()->getB()->getC()) with encapsulated methods
7. Refactor high-coupling modules by extracting interfaces, introducing events, or moving shared code
8. Set Ce thresholds per module type and enforce in CI

## Validation Checklist

- [ ] Ce measured per class; values > 10 flagged
- [ ] Instability computed per module
- [ ] Cyclic dependencies detected and resolved
- [ ] Law of Demeter violations identified and fixed
- [ ] Content coupling eliminated (no direct property access across modules)
- [ ] Common coupling (static state, globals) minimized
- [ ] Data coupling preferred over stamp coupling where possible
- [ ] CI enforces coupling thresholds

## Common Failures

- Ignoring coupling until rewrites are needed
- Measuring but not acting on findings
- Focusing only on code coupling (ignoring deployment/team coupling)
- Excessive decoupling (everything via events) adding complexity
- Treating all coupling equally (data coupling is fine, content coupling is not)

## Decision Points

- Is this coupling acceptable for framework internals?
- Event-driven decoupling vs interface abstraction?
- Which coupling type to prioritize reducing first?

## Performance Considerations

- Introducing interfaces for decoupling adds indirection overhead
- Event-driven decoupling adds latency vs direct calls
- Balance decoupling with hot-path performance requirements

## Security Considerations

- Content coupling can bypass security checkpoints
- Common coupling (shared state) can leak sensitive data between modules

## Related Rules (from 05-rules.md)

- Rule 1: Prefer content coupling -> stamp coupling -> data coupling (lowest to highest coupling)
- Rule 2: Measure and track efferent coupling (Ce) per class or module; flag values above 10
- Rule 3: Measure fan-out (Ce) and fan-in (Ca) per module; unstable modules need stabilization
- Rule 4: Break cyclic dependencies between modules immediately
- Rule 5: Use the Law of Demeter to reduce coupling depth

## Related Skills

- Measure Cohesion Types
- Perform Dependency Analysis
- Detect Distributed Monolith

## Success Criteria

- Zero content or common coupling across module boundaries
- Average class Ce below 10
- Module Instability below 0.5 for stable core modules
