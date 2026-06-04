# Skill: Maintain Backward Compatibility Across API Versions

## Purpose
Add new API features while maintaining backward compatibility: additive changes only, no breaking modifications, and clear deprecation timelines.

## When To Use
- Evolving any API with existing consumers
- Adding fields, endpoints, or parameters to public APIs
- Deprecating old behavior while keeping existing consumers working

## When NOT To Use
- Internal APIs where all consumers can be updated simultaneously
- Breaking changes announced via major version bump

## Prerequisites
- API versioning strategy in place
- Understanding of SemVer for APIs

## Workflow
1. Follow additive-only rule: never remove or modify existing fields
2. Add new fields as optional with defaults
3. Add new endpoints without modifying existing ones
4. Support old request formats alongside new ones
5. Add `X-API-Warning` header for deprecated usage
6. Test old consumers against new API version
7. Document breaking changes and migration paths
8. Maintain old versions until deprecation window expires

## Validation Checklist
- [ ] Additive-only changes in existing API versions
- [ ] New fields optional with documented defaults
- [ ] Old request/response formats still supported
- [ ] Deprecation warnings via headers or docs
- [ ] Old consumer tests pass against new API
- [ ] Breaking changes only in new major version
