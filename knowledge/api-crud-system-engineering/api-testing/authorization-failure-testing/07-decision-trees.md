# Decision Trees — Authorization Failure Testing

## Tree 1: Policy Test Coverage Strategy

**Decision Context**: Which authorization failure scenarios to test per policy — all policy methods vs a representative subset.

**Decision Criteria**:
- Number of policy methods defined
- Policy complexity (role-based vs ownership-based vs both)
- Risk of unauthorized access
- Development velocity needs

**Decision Tree**:
```
Does the policy have role-based AND ownership-based authorization?
├── YES → Test every policy method with both role-denied and ownership-denied scenarios
└── NO → Does the policy only use role-based authorization?
    ├── YES → Test each role that should be denied for each policy method
    └── NO → Does the policy only use ownership-based authorization?
        ├── YES → Test each policy method with wrong-owner user; one test per method
```

**Rationale**: Each policy method (view/create/update/delete/restore/forceDelete) can have different authorization logic. Missing a 403 test for a single method is a security gap.

**Recommended Default**: One 403 test per policy method per denied condition (role + ownership).

**Risks**: Untested policy methods default to `Gate::allow()` behavior, potentially exposing unauthorized access.

---

## Tree 2: Two-User Test Pattern

**Decision Context**: How to set up users for authorization failure tests — separate tests vs paired assertions vs dataset-driven.

**Decision Criteria**:
- Number of user roles to test
- Test readability preference
- Test execution speed requirements

**Decision Tree**:
```
Are you testing 3+ user roles per endpoint?
├── YES → Use PestPHP dataset with roles; it('denies :role from :action', fn($role) => ...)->with('deniedRoles')
└── NO → Are you testing only a single denied condition?
    ├── YES → Use separate tests: test_admin_can_create and test_user_cannot_create (explicit, readable)
    └── NO → Use paired test: create user + create second user with different role; one test covers both success and failure
```

**Rationale**: Datasets reduce boilerplate for many roles. Separate tests are more readable for few roles. Paired tests ensure the success path works alongside the denial.

**Recommended Default**: Separate `test_X_can_Y` and `test_X_cannot_Y` methods for clarity, with PestPHP datasets for 3+ roles.

**Risks**: Paired tests are harder to debug (two assertions fail together). Datasets make test names less descriptive.
