# Skill: Compose and Structure Validation Rules

## Purpose
Compose validation rules using Laravel's rule objects, rule classes, closures, and conditional combinations (`required_with`, `prohibited_if`, `sometimes`) for complex input validation.

## When To Use
- Non-standard validation logic beyond simple required/type/max
- Conditional field requirements based on other inputs
- Cross-field validation rules

## When NOT To Use
- Standard field validation (required, string, max:255) — use simple arrays
- Single-rule validations — array syntax is sufficient

## Prerequisites
- Laravel validation system
- Form Request usage

## Inputs
- Conditional rule logic per field
- Cross-field validation specifications

## Workflow
1. Use `required_with` for fields required when another field is present: `['email', 'required_with:notification_enabled']`
2. Use `prohibited_if` for mutually exclusive fields: `['coupon_code', 'prohibited_if:promotion_id,!=,null']`
3. Use `sometimes` for fields that are optional but must pass rules when present
4. Create `Rule` class objects for rules with dynamic parameters: `new UniqueInCompanyRule($companyId)`
5. Use Closures for one-off cross-field validation: `function ($attribute, $value, $fail) use (...)`
6. Combine rules with `|` pipe for simple, array for complex: `['email', 'required', 'email:filter', new CustomRule]`
7. Use `bail()` with pipe syntax to stop after first rule failure: `'field' => 'bail|required|email|unique:users'`
8. Apply `nullable` for fields that accept explicit `null`: `['field' => 'nullable|string|max:255']`
9. Use Rule class `->when()` for context-dependent rules
10. Test each rule composition — combinations often interact unexpectedly

## Validation Checklist
- [ ] `required_with` used for dependent fields
- [ ] `prohibited_if` used for mutually exclusive fields
- [ ] `sometimes` used for optional fields with validation rules
- [ ] Rule classes for complex/dynamic validation
- [ ] Closures for one-off cross-field rules
- [ ] `bail` stops after first failure where appropriate
- [ ] `nullable` where explicit null is valid
- [ ] Rules composed with array syntax for complex cases
- [ ] Rule interactions tested (e.g. `sometimes` + `nullable` + `string`)
- [ ] Conditional rules tested with all conditions

## Common Failures
- `required_if` when `required_with` is intended — `required_if` checks specific value, `required_with` checks presence
- `sometimes` + `nullable` + `string` order matters — nullable before sometimes in some versions
- `bail` with custom rule classes — custom rules run even with bail if earlier rules are object type
- `prohibited_if` with complex conditions — `!=,null` syntax varies by Laravel version
- Rule combination not tested — edge cases missed in composed logic

## Decision Points
- Rule class vs Closure — Class for reusable, Closure for one-off, Fluent for builder pattern
- Pipe syntax vs array — array preferred for Lumen/modern Laravel, pipe for legacy
- `required_if` within array vs `Rule::when()` — Rule::when for dynamic conditions

## Performance Considerations
- Each rule type adds ~0.1ms parsing overhead — rule class objects are faster than Closure strings
- Custom rule classes with DB queries should be cached per-request where possible
- `bail` saves time by not validating further after first failure — use on primary constraints first

## Security Considerations
- Closures in rules must not capture user input unsafely
- `prohibited_if` prevents unexpected field presence in mass-assignment
- Custom rule classes should validate inputs before using them in DB queries
- Never pass raw user input to `Rule::unique()->ignore()` — validate ID separately

## Related Rules
- Use Rule Classes For Complex Validation
- Use Closures For One-off Cross-Field Rules
- Apply Conditional Rules Correctly (required_with, prohibited_if)
- Use `bail` To Stop Validation After First Rule Failure
- Test Rule Compositions and Interactions
- Prefer Array Syntax Over Pipe for Complex Rule Sets

## Related Skills
- Form Request Validation Logic — for form request integration
- Custom Validation Rules — for reusable rule classes
- Cross-Field Validation — for interdependent field rules

## Success Criteria
- Conditional rules correctly require/optional/prohibit fields based on context
- Custom rule classes handle domain-specific validation with dynamic parameters
- Cross-field validation rules work correctly with all test conditions
- `bail` stops validation chains at first failure, improving response time
- Rule compositions are tested and proven correct for all edge cases
