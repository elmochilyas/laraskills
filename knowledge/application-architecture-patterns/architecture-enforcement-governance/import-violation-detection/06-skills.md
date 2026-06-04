# Skill: Detect Import Violations Between Bounded Contexts

## Purpose
Default to strict import allowlists per bounded context (empty by default). Encode the dependency map as Pest architecture tests. Detect both direct and transitive import violations. Run detection in CI as a pre-merge gate. Use namespace-based detection (not class-level). Treat the shared kernel as the only universal allowlist. Maintain a documented dependency map. Provide IDE integration for real-time feedback.

## When To Use
- Preventing unauthorized coupling between bounded contexts
- Enforcing dependency direction rules

## When NOT To Use
- Single-context applications (no cross-context imports to protect)

## Prerequisites
- Bounded context map (DBC-01, DBC-05)
- Architecture testing configured (AEG-01)

## Inputs
- Dependency map (allowed imports between contexts)
- Context namespace prefixes

## Workflow
1. **Default to strict import allowlists per bounded context.** Start every context with an empty allowlist. Add allowed dependencies explicitly as needed. Prevents accidental coupling from day one.

2. **Encode the dependency map as Pest architecture tests.** Executable, readable, verified in CI. Use `->not->toUse()` for forbidden imports.

3. **Detect transitive dependencies.** If Context A imports from Context B which imports from Context C, A effectively depends on C. Detection must flag this. Test both direct and transitive paths.

4. **Run import violation detection in CI as a pre-merge gate.** Configure CI to block merges on import violations. Never rely on developer discipline or IDE warnings alone.

5. **Use namespace-based import detection.** Detect violations by matching the namespace of the imported class against the dependency map. Namespace-level detection covers all classes in a context automatically.

6. **Treat the shared kernel as the only universal allowlist.** All contexts may import from Shared without restriction. Shared must be gated — only common, non-domain-specific code belongs there.

7. **Maintain a documented dependency map.** A matrix of allowed imports between all contexts — both human-readable and encoded in tests.

8. **Provide IDE integration for real-time violation feedback.** Configure PHPStan IDE integration to flag import violations as the developer types.

## Validation Checklist
- [ ] Dependency map exists for all contexts
- [ ] Pest architecture tests enforce import rules
- [ ] Transitive dependencies are detected
- [ ] Detection runs in CI and blocks merges
- [ ] Shared kernel is the only universal allowlist
- [ ] IDE provides real-time import violation feedback
- [ ] Strict allowlists per context (not permissive)

## Common Failures
- **No detection.** Unauthorized cross-context imports accumulate silently.
- **Transitive dependency blind spot.** Only direct imports checked — hidden coupling through dependency chain.
- **Detection without enforcement.** Violations reported but not blocked in CI.

## Decision Points
- **Strict vs permissive allowlist?** Strict (empty by default) for all contexts. Add allowed imports explicitly.

## Performance Considerations
- Import scanning runs in CI (seconds). No production impact.

## Security Considerations
- Import detection prevents code from accessing unauthorized internal APIs. Supports principle of least privilege.

## Related Rules
- Rule: Default To Strict Import Allowlists Per Context (AEG-05/05-rules.md)
- Rule: Use Pest Architecture Tests For Import Rules (AEG-05/05-rules.md)
- Rule: Detect Transitive Dependencies (AEG-05/05-rules.md)
- Rule: Run Detection In CI As Pre-Merge Gate (AEG-05/05-rules.md)
- Rule: Use Namespace-Based Detection (AEG-05/05-rules.md)
- Rule: Shared Kernel As Only Universal Allowlist (AEG-05/05-rules.md)
- Rule: Maintain Documented Dependency Map (AEG-05/05-rules.md)
- Rule: Provide IDE Integration For Real-Time Feedback (AEG-05/05-rules.md)

## Related Skills
- Encode Rules as Architecture Tests (AEG-01/06-skills.md)
- Enforce Architecture Rules in CI (AEG-02/06-skills.md)
- Configure Static Analysis Rules (AEG-03/06-skills.md)
- Implement Drift Detection (AEG-08/06-skills.md)

## Success Criteria
- Every bounded context starts with an empty import allowlist — all allowed dependencies are explicitly declared.
- The dependency map is encoded as Pest architecture tests and maintained as a documented matrix.
- Both direct and transitive import violations are detected.
- Import detection runs in CI and blocks merges on violations.
- All detection uses namespace-level matching, not class-level.
- The shared kernel is the only context all other contexts may freely import from.
