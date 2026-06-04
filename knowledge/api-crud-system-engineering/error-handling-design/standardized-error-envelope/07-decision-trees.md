# Decision Trees — Standardized Error Envelope

## Tree 1: Envelope Adoption Decision

**Decision Context**: Whether to adopt a standardized error envelope for an API.

**Decision Criteria**:
- Client count and type
- Error response consistency requirement
- Migration cost from existing responses

**Decision Tree**:
```
Does the API serve multiple programmatic clients (mobile apps, SPAs, third-party)?
├── YES → Adopt standardized envelope — all clients parse errors the same way
└── NO → Is the API internal with a single consumer?
    ├── YES → Standardized envelope still recommended — future-proofing and consistency
    └── NO → Is the API an MVP or prototype?
        ├── YES → Defer envelope standardization — adopt when the first external consumer arrives
        └── NO → Adopt standardized envelope — consistency is always valuable
```

**Rationale**: The envelope benefits grow with consumer count but provide value even for single-consumer APIs (consistent debugging, monitoring).

**Recommended Default**: Adopt standardized envelope from the start. Much harder to retrofit than to build in.

**Risks**: Retrofitting an envelope to an API with existing error formats requires versioning or breaking changes. Adopting too early for a throwaway prototype is unnecessary ceremony.

---

## Tree 2: Envelope Field Expansion

**Decision Context**: Whether to add new fields to the error envelope.

**Decision Criteria**:
- Backward compatibility (do existing clients break?)
- Field necessity for client handling
- Alternative approaches (detail object, new envelope version)

**Decision Tree**:
```
Does the new field provide information that clients cannot derive from existing fields?
├── YES → Is the field optional (clients without the field continue working)?
│   ├── YES → Add to `detail` object — backward compatible, no envelope shape change
│   └── NO → Is the field necessary at the top level?
│       ├── YES → Add as a new optional top-level field — existing clients ignore unknown fields
│       └── NO → Add to `detail` — keeps top-level envelope minimal
└── NO → Do not add the field — existing fields already cover the need
```

**Rationale**: New fields should be added to `detail` when possible (backward compatible). New top-level fields require client updates but are safe if added (existing clients ignore unknown fields).

**Recommended Default**: Add new fields to `detail` by default. Only add top-level fields when the information is essential for every error response.

**Risks**: Adding required fields breaks existing clients. Adding too many top-level fields pollutes the envelope namespace.
