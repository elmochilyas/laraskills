# Decomposition — Thin Controller Enforcement

## Boundary Analysis

| Aspect | Details |
|--------|---------|
| **Scope** | Automated enforcement via PHPStan rules, Deptrac layer boundaries, CI pipeline checks, graduated enforcement strategy, rule maintenance |
| **Boundaries** | Ends where manual enforcement (code review) begins; distinct from code quality metrics (PhpMetrics) which measure but do not enforce; separate from general coding standards (PSR-12) |
| **Interfaces** | `phpstan.neon` configuration, `deptrac.yaml` configuration, CI script/action definitions, `@phpstan-ignore-next-line` exemption mechanism |

## Atomicity Assessment

| Criteria | Verdict | Rationale |
|----------|---------|-----------|
| Single concept | ✅ Atomic | Automated enforcement is one coherent practice area |
| Minimal overlap | ✅ Atomic | Overlaps with controller-code-limits in goal but differs fundamentally in mechanism (automated rules vs manual metrics) |
| Testable independently | ✅ Atomic | Can test that a violating controller triggers the enforcement rule |
| Splittable? | ⚠️ Borderline | Could split "PHPStan rules" from "Deptrac layers" from "CI script" but they form a unified enforcement strategy |

## Dependency Graph

```
Controller Code Limits      ──► Thin Controller Enforcement
Controller Action Delegation ──► Thin Controller Enforcement
Controller Dependency Injection ──► Thin Controller Enforcement
                                        │
                                        ├──► Controller Testing Strategies
                                        └──► Static Analysis Best Practices
```

## Follow-up

| Action | Reason |
|--------|--------|
| Create a starter PHPStan rule file with 5 recommended thin-controller rules | Reduces setup barrier for teams adopting enforcement |
| Document a phased rollout plan with timeline estimates | Practical guidance for introducing enforcement |
| Provide a pre-built Deptrac configuration template for Laravel projects | Most teams would adopt enforcement if setup were trivial |
| Create a CI workflow template (GitHub Actions) for thin controller enforcement | Further reduces adoption friction |
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization