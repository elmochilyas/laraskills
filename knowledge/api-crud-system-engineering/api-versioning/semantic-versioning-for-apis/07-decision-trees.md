# Decision Trees — Semantic Versioning for APIs

## Tree 1: Version Bump Determination

**Decision Context**: Determining whether a change requires a MAJOR, MINOR, or PATCH version bump.

**Decision Criteria**:
- Change type (breaking, backward-compatible addition, bug fix)
- Consumer impact scope
- OpenAPI diff result

**Decision Tree**:
```
Does the change remove or modify existing contract elements (fields, endpoints, parameters)?
├── YES → MAJOR bump — breaking change: new API version required (new URL or header)
└── NO → Does the change add new contract elements (fields, endpoints, parameters)?
    ├── YES → Is everything new backward-compatible (null defaults, optional parameters)?
    │   ├── YES → MINOR bump — backward-compatible addition within existing version
    │   └── NO → MAJOR bump (hidden breaking change in addition)
    └── NO → Does the change fix a bug without contract changes?
        ├── YES → PATCH bump — transparent to consumers; deploy immediately
        └── NO → Does the change include pre-release features?
            ├── YES → Pre-release identifier: 2.0.0-alpha.1, 2.0.0-beta.1
            └── NO → Review carefully — ambiguous change may need MAJOR
```

**Rationale**: MAJOR = contract break, MINOR = backward-compatible addition, PATCH = internal fix only. Automated OpenAPI diff in CI determines the bump category.

**Recommended Default**: MAJOR for breaking changes, MINOR for backward-compatible additions, PATCH for bug fixes.

**Risks**: Bumping MAJOR for internal refactors creates unnecessary version churn. Bumping MINOR for breaking changes breaks consumer trust.

---

## Tree 2: Version Compatibility Declaration

**Decision Context**: What compatibility promises to make for each version level — documented guarantees per MAJOR, MINOR, PATCH.

**Decision Criteria**:
- Consumer trust requirements
- Internal vs public API
- Maintenance capacity

**Decision Tree**:
```
Is this a public API with third-party consumers?
├── YES → Document explicit guarantees:
│   MAJOR: 12-month notice before version retirement
│   MINOR: Backward-compatible, documented in changelog
│   PATCH: Transparent, no consumer action needed
└── NO → Is this an internal API with few consumers?
    ├── YES → Looser guarantees:
    │   MAJOR: 6-month notice
    │   MINOR: Backward-compatible, changelog entry
    │   PATCH: Transparent
    └── NO → Document guarantees proportional to consumer impact
```

**Rationale**: Public APIs need strong, documented compatibility guarantees. Internal APIs can operate with looser policies but should still document them.

**Recommended Default**: MAJOR: 12-month notice. MINOR: always backward-compatible. PATCH: no consumer impact. Documented in API root endpoint.

**Risks**: Undocumented guarantees leave consumers uncertain. Over-promising (e.g., "never breaking changes") creates unsustainable expectations.
