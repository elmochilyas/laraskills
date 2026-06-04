# Skill: Implement Conditional Validation Patterns

## Purpose
Apply validation rules conditionally using `required_if`, `required_with`, `required_without`, `prohibited_if`, `prohibits`, `exclude_if`, and Rule::when() for context-dependent validation logic.

## When To Use
- Complex conditional validation rules
- Dependent field validation
- Mutually exclusive field handling

## When NOT To Use
- Simple required/optional fields
- Static validation rules

## Prerequisites
- Form Request validation logic
- Conditional validation rule knowledge

## Inputs
- Conditional rule specifications

## Workflow
1. Use `required_if:field,value` for field required when another field equals value
2. Use `required_with:field1,field2` for field required when any listed field present
3. Use `required_without:field` for field required when another field absent
4. Use `prohibited_if:field,value` for mutually exclusive fields
5. Use `prohibits:field` for field that prevents another field's presence
6. Use `exclude_if:field,value` to exclude field from validated data
7. Use `Rule::when($condition, [...])` for complex conditional rules
8. Use custom rule classes for complex conditional logic
9. Test conditional rules with all condition combinations
10. Document conditional behavior in API documentation

## Validation Checklist
- [ ] `required_if` for value-dependent requirements
- [ ] `required_with` for presence-dependent requirements
- [ ] `prohibited_if` for mutual exclusion
- [ ] `prohibits` for field-level prohibition
- [ ] `exclude_if` for conditional exclusion
- [ ] `Rule::when()` for complex conditions
- [ ] Tested with all condition combinations

## Related Skills
- Validation Rule Composition
- Rule::when() usage
- Custom Validation Rules
