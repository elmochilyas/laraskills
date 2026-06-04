# Decision Trees — Authorization Error Responses

## Tree 1: 403 vs 404 Strategy for Hidden Resources

**Decision Context**: Choosing whether to return 403 (authenticated but denied) or 404 (pretend resource doesn't exist) for unauthorized resource access.

**Decision Criteria**:
- Resource sensitivity
- Enumeration risk
- API consumer type (internal vs public)
- Consistency with other endpoints

**Decision Tree**:
```
Is the resource sensitive enough that confirming its existence is a security concern?
├── YES → Use 404 — pretend the resource doesn't exist; prevents enumeration
└── NO → Is the endpoint in a public API where enumeration is a realistic threat?
    ├── YES → Use 404 for consistency — some resources may be hidden; uniform response prevents probing
    └── NO → Is the API internal with trusted consumers?
        ├── YES → Use 403 — explicit denial helps debugging
        └── NO → Does the same resource type return 403 on some endpoints and 404 on others?
            ├── YES → Choose one strategy and apply consistently across all endpoints
            └── NO → Use 403 (honest about existence; helps legitimate debugging)
```

**Rationale**: The key rule is consistency — mixing 403/404 for the same resource type enables detection mapping.

**Recommended Default**: Use 403 for internal APIs (explicit, honest). Use 404 for public APIs with enumeration risk.

**Risks**: 403 on all resources confirms existence and enables enumeration. 404 on all resources frustrates debugging and may hide access control bugs.

---

## Tree 2: Error Detail Granularity

**Decision Context**: How much detail to include in the 403 response — required permission vs full policy context.

**Decision Criteria**:
- Permission enumeration risk
- Client remediation needs
- API type (public vs internal)

**Decision Tree**:
```
Is the client a user-facing application that needs to suggest remediation?
├── YES → Include `detail.required_permission` with the specific policy name
│   Never include: user's current roles, permissions list, or comparison details
└── NO → Is the API public with third-party consumers?
    ├── YES → Include `detail.required_permission` at the role level, not permission level
    │   Example: "editor" role, not "posts.update.others" permission
    └── NO → Include generic permission name only — no hierarchy or comparison details
```

**Rationale**: Required permission helps clients guide users, but never expose the user's current permissions (enables permission enumeration).

**Recommended Default**: Include `detail.required_permission` with the policy/ability name. Never list user's current roles or permissions.

**Risks**: Too much detail enables permission mapping. Too little detail frustrates legitimate client remediation.
