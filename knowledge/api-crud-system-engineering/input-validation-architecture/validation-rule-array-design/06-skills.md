# Skill: Design Validation Rule Arrays with Clarity and Maintainability
## Purpose
Structure Form Request `rules()` arrays with consistent formatting, logical grouping, conditional rules, and reusable definitions — making them readable, maintainable, and testable.
## When To Use
Every Form Request; when rules become long (>30 lines); when rules depend on request context or resource state.
## When NOT To Use
Simple 1-3 rule validations (inline is fine); global validation middleware (not Form Request).
## Prerequisites
Laravel validation rule syntax; Form Request lifecycle; conditional validation rules.
## Inputs
Request fields; database schema constraints; business validation requirements.
## Workflow
1. Group related fields together in the rules array (contact info fields, financial fields)
2. Apply rules in order: type → format → existence → business logic
3. Use pipe-separated strings for simple rules, arrays for complex rules
4. Inject context-dependant rules via `withValidator()` or by building rules dynamically in `rules()`
5. Extract reusable rule groups into private methods or dedicated Rule classes
6. Use `Rule::unique()` with ignore parameters for update requests
7. Use `prohibited`, `excluded_if`, `required_if` for conditional presence
8. Test the rules array structure independently from validation execution
## Validation Checklist
- [ ] Rules are grouped logically (personal, financial, system)
- [ ] Type rules come before format rules, which come before business rules
- [ ] Conditional rules (`required_if`, `prohibited`) cover all state branches
- [ ] Unique rules correctly ignore current resource ID on updates
- [ ] Long rule arrays are extracted to private methods or separate classes
- [ ] Error messages match the dot-notation or aliased field names
- [ ] Rules for nested/array data use `*` wildcard notation
- [ ] No duplicate or contradictory rules exist
## Common Failures
- Unordered rules make it hard to trace validation flow
- Using inline closures for rules that should be reusable Rule classes
- Not handling update vs create rule differences — unique rule never ignores current ID
- Forgetting `*` wildcard for nested array validation
- Mixing formatting and business logic rules without clear ordering
## Decision Points
- Pipe string vs array syntax for rule definitions
- Private method extraction vs dedicated Rule/FormRequest base class
- Explicit conditional rules vs `withValidator()` for runtime rule changes
## Performance/Security Considerations
Well-structured rules arrays are not a performance concern. Security: rule ordering ensures type checks happen before DB lookups (prevents type-juggling bypasses); explicit rule lists prevent unintended field acceptance.
## Related Rules/Skills
Form Request Design; Custom Rule Objects; Input Preparation; Form Request Testing.
## Success Criteria
Rule arrays are grouped, ordered, and extracted for readability; conditional rules cover all states; unique rules handle updates correctly; tests validate the rule structure.
