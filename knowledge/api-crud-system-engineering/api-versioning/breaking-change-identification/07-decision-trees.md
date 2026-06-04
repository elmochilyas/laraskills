# Decision Trees — Breaking Change Identification

## Tree 1: Breaking Change Classification

**Decision Context**: Categorizing a detected change to determine if it's breaking and what action is required.

**Decision Criteria**:
- Consumer impact scope
- Change category (field, behavior, contract, semantic)
- Detection method (automated vs manual)

**Decision Tree**:
```
Does the change remove, rename, or change the type of an existing field?
├── YES → Field breaking change — block CI, require version bump or rollback
└── NO → Does the change modify endpoint behavior (status code, error format, timing)?
    ├── YES → Behavior breaking change — block CI, require version bump
    └── NO → Does the change remove an endpoint or change its authentication requirement?
        ├── YES → Contract breaking change — block CI, require version bump
        └── NO → Does the change alter the meaning of an existing field without changing its structure?
            ├── YES → Semantic breaking change — hardest to detect; requires manual review
            └── NO → Is the change a purely backward-compatible addition?
                ├── YES → Backward-compatible — proceed with MINOR/PATCH
                └── NO → Review carefully — may be an edge case breaking change
```

**Rationale**: Automated detection covers field, behavior, and contract changes. Semantic changes (same structure, different meaning) require manual review.

**Recommended Default**: Automated OpenAPI spec diff in CI + manual breaking change checklist for every PR.

**Risks**: Semantic changes are the most dangerous because they pass automated checks but break consumer business logic.

---

## Tree 2: Breaking Change Response

**Decision Context**: What to do when a breaking change is detected — block, allow with warning, or fast-track.

**Decision Criteria**:
- Change intentionality
- Consumer count and impact
- Alternative timeline

**Decision Tree**:
```
Is the breaking change intentional (planned as part of a new version)?
├── YES → Track in breaking change registry; document migration path; proceed with new version
└── NO → Can the change be made backward-compatible with additional work?
    ├── YES → Roll back the change; implement backward-compatible approach; re-review
    └── NO → Is there a business-critical reason to proceed despite the break?
        ├── YES → VP-level approval required; create ADR; expedite migration guide; short deprecation window
        └── NO → Block CI; require change to be backward-compatible or deferred
```

**Rationale**: Breaking changes without version bump are errors. Business-critical exceptions require executive approval and documented mitigation.

**Recommended Default**: Block CI on any breaking change that isn't part of a planned new version.

**Risks**: Breaking changes without proper process erode consumer trust and increase support burden.
