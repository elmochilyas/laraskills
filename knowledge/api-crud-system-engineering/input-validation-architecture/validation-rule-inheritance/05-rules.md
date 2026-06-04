# Validation Rule Inheritance — Rules

## Metadata
| Field | Value |
|---|---|
| Domain | api-crud-system-engineering |
| Subdomain | input-validation-architecture |
| Knowledge Unit | validation-rule-inheritance |

## Rules

### Rule: Inherit When Rules Are 80%+ Similar
- **Condition:** When store and update validation rules are mostly identical
- **Action:** Extract shared rules into a base FormRequest. Override specific rules in store/update child classes.
- **Consequence:** Single source of truth for common rules; differences are explicit in child classes.
- **Enforcement:** Review flags duplicated rule sets between store and update requests.

### Rule: Separate Rules When They Diverge Significantly
- **Condition:** When store and update rules differ in field sets, conditions, or structure
- **Action:** Keep store and update rules in separate FormRequests with no inheritance.
- **Consequence:** Each request class is self-contained; no confusing conditional logic in base class.
- **Enforcement:** Review flags inheritance where more rules are overridden than inherited.

### Rule: Use Traits for 3+ Shared Rule Groups
- **Condition:** When a rule group (address, contact, billing) is shared by 3+ unrelated FormRequests
- **Action:** Extract the rule group into a trait. Add a method returning the rules array. Use trait in each FormRequest.
- **Consequence:** Rule group is defined once; each FormRequest composes only the traits it needs.
- **Enforcement:** Review flags rule array duplication across 3+ FormRequests.

### Rule: Use `sometimes` for All Update Rules
- **Condition:** When defining validation rules for update (PUT/PATCH) endpoints
- **Action:** Prefix update rules with `sometimes` to indicate they only apply when the field is present.
- **Consequence:** Partial updates work correctly; absent fields are not validated.
- **Enforcement:** Tests verify partial updates succeed with only changed fields.

### Rule: Keep Inheritance at One Level
- **Condition:** When designing FormRequest inheritance hierarchy
- **Action:** Limit to one level of inheritance (base → concrete). Avoid chains of 3+ levels.
- **Consequence:** Rule resolution is predictable; tracing rule sources is straightforward.
- **Enforcement:** Review flags FormRequests extending from non-base classes.
