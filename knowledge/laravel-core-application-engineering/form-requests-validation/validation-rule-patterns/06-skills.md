# Skill: Write Validation Rules Using Array Syntax with Rule Objects

## Purpose
Use array syntax for validation rules to support Rule objects, custom rules, IDE autocompletion, and complex patterns that pipe-delimited strings cannot represent.

## When To Use
- Rules that include `Rule::unique()`, `Rule::exists()`, or other Rule objects
- Rules with regex patterns (prevents comma-splitting issues)
- Custom invokable rule classes
- Rules with 3+ constraints per field
- Any FormRequest or Validator context

## When NOT To Use
- Trivial single-rule constraints like `'required'` or `'string'`
- When the team standardizes on pipe-delimited strings for simple rules

## Prerequisites
- FormRequest or Validator instance
- Understanding of available Rule objects and custom rules

## Inputs
- Rule definitions per field
- Rule objects (`Rule::unique()`, `Rule::exists()`, custom rules)

## Workflow
1. Define rules as arrays instead of pipe-delimited strings
2. Include string rules as array elements: `['required', 'email', 'max:255']`
3. Add Rule objects directly: `['required', Rule::unique('users')]`
4. Add custom invokable rules with `new` keyword: `['required', new ValidPostalCode]`
5. For `Rule::unique()` on update requests, chain `->ignore($modelId)`
6. For `Rule::exists()`, specify table and column: `Rule::exists('roles', 'id')`
7. Add `bail` as the first element for dependent rules: `['bail', 'required', 'string']`
8. Add regex patterns as string elements with the regex prefix

## Validation Checklist
- [ ] Array syntax used instead of pipe-delimited strings for complex rules
- [ ] `Rule::unique()->ignore()` used on update requests
- [ ] Regex rules in array syntax to prevent comma-splitting
- [ ] Custom rules added with `new` keyword in array
- [ ] `bail` used on attributes with dependent rules
- [ ] `Rule::exists()` used for foreign key validation
- [ ] No Rule objects in pipe-delimited strings
- [ ] Table/column names in `Rule::unique`/`Rule::exists` are correct

## Common Failures
- Using pipe-delimited strings with Rule objects — Rule objects silently ignored
- Missing `->ignore()` on `Rule::unique()` for updates — false unique errors
- Regex patterns with commas in pipe-delimited strings — broken pattern
- Not using `Rule::exists()` for foreign keys — manual DB queries instead
- Not placing `bail` as the first rule element — other rules still execute after failure

## Decision Points
- Use string syntax for simple 1-2 rule constraints vs array for complex rules
- Use `Rule::unique()->ignore($id)` vs `Rule::unique()->where()` for conditional uniqueness
- Use `bail` per-attribute vs `stopOnFirstFailure` per-request

## Performance Considerations
- Array syntax parsing is negligible (~0.01ms per rule)
- `bail` improves performance by skipping remaining rules on first failure
- `Rule::unique()` and `Rule::exists()` execute lazy database queries during validation
- Wildcard rules (`items.*.name`) expand to per-element rules — can be many

## Security Considerations
- `Rule::unique()` and `Rule::exists()` use parameterized queries — SQL injection safe
- Regex patterns must not have ReDoS vulnerabilities — test pattern complexity
- Validation rules should never execute user-controlled callbacks
- `Rule::unique()->ignore()` must use the model ID from route binding (trusted), not user input

## Related Rules
- Rule 1: Prefer Array Syntax for Validation Rules
- Rule 2: Always Use Rule::unique()->ignore() on Update Requests
- Rule 3: Use bail on Dependent Rules for Performance
- Rule 4: Use Array Syntax for Regex Rules to Prevent Comma-Splitting
- Rule 5: Use Rule::exists() for Foreign Key Validation
- Rule 6: Add bail or stopOnFirstFailure Strategically

## Related Skills
- Create and Use Invokable Custom Validation Rules
- Apply Declarative Conditional Validation Rules

## Success Criteria
- All rules are correctly parsed and applied
- Rule objects work correctly in array syntax
- `Rule::unique()` correctly ignores current record on updates
- Regex patterns are preserved without splitting
- `bail` stops validation after first failure on dependent rules
- `Rule::exists()` validates foreign key existence correctly
- No silent rule failures from incorrect syntax

---

# Skill: Configure bail and stopOnFirstFailure Strategically

## Purpose
Use `bail` (per-attribute) and `stopOnFirstFailure` (per-request) to optimize validation performance and control error reporting granularity.

## When To Use
- `bail`: Attributes with dependent rules where later rules are meaningless if an earlier one fails
- `stopOnFirstFailure`: Multi-step wizards or forms where showing one error at a time is intentional UX
- Performance-sensitive endpoints with many rules per attribute

## When NOT To Use
- When all rule errors should be reported for complete user feedback (omit `bail`)
- When `bail` on every attribute would hide important secondary validation issues
- When the application needs full validation error reporting for debugging

## Prerequisites
- FormRequest or Validator with multiple rules per attribute
- Understanding of the validation execution order

## Inputs
- Rule definitions per attribute
- Validation error reporting requirements

## Workflow
1. For each attribute with dependent rules, add `bail` as the first element: `['bail', 'required', 'string', 'min:8']`
2. Use `bail` when a field should stop being validated after a fundamental rule fails (e.g., `required`)
3. Override `stopOnFirstFailure(): bool` in FormRequest to return `true` when needed
4. Prefer `bail` over `stopOnFirstFailure` for granular control
5. Use `stopOnFirstFailure` sparingly — only when the UX requires one-error-at-a-time
6. Test that the appropriate number of errors are reported with bail enabled

## Validation Checklist
- [ ] `bail` added as first rule on attributes with dependent rules
- [ ] `stopOnFirstFailure` returns `false` (default) unless intentional UX choice
- [ ] Tests verify correct error count with bail enabled
- [ ] No redundant `bail` on single-rule attributes
- [ ] Documentation explains why `stopOnFirstFailure` is used (if enabled)

## Common Failures
- Using `stopOnFirstFailure` when `bail` would suffice — hides all errors on unrelated fields
- Not using `bail` on dependent rules — users see "the password must be a string" when it's missing entirely
- Using `bail` everywhere without considering that users may need to see all errors at once
- Placing `bail` after other rules — must be first to work correctly

## Decision Points
- Use `bail` for field-level optimization vs `stopOnFirstFailure` for request-level early exit
- Use `bail` vs no bail based on user experience requirements (single vs multi-error display)

## Performance Considerations
- `bail` skips remaining rules on the attribute after first failure — reduces computation on invalid data
- `stopOnFirstFailure` skips ALL remaining attributes after first failure — maximum performance but worst UX
- For forms expected to have multiple validation issues, omit `bail` to report all errors at once

## Security Considerations
- `stopOnFirstFailure` could mask security-relevant validation errors that should be logged
- Ensure that enabling `stopOnFirstFailure` doesn't become a validation bypass vector
- When auditing validation failures, all errors should be checked, not just the first one

## Related Rules
- Rule 3: Use bail on Dependent Rules for Performance
- Rule 6: Add bail or stopOnFirstFailure Strategically

## Related Skills
- Write Validation Rules Using Array Syntax with Rule Objects
- Apply Declarative Conditional Validation Rules

## Success Criteria
- Attributes with dependent rules stop validating after the first failure when `bail` is used
- Users see the appropriate number of errors for the application's UX design
- `stopOnFirstFailure` is only enabled when intentionally required
- Tests verify the expected error count with bail configuration
- Validation performance is optimized for the expected failure patterns
