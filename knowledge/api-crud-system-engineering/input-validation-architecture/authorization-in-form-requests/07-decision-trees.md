# Decision Trees — Authorization in Form Requests

## Tree 1: authorize() Complexity Decision

**Decision Context**: Whether to implement authorization logic directly in `authorize()` or delegate to a Policy.

**Decision Criteria**:
- Logic complexity
- Reuse potential across controllers
- Number of roles/permissions involved

**Decision Tree**:
```
Is the authorization logic a simple boolean check (user is admin, owns the resource)?
├── YES → Keep in authorize() with a single Gate/Policy call: `$this->user()->can('update', $post)`
└── NO → Does the logic involve multiple conditions, roles, or runtime data?
    ├── YES → Delegate to a Policy class — testable, reusable, single responsibility
    └── NO → Does the same authorization logic apply to multiple endpoints?
        ├── YES → Extract to a Policy — avoids duplication across endpoints
        └── NO → Keep in authorize() — simple enough for inline, no reuse needed
```

**Rationale**: Simple checks stay in authorize(). Complex logic or reuse needs a Policy. The authorize() method should be a single-line delegation when possible.

**Recommended Default**: Delegate to Policy via `$this->user()->can()`. Only inline for trivial checks.

**Risks**: Complex inline authorization is untestable and unreusable. Single-line delegate to Policy is testable and reusable.

---

## Tree 2: 403 vs 404 Strategy for Authorization Failures

**Decision Context**: Whether to return 403 or 404 when authorization fails in `authorize()`.

**Decision Criteria**:
- Resource sensitivity
- Enumeration risk
- Consistency requirement

**Decision Tree**:
```
Is the resource sensitive enough that its existence should be hidden?
├── YES → Return 404 via failedAuthorization() — hide the resource entirely
└── NO → Is enumeration a realistic threat?
    ├── YES → Return 404 — consistent "not found" prevents existence probing
    └── NO → Return 403 — explicit "forbidden" helps legitimate client debugging
```

**Rationale**: 403 confirms resource existence. 404 hides it. Choose based on sensitivity and enumeration risk.

**Recommended Default**: Return 403 for most resources. Return 404 for sensitive resources where existence is confidential.

**Risks**: Returning 404 for all failed authorizations confuses debugging. Returning 403 for hidden resources confirms their existence.
