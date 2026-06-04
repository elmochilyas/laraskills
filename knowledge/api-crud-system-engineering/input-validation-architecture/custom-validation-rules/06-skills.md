# Skill: Implement Custom Validation Rules

## Purpose
Create reusable custom validation rule classes extending `ValidationRule` or using `Rule` objects with parameters, database lookups, and dependency injection.

## When To Use
- Domain-specific validation rules
- Reusable validation logic across multiple Form Requests
- Complex validation with database lookups or external services

## When NOT To Use
- Simple validation that existing Laravel rules cover
- One-off validation in single Form Request (use closure)

## Prerequisites
- Laravel validation system
- Rule class creation

## Inputs
- Custom validation rule specifications

## Workflow
1. Create rule class: `php artisan make:rule UniqueInCompany`
2. Extend `Illuminate\Contracts\Validation\ValidationRule`
3. Accept parameters in constructor: `public function __construct(private Company $company)`
4. Implement `validate(string $attribute, mixed $value, Closure $fail): void`
5. Use dependency injection for services/repositories
6. Return type-specific failure messages: `$fail('validation.unique_in_company')->translate()`
7. Register in container for auto-resolution
8. Return custom validation error codes
9. Test rule with valid and invalid data
10. Use in Form Request: `new UniqueInCompany($company)`

## Validation Checklist
- [ ] Rule class extends ValidationRule
- [ ] Constructor injection for parameters
- [ ] validate() method implementation
- [ ] Dependency injection for services
- [ ] Type-specific failure messages
- [ ] Registered in container
- [ ] Custom error codes
- [ ] Tested with valid and invalid data

## Related Skills
- Validation Rule Composition
- Conditional Validation Patterns
- Form Request Validation Logic
