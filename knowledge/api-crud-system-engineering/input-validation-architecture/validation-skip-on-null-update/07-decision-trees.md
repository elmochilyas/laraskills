# Decision Trees — Validation Skip on Null Update

## Tree 1: Null vs Absent Handling

**Decision Context**: Deciding how to handle null values vs absent fields during partial updates.

**Decision Criteria**:
- Field semantics (null means "clear" vs "not provided")
- Client intent interpretation
- Database nullable column constraints

**Decision Tree**:
```
Does null mean "clear/remove the value" for this field?
├── YES → Accept null as a valid update value — use `nullable` rule, pass null to DB
└── NO → Does null mean "don't update" (same as absent)?
    ├── YES → Convert null to absent before validation — use prepareForValidation() to unset
    └── NO → Is the field not nullable in the database?
        ├── YES → Reject null — rule: `required_without` or reject in after() hook
        └── NO → Accept null — it's a valid value for nullable columns
```

**Rationale**: Distinguish null-as-action (clear the value) from null-as-omission (don't update).

**Recommended Default**: Null clears the value for nullable fields. Null is converted to absent for non-nullable fields.

**Risks**: Treating null as "don't update" when the DB expects nullable causes silent data loss. Treating null as "clear" when the client meant "don't update" clears user data unintentionally.

---

## Tree 2: Null Validation Strategy

**Decision Context**: Choosing validation rules for nullable update fields.

**Decision Criteria**:
- Whether null is explicitly permitted
- Additional validation for non-null values
- Client understanding of field semantics

**Decision Tree**:
```
Is null a valid value for this field in the business domain?
├── YES → Add `nullable` as the first rule — all subsequent rules apply only to non-null values
└── NO → Is the field optional (can be omitted from the request)?
    ├── YES → Use `sometimes` without `nullable` — null will fail validation; field must be absent
    └── NO → Field is required and non-nullable — no `nullable` or `sometimes` needed
```

**Rationale**: `nullable` makes null valid. `sometimes` makes absent valid. Without `nullable`, null fails validation.

**Recommended Default**: Add `nullable` to all optional fields that accept null. Use `sometimes` for optional fields where null is not a valid value.

**Risks**: Using `nullable` on non-nullable DB columns passes null to DB and causes integrity constraint violations. Not using `nullable` on nullable columns rejects legitimate null updates.
