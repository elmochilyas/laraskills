# Skill: Add Domain-Level Validation to a DTO

## Purpose

Define validation rules on a DTO that enforce domain-level constraints across all entry points (HTTP, CLI, queue) without duplicating rules in the FormRequest layer.

## When To Use

- DTO is used across multiple entry points (HTTP + CLI + queue)
- Domain constraints (min age, SKU format, cross-field rules) apply regardless of entry point
- Adding DTO validation for CLI/queue entry points that have no FormRequest
- Refactoring from FormRequest-only validation to DTO-owned domain rules

## When NOT To Use

- HTTP-only data flow where FormRequest already validates everything
- Output-only DTOs — validation is unnecessary for output carriers
- When the DTO validation would duplicate FormRequest rules (choose one layer)

## Prerequisites

- DTO class with typed properties (plain DTO or spatie/laravel-data `Data` class)
- Domain requirements documented (which fields, what constraints, error messages)
- Decision on which validation layer is authoritative (FormRequest vs DTO)

## Inputs

- DTO property definitions and types
- Domain validation rule specifications per property
- Cross-field validation requirements (e.g., end_date > start_date)
- Error message preferences (if custom messages needed)

## Workflow

1. Identify domain-level constraints that apply regardless of entry point — these belong on the DTO
2. Identify HTTP-specific rules (authorization, input format, database lookups) — these stay on FormRequest
3. Open the DTO class and add validation method:
   - For spatie/laravel-data: add a `public static function rules(): array` method
   - For plain DTOs: add a private static `rules(): array` method called from `fromArray()`
4. Define rules using Laravel's validation Rule objects or string syntax — use `Rule::` objects for complex rules
5. For conditional rules (create vs update), accept the `Context` parameter in spatie/laravel-data
6. Ensure no database queries (`unique:users,email`) are in DTO rules — defer to service layer
7. Ensure no side effects (logging, API calls, counters) in validation rules — validation must be pure
8. Test each distinct validation path: construct DTO with invalid data and assert `ValidationException`
9. Verify the FormRequest does not duplicate the same rules — remove any overlap

## Validation Checklist

- [ ] DTO validation covers domain-level constraints only
- [ ] Validation rules do not duplicate FormRequest rules
- [ ] No database queries in DTO validation rules
- [ ] No side effects in validation rules
- [ ] Cross-field validation is placed in the correct layer (DTO for domain, FormRequest for HTTP)
- [ ] CLI/queue entry points have DTO validation as their sole validation layer
- [ ] `Data::fromRaw()` or `new Data(...)` is not used in production code paths
- [ ] Context is validated when using spatie/laravel-data's `rules(Context $context)`

## Common Failures

- **Duplicate rules**: Same rule in FormRequest and DTO. Rules diverge over time. Choose one layer.
- **Database queries in rules**: `unique:users,email` couples DTO construction to database connectivity. Defer to service layer.
- **Side effects in validation**: Logging, caching, or API calls during validation. Validation must be pure.
- **Validation bypass via fromRaw**: Using `Data::fromRaw()` for performance skips the pipeline. Always use `Data::from()` or `Data::fromRequest()`.
- **Constructor validation**: Placing validation in the constructor couples validation to construction. Use declarative `rules()` methods.

## Decision Points

- **FormRequest authoritative vs DTO authoritative**: For HTTP entry points, choose either FormRequest (validate all at HTTP boundary) or DTO (validate at data boundary). For CLI/queue, DTO is the sole option.
- **Domain rules vs HTTP rules**: HTTP-specific: authorization, input format, database uniqueness. Domain: business rules that apply everywhere.
- **Static rules vs contextual rules**: Use static rules for simple validation. Use `Context` for conditional rules (create vs update).

## Performance Considerations

- DTO validation uses the same `Validator` class as FormRequests — equivalent cost for same rules
- Nested DTO validation multiplies cost: a tree with 10 child DTOs runs validation 11 times
- Avoid database queries in DTO rules — they execute on every construction, including batch operations

## Security Considerations

- `Data::fromRaw()` bypasses the validation pipeline — audit all DTO construction points
- The DTO's `authorize()` method lacks access to route parameters/headers — weaker than FormRequest
- Validate context in `rules(Context $context)` when source is untrusted

## Related Rules

- Rule 1: Use DTO Validation for Domain-Level Rules Only
- Rule 2: Never Use Database Queries in DTO Validation Rules
- Rule 3: Choose One Validation Layer — Never Validate the Same Rules in Both FormRequest and DTO
- Rule 4: Keep Validation Pure — No Side Effects in Validation Rules
- Rule 5: Validate Context Passed to `rules(Context $context)` from Untrusted Sources
- Rule 6: Audit All DTO Construction Points for Validation Bypass
- Rule 7: Do Not Define DTO Validation in the Constructor — Prefer Declarative `rules()` Methods

## Related Skills

- DTO Fundamentals: Implement Baseline DTO
- DTO Construction Patterns: Add Named Static Factories to a DTO
- DTO Testing: Write DTO Contract Tests

## Success Criteria

- DTO validation rules cover all domain-level constraints
- No validation rule is duplicated between FormRequest and DTO
- All DTO construction points use the validated pipeline (not `fromRaw` or direct constructor)
- Each distinct validation path has a passing test
- CLI/queue entry points enforce validation through the DTO
