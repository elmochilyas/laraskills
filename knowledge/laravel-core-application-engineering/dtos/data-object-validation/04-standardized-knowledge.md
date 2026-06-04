# Data Object Validation

## Metadata
- **Domain:** Laravel Core Application Engineering
- **Subdomain:** Data Transfer Objects
- **Knowledge Unit:** Data Object Validation
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

## Overview

Data object validation is the practice of defining validation rules on the DTO itself rather than (or in addition to) a FormRequest. This shifts the validation boundary from the HTTP layer to the data contract layer. The DTO declares what valid data looks like, and any entry point (HTTP, CLI, queue) that creates the DTO gets validation for free.

The engineering tradeoff is layer purity versus DRY. Placing validation on the DTO ensures that every caller receives validated data, but couples the DTO to validation logic. The spatie/laravel-data package implements this via the `rules()` static method on Data objects, validated by `ValidatePropertiesDataPipe` in the pipeline.

## Core Concepts

- **Validation at the Data Contract:** The DTO declares: "Any data that becomes this DTO must satisfy these rules." Validation is intrinsic to the data shape, not to the entry point.
- **Two-Phase Validation:** Phase 1: FormRequest validation (HTTP boundary) for authorization and input format. Phase 2: Data object validation (data boundary) for domain-level rules.
- **ValidatePropertiesDataPipe Ordering:** Runs AFTER authorization but BEFORE casting. This prevents invalid data from reaching casters but means casters receive uncast values.
- **rules() Resolution:** Can return a static array, accept a `Context` parameter for conditional rules, or use dot notation for nested properties.
- **authorize() Method:** Controls whether the current user can create this DTO. Checked before validation and casting.

## When To Use

- DTOs used across multiple entry points (HTTP, CLI, queue) — validation works everywhere automatically
- Domain-level validation that must be consistent regardless of how data enters the system
- Teams using spatie/laravel-data as the primary validation mechanism
- CLI commands and queue jobs that bypass FormRequests but still need data validation

## When NOT To Use

- HTTP-only data flow where FormRequest already validates all input format and domain rules
- DTOs used exclusively as output carriers — validation is unnecessary for output-only DTOs
- Complex authorization logic that requires route parameters, request headers, or resource relationships
- When the DTO validation duplicates FormRequest rules (always diverges over time)

## Best Practices (WHY)

- **Why DTO validation for domain rules:** Domain-level constraints (min age, SKU format) apply regardless of entry point. Placing them on the DTO guarantees consistency.
- **Why FormRequest validation for HTTP concerns:** Authorization, input preparation, and format validation are HTTP-specific. The FormRequest is the correct layer for these.
- **Why avoid duplicate rules:** When both FormRequest and DTO define the same rules, they diverge over time. Pick one validation layer per application.
- **Why validation before casting:** Validating raw values ensures type casters never receive malformed input that could cause unexpected behavior or errors.

## Architecture Guidelines

- Use FormRequest for HTTP-specific rules (authorization, input format, database constraints)
- Use DTO validation for domain-level constraints (business rules, cross-field validation for non-HTTP entry points)
- For CLI/queue entry points, the DTO serves as the sole validation layer
- Avoid database queries (`unique:users,email`) in DTO validation — cache unique checks or defer to service layer
- Test DTO validation independently of HTTP by constructing the DTO with invalid data and asserting exceptions

## Performance

DTO validation uses the same `Validator` class as FormRequests — performance is equivalent for the same rule set. Nested DTO validation multiplies the cost (each nested DTO runs its own rules). A tree with 10 child DTOs runs validation 11 times. Profile rule complexity at each level for deeply nested structures.

## Security

- `Data::fromRaw()` or `new Data(...)` bypasses the validation pipeline — audit all DTO construction points
- The DTO's `authorize()` method has no access to route parameters or request headers — weaker than FormRequest authorization
- Context passed to `rules(Context $context)` from untrusted sources could manipulate validation behavior — validate context itself

## Common Mistakes

1. **Duplicate Validation:** Defining the same rules in both a FormRequest and a DTO. The rules always diverge — one is updated, the other is forgotten.

2. **Validation with Side Effects:** Rules that call external services, mutate state, or perform logging during validation. Validation should be pure — it checks data, it does not perform operations.

3. **Complex Cross-Field Validation in DTOs:** Cross-field rules (e.g., "end_date must be after start_date") are better in FormRequests or service layer where context is richer.

4. **Validation Bypass via fromRaw:** Using `Data::fromRaw()` or `new Data(...)` for performance reasons accidentally bypasses validation. Audit all construction points.

## Anti-Patterns

- **The Double Validation:** Both FormRequest and DTO validate the same fields. Results in duplicate processing, divergent rules, and confusion about the source of truth.
- **The Validating DTO:** A DTO that performs heavy validation (database lookups, API calls) in its constructor. Couples data transport to infrastructure and makes construction slow.
- **The Silent Pass-Through:** A DTO with no validation that is constructed from unvalidated input. Accepts invalid data and passes it to the service layer unchecked.

## Examples

### Data Object Validation with spatie/laravel-data
```php
class CreateUserData extends Data
{
    public function __construct(
        public string $name,
        public string $email,
    ) {}

    public static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email', 'unique:users,email'],
        ];
    }
}
```

### Manual DTO Validation (Without spatie)
```php
readonly class CreateUserDto
{
    public function __construct(
        public string $name,
        public string $email,
    ) {
        $validator = validator(['name' => $name, 'email' => $email], static::rules());
        if ($validator->fails()) {
            throw new ValidationException($validator);
        }
    }

    private static function rules(): array
    {
        return [
            'name' => ['required', 'string', 'max:255'],
            'email' => ['required', 'email'],
        ];
    }
}
```

### Contextual Validation
```php
class UserData extends Data
{
    public static function rules(Context $context): array
    {
        $isUpdate = $context->has('existingUser');
        return [
            'email' => $isUpdate
                ? ['required', 'email', Rule::unique('users')->ignore($context->existingUser)]
                : ['required', 'email', 'unique:users,email'],
            'password' => $isUpdate
                ? ['sometimes', 'string', 'min:8']
                : ['required', 'string', 'min:8'],
        ];
    }
}
```

## Related Topics

- **Form Request Fundamentals** — FormRequest validation mechanics
- **spatie/laravel-data** — Data pipeline and validation integration
- **Conditional Validation** — advanced conditional rule patterns
- **DTO vs Form Request** — validation boundary decision framework

## AI Agent Notes

- Use DTO validation for domain-level rules that apply across all entry points
- Use FormRequest validation for HTTP-specific rules (authorization, input format)
- Never duplicate validation rules between FormRequest and DTO
- For CLI/queue entry points, DTO validation is the sole validation layer
- Validate context passed to `rules(Context $context)` when source is untrusted

## Verification

- [ ] Validation rules are defined in one layer only (FormRequest or DTO, not both)
- [ ] DTO validation covers domain-level constraints
- [ ] FormRequest validation covers HTTP-specific concerns (authorization, input format)
- [ ] No database queries used in DTO validation rules
- [ ] DTO validation is tested independently (construct DTO with invalid data → assert exception)
- [ ] CLI/queue entry points have DTO validation as their sole validation layer
- [ ] `Data::fromRaw()` usage is audited and avoided
