# Skill: Implement Response Versioning Strategy

## Purpose
Version API response shapes within the same endpoint by returning different resource versions based on negotiated API version, using dedicated versioned Resource classes and conditional transformation.

## When To Use
- APIs where response shape changes between versions
- Backward-incompatible response changes
- Same endpoint, different response versions

## When NOT To Use
- Same response shape across versions
- Additive-only response changes

## Prerequisites
- Versioning strategy
- API Resource versioning

## Inputs
- Resource shape per version
- Version dispatch logic

## Workflow
1. Create versioned Resource classes: `UserResource` in `V1` and `V2` namespaces
2. Detect request version from middleware or request attribute
3. Dispatch to appropriate Resource class based on version
4. Use Resource class per version — not conditional logic in single Resource
5. Keep base Resource with shared fields, extend for additions
6. Remove fields in new version by not extending — new Resource
7. Apply versioned response via middleware or controller helper
8. Test responses for each version with correct shape
9. Document shape differences between versions
10. Maintain versioned Resources until version sunset

## Validation Checklist
- [ ] Versioned Resource classes per version
- [ ] Version detection from request attribute
- [ ] Dispatch to correct Resource class
- [ ] Shared base Resource for common fields
- [ ] Removed fields = new Resource, not conditional
- [ ] Versioned responses tested per version
- [ ] Shape differences documented

## Related Skills
- API Resource Transformation
- Resource Class Organization
- Versioning Strategy Selection
