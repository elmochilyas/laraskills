# Skill: Encode Architectural Rules As Automated Pest Architecture Tests

## Purpose
Encode every architectural rule as a Pest architecture test. Run tests on every PR as a pre-merge gate. Define all tests in `tests/Architecture/`. Enforce dependency direction, context isolation, and naming conventions. Start strict and loosen with `->ignoring()`. Prefer Pest tests over custom PHPStan rules. Review exception lists quarterly.

## When To Use
- Enforcing dependency direction between layers
- Enforcing bounded context isolation
- Enforcing naming conventions
- Any structural rule that should never be violated

## When NOT To Use
- Performance constraints (use load testing)
- Runtime behavior (use integration tests)
- Transient rules you plan to remove soon

## Prerequisites
- Dependency direction understanding (COS-01)
- Bounded context basics (DBC-01)

## Inputs
- Architectural rules and dependency map
- Naming conventions

## Workflow
1. **Encode every architectural rule as an automated Pest architecture test.** Documentation-only rules are never read. Automated tests catch violations on every CI run.

2. **Run architecture tests on every PR as a pre-merge gate.** Configure CI to block merges on architecture test failures. The only way to merge a violation is to change the rule.

3. **Define all architecture tests in `tests/Architecture/`.** A single directory makes rules visible to the entire team. Anyone can open the directory to understand the architectural constraints.

4. **Enforce dependency direction between layers.** Controllers may call Services, Services may call Repositories. Never allow reverse dependencies. Enforce with `->not->toUse()`.

5. **Enforce bounded context isolation.** Code in one context must not import from another context unless explicitly allowed by the dependency map.

6. **Enforce naming conventions.** Controllers must end with `Controller`, services with `Service`, commands with `Command`.

7. **Start with strict rules and loosen with `->ignoring()`.** Relaxing via `->ignoring()` documents each exception. Tightening a loose rule requires finding all existing violations.

8. **Review the exception list quarterly.** Remove exceptions that are no longer needed. Stale exceptions hide new violations.

## Validation Checklist
- [ ] Architecture tests exist for dependency direction rules
- [ ] Architecture tests exist for context isolation rules
- [ ] Architecture tests exist for naming conventions
- [ ] Tests are in `tests/Architecture/`
- [ ] Tests run in CI and block merges on failure
- [ ] Exception list (`->ignoring()`) is reviewed periodically

## Common Failures
- **No architecture tests.** Rules exist only in documentation — no one reads them.
- **Rules too strict.** Enforcing rules that prevent legitimate patterns — developers work around them.
- **Rules not run in CI.** Tests exist locally but are never automatically enforced.

## Decision Points
- **Pest test vs PHPStan rule?** Prefer Pest for structural/import rules. Use PHPStan only for type-level constraints Pest cannot express.

## Performance Considerations
- Run in CI only (zero production impact). 50-100 architecture tests take 1-5 seconds.

## Security Considerations
- Architecture tests don't handle sensitive data. No security concerns.

## Related Rules
- Rule: Encode Architectural Rules As Automated Pest Architecture Tests (AEG-01/05-rules.md)
- Rule: Run Architecture Tests On Every PR As A Pre-Merge Gate (AEG-01/05-rules.md)
- Rule: Define All Architecture Tests In `tests/Architecture/` (AEG-01/05-rules.md)
- Rule: Enforce Dependency Direction Between Layers (AEG-01/05-rules.md)
- Rule: Enforce Bounded Context Isolation (AEG-01/05-rules.md)
- Rule: Enforce Naming Convention Rules (AEG-01/05-rules.md)
- Rule: Start With Strict Rules And Loosen With `->ignoring()` (AEG-01/05-rules.md)
- Rule: Review The Architecture Test Exception List Periodically (AEG-01/05-rules.md)

## Related Skills
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Configure Static Analysis Rules (AEG-03/06-skills.md)
- Implement Import Violation Detection (AEG-05/06-skills.md)
- Implement Drift Detection (AEG-08/06-skills.md)

## Success Criteria
- Every architectural rule is encoded as a Pest architecture test in `tests/Architecture/`.
- All architecture tests run in CI and block PR merges on failure.
- Dependency direction rules prevent reverse layer dependencies.
- Context isolation rules prevent unauthorized cross-context imports.
- Naming conventions are enforced with `->toHaveSuffix()`.
- Strict rules are used with explicit `->ignoring()` exceptions reviewed quarterly.
