# Decision Trees — Form Request Unit Testing

## Tree 1: Unit Test vs Feature Test for Validation

**Decision Context**: Whether to test validation rules at the unit level (form request in isolation) or feature level (HTTP request → controller) — or both.

**Decision Criteria**:
- Form request complexity (simple vs conditional rules)
- Performance requirements
- Route wiring confidence needed

**Decision Tree**:
```
Does the form request have conditional rules (required_if, required_with, custom logic in rules())?
├── YES → Unit test primary (faster feedback for conditional logic) + one feature test per form request for wiring verification
└── NO → Is the form request a simple pass-through with only type rules?
    ├── YES → Feature test only (unit test adds no value for simple rules)
    └── NO → Unit test rules() return value + one feature test per endpoint
```

**Rationale**: Conditional rules benefit most from unit testing (fast iteration). Simple type rules are adequately covered by feature tests. Always include at least one feature test per form request to verify routing.

**Recommended Default**: Unit test rules() and authorize() for complex form requests; feature test for wiring verification.

**Risks**: Skipping feature testing for form requests misses route-to-request wiring bugs. Skipping unit testing for complex logic makes iteration slow.

---

## Tree 2: Authorize Method Testing

**Decision Context**: How to test the authorize() method in form requests — user resolver setup and role permutations.

**Decision Criteria**:
- Authorization complexity (role-based, permission-based, ownership)
- User state dependencies

**Decision Tree**:
```
Does authorize() check user roles (admin vs user)?
├── YES → Test with each role: setUserResolver for admin (assertTrue), for user (assertFalse for admin-only actions)
└── NO → Does authorize() check resource ownership?
    ├── YES → Mock the route parameter resolution or pass the resource; test owner (true) and non-owner (false)
    └── NO → Does authorize() always return true (no authorization in form request)?
        ├── YES → One test asserting authorize() returns true; authorization handled in controller/policy
        └── NO → Test all boolean paths through authorize()
```

**Rationale**: The `authorize()` method is the most commonly overlooked form request method. Untested authorization in form requests creates security gaps.

**Recommended Default**: Test `authorize()` with each user state that produces a different boolean result.

**Risks**: Assuming `authorize()` returns true without testing may allow unauthorized access when logic changes.
