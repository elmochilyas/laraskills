# Skill: Integrate Spatie Laravel Data Package

## Purpose
Replace manual DTO infrastructure with Spatie's `laravel-data` package for automatic type casting, validation integration, serialization, and TypeScript generation — using declarative `Data` class definitions.

## When To Use
- Codebases with 20+ DTOs where manual maintenance is burdensome
- When nested DTOs are common — package handles recursion automatically
- When TypeScript generation needed for frontend-backend type sync
- When validation is tightly coupled to data structure
- Teams preferring declarative patterns over imperative factory methods

## When NOT To Use
- Small codebases (<20 DTOs) where manual patterns are sufficient
- Teams preferring minimal dependencies and plain PHP patterns
- Extremely simple DTOs (2-3 fields, no nesting, no validation)
- When team is not willing to learn package conventions

## Prerequisites
- DTO design understanding
- Composer package management

## Inputs
- Data class specifications
- Validation rules per data type

## Workflow
1. Install `spatie/laravel-data` and pin exact version in `composer.json`
2. Choose one approach (package or manual) and apply consistently across codebase
3. Define Data classes extending `Data` with typed constructor properties
4. Use `Data::from()` for construction — automatic snake_case to camelCase mapping
5. Define `rules()` on Data classes for validation — runs automatically during construction
6. Decide validation strategy: FormRequest+Data or Data-only (project-level decision)
7. Register custom casts for application-specific types — `#[WithCast]` attribute
8. Configure TypeScript generation — run `php artisan data:typescript` in CI
9. Test Data class construction for edge cases — missing keys, type mismatches, null values

## Validation Checklist
- [ ] Package approach applied consistently across all DTOs
- [ ] Package version pinned exact in composer.json
- [ ] Validation strategy decided and documented (FormRequest+Data or Data-only)
- [ ] Data classes use `Data::from()` for construction
- [ ] Custom casts registered for application-specific types
- [ ] TypeScript generation configured and run in CI
- [ ] Data construction tested for edge cases

## Common Failures
- Mixing package and manual patterns — some DTOs use Spatie, others manual
- Over-reliance on automatic construction — assuming keys always map correctly
- Ignoring learning curve — expecting package to work exactly like manual DTOs
- Uncaught validation exceptions — `Data::from()` throws `DataValidationException`

## Decision Points
- Package vs manual DTO — package for 20+ DTOs, manual for smaller codebases
- FormRequest+Data vs Data-only validation — project-level decision, apply consistently
- Custom casts vs raw types — custom for value objects, raw for simple scalars

## Performance Considerations
- Spatie Data slightly slower than manual DTOs due to reflection construction
- For typical usage (10-50 constructions per request), overhead ~0.1-0.5ms
- Reflection overhead incurred once per class per process, then cached

## Security Considerations
- Validation in Data classes runs automatically — ensure rules as strict as FormRequest
- `Data::from()` with invalid input throws `DataValidationException` — catch appropriately
- TypeScript generation may expose internal DTO structure — review for sensitive fields
- Custom casts must not introduce security vulnerabilities

## Related Rules
- Choose One Approach — Package or Manual — and Apply Consistently
- Pin the Exact Package Version
- Decide on Validation Strategy
- Test Data Class Construction for Edge Cases
- Configure TypeScript Generation and Run in CI
- Use Custom Casts for Application-Specific Types

## Related Skills
- Data Transfer Object Design — core DTO concepts Spatie formalizes
- DTO Nesting Composition — nesting patterns Spatie automates
- DTO Construction Patterns — manual patterns Spatie replaces

## Success Criteria
- All DTOs use Spatie Data consistently
- TypeScript types auto-generated from PHP Data classes
- Validation strategy is consistent project-wide
- Custom casts enforce domain invariants at DTO boundary
- Data construction tested for all edge cases