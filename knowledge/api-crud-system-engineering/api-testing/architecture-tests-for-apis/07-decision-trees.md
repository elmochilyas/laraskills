# Decision Trees — Architecture Tests for APIs

## Tree 1: Architecture Rule Granularity

**Decision Context**: Choosing the granularity of architecture tests — broad namespace-level rules vs class-level vs file-level enforcement.

**Decision Criteria**:
- Project size and team count
- Architecture strictness requirements
- Exception frequency

**Decision Tree**:
```
Is this a large project (20+) controllers across multiple modules?
├── YES → Namespace-level rules: "All classes in App\Http\Controllers\Api must extend Controller"
└── NO → Is the architecture layered with clear boundaries (controllers → services → repositories)?
    ├── YES → Add dependency-layer rules: "Services may only use Repositories, not Eloquent directly"
    └── NO → Is there a single architectural convention to enforce?
        ├── YES → Add that one rule and stop; avoid over-testing
        └── NO → Add namespace + inheritance rules only; extend as conventions solidify
```

**Rationale**: Architecture tests should enforce non-obvious conventions, not duplicate what's visible from the directory structure. Start narrow and expand.

**Recommended Default**: Start with inheritance rules (controllers, form requests) and namespace enforcement. Add dependency rules as the project grows.

**Risks**: Too many rules create maintenance burden. Too few rules let architecture drift. Exception mechanisms are essential (third-party packages, generated code).

---

## Tree 2: Test Coverage Enforcement

**Decision Context**: Whether to enforce test coverage via architecture tests — ensuring every controller has a corresponding test file.

**Decision Criteria**:
- CI reliability requirements
- Team size and onboarding needs
- Code review process maturity

**Decision Tree**:
```
Is every new endpoint required to have tests before merging?
├── YES → Enforce via architecture test: expect('App\Http\Controllers\Api')->toHaveTestFile()
└── NO → Is the team small (<5) with informal code review?
    ├── YES → Skip architecture enforcement; rely on code review discipline
    └── NO → Is there a documented API test coverage standard?
        ├── YES → Enforce test file existence via architecture test; add CI gate
        └── NO → Document standard first; add architecture enforcement as a second step
```

**Rationale**: Test coverage architecture tests are the most effective way to enforce testing standards — they fail CI before anyone reviews the PR.

**Recommended Default**: Enforce that every API controller has a corresponding test file.

**Risks**: File-existence checks don't verify test quality. Pair with code review for assertion quality.
