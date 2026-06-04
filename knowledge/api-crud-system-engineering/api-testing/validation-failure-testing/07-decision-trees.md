# Decision Trees — Validation Failure Testing

## Tree 1: Validation Rule Coverage

**Decision Context**: Determining which validation rules to test per form request — exhaustive coverage vs boundary-and-critical-only.

**Decision Criteria**:
- Number of rules per form request
- Rule complexity (simple type rules vs conditional/custom rules)
- Data sensitivity
- Development velocity

**Decision Tree**:
```
Does the field accept financial, PII, or security-critical data?
├── YES → Exhaustive coverage: test every rule on every field, including boundary conditions
└── NO → Is the rule a simple type check (string, integer, boolean)?
    ├── YES → One test per type rule; boundary testing only for string length (min/max) and numeric ranges
    └── NO → Is the rule conditional (required_if, required_with, required_without)?
        ├── YES → Test each conditional combination — these are the most common validation bugs
        └── NO → Is the rule a custom rule object?
            ├── YES → Test the custom rule in isolation (unit test) + one feature-level integration test
            └── NO → One test per rule per field; use datasets for efficiency
```

**Rationale**: Conditional and custom rules have the highest bug rate. Simple type rules are well-tested by the framework. Financial/PII fields need exhaustive coverage.

**Recommended Default**: One feature test per rule per field, using PestPHP datasets for efficiency.

**Risks**: Exhaustive coverage of every rule variant creates a brittle, high-maintenance test suite. Skipping conditional rule testing is the most dangerous gap.

---

## Tree 2: Middleware Interaction Testing

**Decision Context**: Whether to test middleware interactions (TrimStrings, ConvertEmptyStringsToNull) in validation tests.

**Decision Criteria**:
- Historical bugs from middleware interaction
- Framework version (Laravel 11 changed some middleware behavior)
- Form request complexity

**Decision Tree**:
```
Has the team encountered bugs from TrimStrings or ConvertEmptyStringsToNull?
├── YES → Add explicit tests: send whitespace-padded strings (expect trimmed) and empty strings (expect null conversion)
└── NO → Is the form request complex (10+ fields with different types)?
    ├── YES → Test middleware interaction for nullable + string fields (ConvertEmptyStringsToNull changes "" to null)
    └── NO → Skip explicit middleware tests; trust default Laravel behavior
```

**Rationale**: Middleware transformations silently change input before validation reaches the form request. A `nullable|string` field receiving `""` becomes `null` after ConvertEmptyStringsToNull — a common source of validation confusion.

**Recommended Default**: Test middleware interaction for nullable fields and fields with both string and null states.

**Risks**: Untested middleware interactions cause hard-to-debug validation failures where input appears valid but is transformed before validation.
