# Skill: Detect and Remediate a Big Ball of Mud

## Purpose

Identify tangled architecture with no coherent structure and incrementally extract modules to restore clarity and maintainability.

## When To Use

- High bug rates and slow feature delivery in an existing codebase
- Dependency analysis reveals circular dependencies and high coupling
- Team reports "nobody understands how everything fits together"
- Onboarding takes months due to code complexity

## When NOT To Use

- Small codebases (< 20K LOC) with obvious structure
- Systems being actively deprecated (only security fixes)
- When leadership won't invest in refactoring time

## Prerequisites

- Dependency analysis tools (Deptrac, PhpMetrics)
- Domain knowledge to identify bounded context boundaries
- Team buy-in for incremental improvement

## Inputs

- Source codebase with dependency graph
- Team pain points (slow delivery, high bug rates)
- Domain knowledge for boundary identification

## Workflow

1. Run dependency analysis to detect cycles and measure coupling
2. Identify stable domain boundaries through Event Storming or domain analysis
3. "Capstone the mess": wrap tangled code behind a facade to prevent further mud growth
4. Add a CI gate (Deptrac/PHPArkitect) to prevent new cross-boundary violations
5. Extract one module at a time, starting with the highest-value, most-constrained module
6. Break at domain boundaries, not technical layers
7. Keep a current C4 diagram of the evolving module structure
8. Refactor internally behind facades; never do a big-bang rewrite

## Validation Checklist

- [ ] Dependency analysis identifies all circular dependencies
- [ ] Tangled code wrapped behind facade before refactoring
- [ ] CI gate prevents new cross-boundary violations
- [ ] Modules extracted one at a time, not big-bang
- [ ] Extraction follows domain boundaries, not technical layers
- [ ] C4 diagram updated with each extraction
- [ ] Coupling metrics improving quarter over quarter

## Common Failures

- Attempting full rewrite (high risk, loss of business knowledge)
- Big Bang refactoring (too many changes at once)
- No boundaries enforcement (new code continues degrading)
- Perfectionism (80% improvement is better than abandoned effort)
- No metrics to measure progress

## Decision Points

- Which module to extract first? (highest value, most isolated)
- Facade vs full extraction for the first module?
- How much refactoring per sprint vs feature work?

## Performance Considerations

- Facade layers add indirection; minimize in hot paths first
- Extraction may introduce serialization/network overhead if splitting into services
- Monitor performance regression after each extraction

## Security Considerations

- Ensure facades don't bypass existing security checks
- Extracted modules need their own authentication/authorization

## Related Rules (from 05-rules.md)

- Rule 1: Break the monolith at stable domain boundaries, not randomly
- Rule 2: Add a dependency analysis CI gate to prevent further mud growth
- Rule 3: Extract one module at a time — never attempt a big-bang rewrite
- Rule 4: First, stop the bleeding — capstone the mess before cleaning it
- Rule 5: Maintain a clear and current visual map of the key dependencies

## Related Skills

- Perform Dependency Analysis
- Detect God Classes
- Implement Strangler Fig Pattern

## Success Criteria

- Zero circular dependencies between defined modules
- New features can be added without touching multiple unrelated modules
- Team can describe the module structure without looking at code
- Delivery velocity improves quarter over quarter
