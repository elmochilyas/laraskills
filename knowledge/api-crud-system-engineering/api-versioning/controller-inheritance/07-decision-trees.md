# Decision Trees — Controller Inheritance

## Tree 1: Inheritance vs Composition Decision

**Decision Context**: Whether to use controller inheritance or composition (strategy pattern) for version-specific controller logic.

**Decision Criteria**:
- Override ratio (percentage of methods overridden in version subclasses)
- Depth of behavioral differences between versions
- Team familiarity with inheritance patterns

**Decision Tree**:
```
Are <50% of base controller methods overridden in version subclasses?
├── YES → Inheritance is appropriate — use BaseController + version-specific overrides
└── NO → Does the version differ in more than method signatures (different dependencies, different constructor)?
    ├── YES → Use composition (strategy pattern) — inject version-specific strategies into shared controller
    └── NO → Is the team experienced with inheritance and aware of parent::call pitfalls?
        ├── YES → Inheritance may still work with careful discipline; monitor override ratio
        └── NO → Use composition — safer for teams less experienced with inheritance
```

**Rationale**: Inheritance works well when most behavior is shared. Above 50% override ratio, inheritance becomes a burden with no benefit over composition.

**Recommended Default**: Start with inheritance; refactor to composition when override ratio exceeds 50%.

**Risks**: Deep inheritance chains (Base → V1 → V2) create fragile code. Overriding without `parent::` call causes subtle bugs.

---

## Tree 2: Security-Critical Method Protection

**Decision Context**: Which base controller methods to mark as final to prevent accidental override in version subclasses.

**Decision Criteria**:
- Security impact (auth, throttle, audit)
- Risk of behavior change between versions
- Compliance requirements

**Decision Tree**:
```
Does the method handle authentication, authorization, or rate limiting?
├── YES → Mark as final in base controller; version-specific subclasses cannot override
└── NO → Does the method handle logging, auditing, or security headers?
    ├── YES → Mark as final — consistent behavior across all versions is critical
    └── NO → Does the method handle infrastructure concerns (pagination default, error handling)?
        ├── YES → Consider marking as final unless version-specific behavior is explicitly intended
        └── NO → Protected — safe for version subclasses to override if needed
```

**Rationale**: Security and compliance methods must behave identically across all versions. Infrastructure methods are usually consistent but may have version-specific exceptions.

**Recommended Default**: Auth, throttle, rate limiting, security headers → final. Pagination, error handling, response format → protected with documented override policy.

**Risks**: A version subclass accidentally overriding an auth check creates a critical security vulnerability that may go undetected.
