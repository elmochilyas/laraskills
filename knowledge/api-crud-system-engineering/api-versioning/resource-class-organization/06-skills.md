# Skill: Organize Versioned API Resources

## Purpose
Structure version-specific API resources with versioned namespaces, inheritance for progressive field enhancement, and conditional field inclusion to ensure each API version returns the correct response shape.

## When To Use
- Any API with version-specific response shapes
- APIs where fields are added, renamed, or removed between versions
- APIs with version-specific pagination or metadata structures
- Teams maintaining multiple active API versions

## When NOT To Use
- Versions with identical response shapes — single resource shared
- Simple APIs where `toArray()` on models suffices
- When responses are entirely dynamic and unstructured

## Prerequisites
- Laravel API Resource patterns
- Version namespace convention

## Inputs
- Response field specifications per version
- Conditional field logic

## Workflow
1. Place version-specific resources in versioned namespaces — `App\Http\Resources\V1\`, `App\Http\Resources\V2\`
2. Extend previous version's resource for progressive field enhancement — V2 extends V1, overrides `toArray()`
3. Use `$this->when()` for version-specific optional fields
4. Use `$this->merge()` to combine parent fields with version-specific additions
5. Never remove old version resources when adding new version — old resources serve active consumers
6. Use `->additional()` for version-specific metadata (deprecation notices, pagination links)
7. Test each version's resource independently — parent changes silently affect children
8. Automate schema diff in CI when PR modifies resource files
9. Monitor response size growth across versions — alert when >2x previous version

## Validation Checklist
- [ ] Versioned namespaces used for API resources
- [ ] Resource inheritance pattern used for progressive enhancement
- [ ] Conditional fields use `$this->when()` appropriately
- [ ] Each version's resource tested independently
- [ ] Old version resources never removed when adding new version
- [ ] Schema diff automated in CI for resource changes
- [ ] Response size growth monitored

## Common Failures
- Deep resource inheritance creating fragile override chains
- Using `when()` for fields that are always included
- Removing old version resources when adding new version
- Mixing version-specific and shared resources in same directory

## Decision Points
- Inheritance vs composition for resources — inheritance for additive, composition for structural changes
- `$this->when()` vs always-include — conditional for optional, always for core contract
- Resource vs DTO for output — resources for HTTP responses, DTOs for internal data transport

## Performance Considerations
- Resource resolution is O(1) with factory caching
- Inheritance chain resolution is PHP-compiled — no runtime cost
- Conditional `when()` calls evaluated only when included
- Resource collections loop over models — O(n) per page

## Security Considerations
- New version resources must not expose sensitive fields excluded in old versions
- Resource coverage matrix — every model has a resource in every active version
- Field deprecation should include response hint to consumers

## Related Rules
- Use Versioned Namespace For API Resources
- Prefer Inheritance For Progressive Resource Enhancement
- Use `$this->when()` For Version-Specific Optional Fields
- Never Remove Old Version Resources When Adding New Version
- Test Each Version's Resource Independently
- Use `->additional()` For Version-Specific Metadata

## Related Skills
- Form Request Organization — versioned validation patterns
- Controller Inheritance — versioned controller patterns
- Sparse Field Selection — response field limiting

## Success Criteria
- Each version has its own resources with correct response shapes
- Resources use inheritance for progressive field enhancement
- Old version resources remain untouched when new version added
- Schema diff in CI catches unintended response changes
- Response size is monitored and stays within budget