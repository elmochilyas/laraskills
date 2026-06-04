# Skill: Implement Backward Compatibility Policy

## Purpose
Define and enforce backward compatibility policy: additive changes only within major version, no breaking changes without major version bump, deprecation period before removal, and compatibility testing.

## When To Use
- API versioning strategy
- Consumer-facing API governance
- Breaking change planning

## Inputs
- Backward compatibility rules
- Breaking change definition

## Workflow
1. Define breaking vs non-breaking changes:
   - **Compatible (additive)**: new endpoints, new optional fields, new response headers
   - **Breaking**: removed endpoints, removed fields, changed types, changed behavior
2. Allow only additive changes within major version
3. Require major version bump for breaking changes
4. Deprecate before removing — minimum 6 months notice
5. Maintain deprecated endpoints until sunset date
6. Verify compatibility with consumer contract tests
7. Document compatibility policy in API style guide
8. Review changes for compatibility before release
9. Use semantic versioning for API versions (major only)
10. Monitor consumer usage for unexpected breakage

## Validation Checklist
- [ ] Breaking vs non-breaking defined
- [ ] Additive-only within major version
- [ ] Major version for breaking changes
- [ ] Deprecation before removal
- [ ] Compatibility reviewed before release
- [ ] Policy documented

## Related Skills
- Versioning Strategy Selection
- Deprecation Policy Design
- Breaking Change Process
