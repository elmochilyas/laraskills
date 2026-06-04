# Decision Trees — Conditional Validation Patterns

## Tree 1: Conditional Strategy Selection

**Decision Context**: Choosing the right conditional validation approach for a given scenario.

**Decision Criteria**:
- Condition complexity (simple field presence vs multi-field logic)
- Number of conditional branches
- Need for cross-field checks

**Decision Tree**:
```
Is the condition based on another field's value (if type == 'business', require company_name)?
├── YES → Use Rule::when() for simple conditions; use required_if for presence-only
└── NO → Is the condition based on multiple fields or complex logic?
    ├── YES → Use withValidator() + after() hook — full PHP logic available
    └── NO → Is the condition about field presence (if field present, validate it)?
        ├── YES → Use `sometimes` — validates field only when present in input
        └── NO → Is the condition about mutual exclusion (either A or B, not both)?
            ├── YES → Use `prohibited_if` for simple exclusion; after() for complex
            └── NO → Use Rule::when() (default — most flexible for simple conditions)
```

**Rationale**: `Rule::when()` handles simple conditions elegantly. `after()` handles complex multi-field logic. `sometimes` handles presence-based conditions.

**Recommended Default**: `Rule::when()` for simple binary conditions. `after()` for complex cross-field logic.

**Risks**: Using `after()` for simple conditions adds unnecessary complexity. Using `Rule::when()` for complex conditions creates unreadable nesting.

---

## Tree 2: `sometimes` vs `nullable`

**Decision Context**: Choosing between `sometimes` (validate only if present) and `nullable` (allow null).

**Decision Criteria**:
- Whether the client should be able to omit the field
- Whether the client should be able to send null
- Whether additional rules should apply when the field IS present

**Decision Tree**:
```
Should the client be able to omit the field entirely?
├── YES → Use `sometimes` — field is optional; no validation if absent
└── NO → Should the client be able to send null explicitly?
    ├── YES → Use `nullable` — null is a valid value; additional rules apply to non-null values
    └── NO → Field is required — neither `sometimes` nor `nullable` needed
```

**Rationale**: `sometimes` skips validation when absent. `nullable` allows null as a valid value. They serve different purposes and are sometimes used together.

**Recommended Default**: Use `sometimes` for optional fields. Use `nullable` for fields that accept null.

**Risks**: Using `sometimes` when the field should be required allows silent omission. Using `nullable` without `sometimes` requires the field to be present but allows null.
