# Skill: Apply Declarative Conditional Validation Rules

## Purpose
Use built-in declarative rules (`required_if`, `prohibited_if`, `exclude_if`) to conditionally apply validation constraints based on other field values.

## When To Use
- Simple conditions where a field's requirement depends on another field's value
- Mutually exclusive field scenarios (use `prohibited_if`)
- Conditional field removal from validated data (use `exclude_if`/`exclude_unless`)
- Forms with 1-2 conditional field relationships

## When NOT To Use
- Complex conditions involving computed values, database lookups, or multiple fields
- Conditions that depend on validated (not raw) values of other fields
- Scenarios where separate FormRequests per condition are clearer

## Prerequisites
- FormRequest class with `rules()` method
- Understanding of the available declarative conditional rules

## Inputs
- Request input data containing the condition-triggering fields
- Field values to conditionally validate

## Workflow
1. Identify the condition field and its expected value(s)
2. Choose the appropriate declarative rule:
   - `required_if:field,value` — field required when other field equals value
   - `required_unless:field,value` — field required unless other field equals value
   - `required_with:field` — field required when other field is present
   - `prohibited_if:field,value` — field must be absent when other field equals value
   - `exclude_if:field,value` — remove field from validated data when condition met
   - `exclude_unless:field,value` — keep field only when condition met
3. Add the rule to the field's rule array in string or array syntax
4. Use multiple values for OR logic: `required_if:field,val1,val2`
5. Test each conditional path (condition true, condition false)

## Validation Checklist
- [ ] Declarative rules used instead of verbose `ConditionalRules::when()` or `sometimes()` for simple conditions
- [ ] Correct rule chosen (`required_if` vs `prohibited_if` vs `exclude_if`)
- [ ] Field names in conditions match actual input field names
- [ ] Multiple values use correct OR syntax
- [ ] Tests cover all conditional paths
- [ ] No deeply nested conditional rule chains (max 2 conditions per field)

## Common Failures
- Using `exclude_if` when `prohibited_if` is needed (field silently removed vs error)
- Field name typos in condition parameters causing rules to never fire
- Overwriting `required_if` values in array syntax — last rule wins
- Over-complicating with `ConditionalRules::when()` when a simple declarative rule suffices

## Decision Points
- Use `required_if` when the field is needed under condition vs `prohibited_if` when field must be absent
- Use `exclude_if` to silently omit vs `required_if` to require under condition
- Use separate FormRequests when conditional logic affects 50%+ of rules

## Performance Considerations
- Declarative rules use simple string comparisons — negligible overhead
- `exclude_if` triggers `shouldBeExcluded()` check in the validator loop — minimal cost
- No callback or closure overhead — evaluated at parse time

## Security Considerations
- Conditional rules determine field validity, not authorization — use `authorize()` for access control
- `exclude_if` prevents unwanted fields from appearing in validated data — use for security-sensitive optional fields
- Do not use conditional rules for user role-based field requirements — use separate FormRequests

## Related Rules
- Rule 1: Use Declarative Rules for Simple Field-Dependent Conditions
- Rule 4: Avoid Deep Nesting of Conditional Rules
- Rule 6: Use exclude_if / exclude_unless for Conditional Field Removal

## Related Skills
- Apply Complex Conditional Validation Using ConditionalRules and sometimes
- Implement Cross-Field Validation Using withValidator and after

## Success Criteria
- Field requirements change correctly based on other field values
- `prohibited_if` rejects requests with mutually exclusive fields
- `exclude_if` correctly removes fields from validated data
- No false validation errors on conditionally optional fields
- All conditional paths are tested

---

# Skill: Apply Complex Conditional Validation Using ConditionalRules and sometimes

## Purpose
Use `ConditionalRules::when()` and `sometimes()` for conditional validation rules that depend on request-level state or validated values of other fields.

## When To Use
- Conditions based on request method (create vs update rules), authenticated user, or input state
- Conditions that depend on validated values of other fields (use `sometimes()`)
- Complex conditions involving computed values or external data
- When declarative rules cannot express the condition

## When NOT To Use
- Simple field-dependent conditions (use `required_if`, `prohibited_if`)
- Scenarios where separate FormRequests per condition are clearer
- Authorization-dependent rules (use `authorize()`)

## Prerequisites
- FormRequest class with `rules()` method
- Understanding of parse-time vs runtime validation

## Inputs
- Request state (method, user, input data)
- Validated values of other fields (for `sometimes()`)

## Workflow
1. Determine whether the condition depends on raw input or validated values
2. For conditions on raw input/request state, use `ConditionalRules::when()` in the `rules()` array:
   - First argument: condition closure returning bool
   - Second argument: rules array if condition is true
   - Third argument: rules array if condition is false (optional)
3. For conditions on validated values, use `sometimes()` inside `withValidator()`:
   - First argument: field name
   - Second argument: rule(s) to apply conditionally
   - Third argument: closure receiving `Input` instance
4. Extract complex conditions into named methods for readability
5. Test each conditional path thoroughly

## Validation Checklist
- [ ] `ConditionalRules::when()` used for conditions on raw input/request state
- [ ] `sometimes()` used for conditions on validated field values
- [ ] Conditions are readable and not deeply nested
- [ ] Complex conditions extracted into separate methods
- [ ] Tests cover all conditional branches
- [ ] No mixing of `ConditionalRules::when()` with `sometimes()` incorrectly

## Common Failures
- Using `sometimes()` when condition depends on raw input (wasteful, fires during validation loop)
- Using `ConditionalRules::when()` when condition depends on validated values (condition sees unvalidated data)
- Overwriting conditional rules accidentally in array merging
- Creating hard-to-read nested conditions

## Decision Points
- Use `ConditionalRules::when()` for conditions evaluated at parse time (request method, user, raw input)
- Use `sometimes()` for conditions evaluated during validation (validated field values)
- Use separate FormRequests when conditions affect more than 50% of rules

## Performance Considerations
- `ConditionalRules::when()` evaluates at parse time — negligible overhead
- `sometimes()` callbacks fire during the `passes()` loop — keep lightweight
- Avoid database queries in conditional condition closures

## Security Considerations
- Conditional rules apply to validation, not authorization — do not use for access control
- Ensure conditions don't introduce validation bypass paths
- Conditions based on user roles should use separate FormRequests, not conditional rules

## Related Rules
- Rule 2: Use ConditionalRules::when() for Complex Conditions on Input State
- Rule 3: Use sometimes() Inside withValidator() for Conditions on Validated Values
- Rule 5: Use Separate FormRequests When Rules Differ Dramatically

## Related Skills
- Apply Declarative Conditional Validation Rules
- Implement Cross-Field Validation Using withValidator and after

## Success Criteria
- Conditional rules fire correctly based on input state or validated values
- No validation bypass occurs through incorrect condition evaluation
- Each condition path is tested and produces expected results
- Rules remain readable and maintainable
