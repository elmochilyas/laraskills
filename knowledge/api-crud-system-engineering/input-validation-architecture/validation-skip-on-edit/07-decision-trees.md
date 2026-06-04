# Decision Trees — Validation Skip on Edit

## Tree 1: Skip Strategy Selection

**Decision Context**: Whether to skip validation for unchanged fields during update.

**Decision Criteria**:
- Payload size (small vs large forms)
- Database query cost
- Client sending behavior

**Decision Tree**:
```
Does the client send only changed fields (PATCH semantics, partial update)?
├── YES → Use `sometimes` — validate only sent fields; skip validation for omitted fields
└── NO → Does the client send all fields (PUT semantics, full update)?
    ├── YES → Is skipping validation for unchanged fields important (unique, exists checks)?
    │   ├── YES → Use custom logic: compare input with DB, skip unchanged field validation
    │   └── NO → Validate all fields — simpler, no need for skip logic
    └── NO → Use `sometimes` — safe default for any partial update scenario
```

**Rationale**: `sometimes` handles sent-only validation. Full PUT with skip logic is for expensive checks on unchanged data.

**Recommended Default**: `sometimes` for all update FormRequests. Full PUT clients validate all fields unless skipping is justified.

**Risks**: `sometimes` validates all sent fields even if unchanged — wasteful for full PUT. Custom skip logic adds complexity and may skip validations unintentionally.

---

## Tree 2: Unique Rule Ignoring Current Model

**Decision Context**: How to handle unique validation during update (ignoring the current record).

**Decision Criteria**:
- Field being validated (email, slug — uniqueness matters)
- Whether the field is being changed
- Model identification

**Decision Tree**:
```
Does the field require unique validation (email, username, slug)?
├── YES → Is the field being updated (present in input and different from current)?
│   ├── YES → Use Rule::unique('table')->ignore($this->route('model')) — ignore current record
│   └── NO → Field not being updated — no unique validation needed; `sometimes` skips it
└── NO → No unique validation — standard validation rules apply
```

**Rationale**: Unique rule must ignore the current record during update to prevent false positives.

**Recommended Default**: Always use `Rule::unique()->ignore($this->route('model'))` for update unique fields.

**Risks**: Not ignoring the current record causes false unique failures. Ignoring the wrong ID (wrong route parameter) allows duplicates.
