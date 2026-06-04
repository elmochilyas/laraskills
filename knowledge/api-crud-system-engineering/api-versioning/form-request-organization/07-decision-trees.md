# Decision Trees — Form Request Organization

## Tree 1: Form Request Versioning Strategy

**Decision Context**: Whether to use versioned form requests (separate classes per version) or shared form requests with version-conditional rules.

**Decision Criteria**:
- Rule difference scope between versions
- Number of active versions
- Authorization logic differences

**Decision Tree**:
```
Do versions have different required fields or validation rules?
├── YES → Do versions differ in >30% of rules?
│   ├── YES → Separate form request classes per version (V1\StorePostRequest, V2\StorePostRequest)
│   └── NO → Inheritance: V2 extends V1, overrides rules() to add/remove keys
└── NO → Do versions have different authorization logic (authorize())?
    ├── YES → Separate form requests per version (authorization is security-critical)
    └── NO → Shared form request with version-conditional rules where needed
```

**Rationale**: Separate form requests are clearer when rules diverge significantly. Inheritance works for small differences. Shared requests with conditionals are acceptable only when authorization and most rules are identical.

**Recommended Default**: Per-version form request classes with inheritance for progressive rule enhancement.

**Risks**: Rule inheritance coupling — parent rule change silently affects child versions. Authorization gap — V2 removes a check present in V1.

---

## Tree 2: Rule Inheritance Safety

**Decision Context**: How to safely inherit form request rules between versions without accidental rule leak.

**Decision Criteria**:
- Rule change direction (addition vs removal vs modification)
- Test coverage per version
- Security sensitivity of rules

**Decision Tree**:
```
Is the V2 adding new rules compared to V1?
├── YES → Safe inheritance: V2 extends V1, copies parent::rules() and adds new keys
└── NO → Is the V2 removing or modifying rules that exist in V1?
    ├── YES → Risky inheritance: V2 extends V1 but must unset or override parent rules
    │   Rule: Never modify parent::rules() directly — always copy then modify
    │   Test: Independent rule tests per version to catch parent drift
    └── NO → Is the V2 relaxing V1 rules (required → optional)?
        ├── YES → Override rules() completely in V2 (don't reuse parent's required rules)
        └── NO → Independent rules() in V2 with no parent call
```

**Rationale**: Rule removal is the riskiest inheritance operation because parent rule changes silently affect children. Independent rule arrays in V2 prevent accidental rule propagation.

**Recommended Default**: V2 `rules()` copies parent and adds new keys for additions; completely overrides `rules()` when removing or relaxing V1 rules.

**Risks**: A V1 security rule change (adding `required|exists:users,id`) silently propagates to V2 via `parent::rules()` call.
