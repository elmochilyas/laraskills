# Decision Trees — Backward-Compatible Changes

## Tree 1: Change Classification (Breaking vs Backward-Compatible)

**Decision Context**: Determining whether a proposed API change is backward-compatible or breaking — whether to apply within the current version or trigger a new version.

**Decision Criteria**:
- Field existence (removal, rename, addition)
- Field type or semantics
- Required vs optional
- Default value behavior

**Decision Tree**:
```
Does the change remove or rename an existing field?
├── YES → Breaking change — requires new version
└── NO → Does the change modify the type or semantics of an existing field?
    ├── YES → Breaking change — requires new version
    └── NO → Does the change add a new required field or parameter?
        ├── YES → Breaking change — use nullable|sometimes with default instead
        └── NO → Does the change relax existing validation (required → optional)?
            ├── YES → Backward-compatible — apply within current version
            └── NO → Does the change add a new optional field or endpoint?
                ├── YES → Backward-compatible — add with null default or when() condition
                └── NO → Does the change add new enum values?
                    ├── YES → Backward-compatible if append-only (never remove/reorder)
                    └── NO → Review carefully — may be a breaking change in disguise
```

**Rationale**: Adding with null defaults or conditionals is almost always backward-compatible. Removing, renaming, or changing semantics is always breaking.

**Recommended Default**: Add new fields with `null` defaults using `$this->when()` in API resources.

**Risks**: New query parameters without default behavior break existing clients. Enum additions break clients using exhaustive switch statements.

---

## Tree 2: Enum Expansion Safety

**Decision Context**: Whether adding new enum values is safe for existing consumers.

**Decision Criteria**:
- Consumer language patterns (exhaustive switch vs. if-else)
- API documentation of enum extension policy
- Error handling for unrecognized values

**Decision Tree**:
```
Does the API documentation explicitly state "enum values may be added at any time"?
├── YES → Append-only expansion is backward-compatible; existing consumers should handle unknown values gracefully
└── NO → Is there evidence that consumers use exhaustive switch statements on this enum?
    ├── YES → Breaking change — new version required or long deprecation window with consumer migration
    └── NO → Append-only expansion is likely safe but document the change prominently
```

**Rationale**: Consumers using exhaustive switch statements break when new enum values appear. Documenting the policy of append-only expansion sets expectations.

**Recommended Default**: Append-only enum expansion with documented policy. Use `tryFrom()` instead of `from()` in server code to handle future values gracefully.

**Risks**: Silent breakage of consumer error handling logic when unexpected enum values trigger default error branches.
