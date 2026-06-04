# Decision Trees — Layer Isolation Rules

## Tree 1: Strict vs Pragmatic Isolation

**Decision Context**: Choosing between strict layer isolation (all data access through repositories) and pragmatic isolation (services may use Eloquent directly for simple queries).

**Decision Criteria**:
- Application complexity
- Multi-tenancy requirements
- Team size
- Audit and governance requirements

**Decision Tree**:
```
Is the application >100k LOC with multi-tenancy and strict data governance?
├── YES → Strict isolation — all data access through repositories; static analysis enforced
└── NO → Is the application an MVP or prototype?
    ├── YES → No formal isolation rules — introduce as the app matures
    └── NO → Is the team size 10+ developers?
        ├── YES → Strict isolation with documented pragmatic exceptions
        └── NO → Pragmatic isolation — services may use Eloquent directly for simple queries; enforce only critical rules
```

**Rationale**: Strict isolation is justified by complexity, multi-tenancy, and governance requirements. Pragmatic isolation is sufficient for smaller teams and simpler apps.

**Recommended Default**: Pragmatic isolation for teams <10. Strict isolation for enterprise apps with multi-tenancy.

**Risks**: No isolation rules for enterprise apps leads to architecture collapse. Strict isolation for MVPs slows iteration unnecessarily.

---

## Tree 2: Layer Violation Enforcement

**Decision Context**: Choosing the enforcement mechanism for layer isolation rules.

**Decision Criteria**:
- Team discipline level
- Automation infrastructure
- Budget for tooling
- Tolerance for false positives

**Decision Tree**:
```
Is the team large (10+) with varying experience levels?
├── YES → Automated enforcement — PHPStan/Larastan custom rules + architectural tests (Pest/PHPUnit)
└── NO → Is the team experienced with layer isolation and consistent in code review?
    ├── YES → Convention + code review — automated enforcement overhead not justified
    └── NO → Is the application in a regulated industry (finance, healthcare)?
        ├── YES → Full enforcement stack: static analysis + architectural tests + CI pipeline blocking violations
        └── NO → Code review + linting — automated enforcement with 1-2 tools
```

**Rationale**: Automated enforcement scales with team size. Small experienced teams can rely on convention and review.

**Recommended Default**: PHPStan custom rules for controller→model violation detection + architectural tests for critical paths.

**Risks**: No enforcement allows violations to accumulate silently. Over-enforcement with false positives creates tool fatigue and workarounds.
