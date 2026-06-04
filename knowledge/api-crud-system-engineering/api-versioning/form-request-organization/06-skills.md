# Skill: Organize Versioned Form Requests

## Purpose
Structure version-specific form requests with versioned namespaces, rule inheritance, and independent tests to ensure different API versions get correct validation and authorization logic.

## When To Use
- Any API with version-specific validation rules
- APIs where required fields differ between versions
- APIs with version-specific authorization logic
- When validation error format evolves across versions

## When NOT To Use
- Versions with identical validation rules — single form request shared
- Simple endpoints where inline validation suffices
- APIs where validation logic is entirely database-driven

## Prerequisites
- Laravel FormRequest patterns
- Version namespace convention

## Inputs
- Validation rules per version
- Authorization logic per version

## Workflow
1. Place version-specific form requests in versioned namespaces — `App\Http\Requests\V1\`, `App\Http\Requests\V2\`
2. Override `rules()` by calling `parent::rules()` then adding/removing keys — never copy the entire array
3. Use `$request->validated()` instead of `$request->all()` to prevent mass assignment
4. Override `authorize()` — call `parent::authorize()` for chain, never weaken checks
5. Mark deprecated fields as `nullable|sometimes` instead of removing rules
6. Extract reusable rule groups into traits shared across versions
7. Include version number in validation error responses
8. Test each version's form request independently

## Validation Checklist
- [ ] Versioned namespaces used for form requests
- [ ] Rule inheritance pattern used for progressive enhancement
- [ ] `validated()` used instead of `all()`
- [ ] Authorization checks not weakened in newer versions
- [ ] Deprecated fields marked `nullable|sometimes`
- [ ] Each version's form request tested independently
- [ ] No authorization gaps between versions

## Common Failures
- Modifying V1 rules and forgetting V2 extends it — V2 gets the change too
- Adding required field in V2 without considering V1 consumers
- Overriding `authorize()` in V2 but forgetting `parent::authorize()`
- Rule leak — V2 inherits outdated V1 validation rules

## Decision Points
- FormRequest+Data validation vs Data-only — project-level decision, apply consistently
- Inheritance vs composition for rules — inheritance for additive, traits for shared groups
- Store vs update split — separate form requests, each versioned

## Performance Considerations
- Form request resolution adds ~0.2ms per request — negligible
- Rule inheritance adds no runtime cost (arrays built at call time)
- Rule caching applies per request class, not per version

## Security Considerations
- Form request versioning is the most security-critical aspect of API versioning
- V2 must not remove `authorize()` checks from V1 without intentional review
- Security-critical validation rules must be tested for every active version

## Related Rules
- Use Versioned Namespace For Form Requests
- Override `rules()` By Extending Parent
- Use `validated()` Instead Of `$request->all()`
- Test Each Version's Form Request Independently
- Mark Deprecated Fields As `nullable|sometimes`
- Never Remove `authorize()` Checks In Newer Versions

## Related Skills
- Resource Class Organization — versioned resource patterns
- Controller Inheritance — versioned controller patterns
- Data Transfer Object Design — DTO construction from validated data

## Success Criteria
- Each version has its own form request with correct validation rules
- Rule inheritance ensures V2 gets all V1 rules plus additions
- Authorization logic is never weakened across versions
- Each version's validation tests pass independently
- Error responses include version number for debugging