# Decision Trees — Custom Validation Rules

## Tree 1: Rule Class vs Closure

**Decision Context**: Choosing between a Rule class and a closure for custom validation logic.

**Decision Criteria**:
- Reusability (used in multiple endpoints)
- Dependency requirements
- Testability needs
- Route caching compatibility

**Decision Tree**:
```
Is the validation logic used in 2+ endpoints?
├── YES → Use Rule class — reusable, testable, dependency-injectable
└── NO → Does the logic require injected dependencies (repositories, services)?
    ├── YES → Use Rule class — closures can't have constructor injection
    └── NO → Is the logic trivial (<5 lines, no conditions)?
        ├── YES → Use closure — no extra file needed
        └── NO → Is route caching enabled?
            ├── YES → Use Rule class — closures can't be serialized
            └── NO → Use closure — simple one-off validation
```

**Rationale**: Rule classes are preferred for any logic that might be reused, needs dependencies, or needs testing. Closures are for trivial one-off cases.

**Recommended Default**: Rule class by default. Closure only for trivial, non-reusable, dependency-free logic.

**Risks**: Creating Rule classes for truly one-off trivial validation adds file noise. Using closures for reusable logic creates duplication.

---

## Tree 2: $fail vs Return Bool

**Decision Context**: Whether to call `$fail()` or return a boolean from a custom rule.

**Decision Criteria**:
- Laravel version (new ValidationRule interface vs old rule)
- Multiple error messages needed
- Early termination requirements

**Decision Tree**:
```
Is the rule using the modern ValidationRule interface (Laravel 10+) with __invoke?
├── YES → Always call $fail() for invalid values — can call multiple times for multiple errors
└── NO → Is the rule using the old passes() interface (legacy)?
    ├── YES → Return bool — old API requires boolean return
    └── NO → Note: modern rules should never return bool; always call $fail()
```

**Rationale**: `$fail()` provides more control (multiple errors, immediate halt) and is the modern Laravel convention.

**Recommended Default**: Use the modern ValidationRule interface with `$fail()`. Never return bool from a modern rule.

**Risks**: Using old `passes()` API returns bool, which is deprecated. Calling `$fail()` from a non-modern rule may not work as expected.
