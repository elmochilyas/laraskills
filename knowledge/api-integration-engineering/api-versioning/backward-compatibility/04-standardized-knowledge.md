# ECC Standardized Knowledge — Backward Compatibility

## Metadata
| Field | Value |
|-------|-------|
| Domain | API Integration Engineering |
| Subdomain | api-versioning-compatibility |
| Knowledge Unit ID | ku-02 |
| Knowledge Unit | Backward Compatibility |
| Difficulty | Intermediate |
| Version | 1.0 |
| Last Updated | 2026-06-02 |
| Source | K009, K023, K030 |

## Overview (Engineering Value)
Backward compatibility is the practice of evolving an API without breaking existing consumers. It is governed by the principle of additive-only changes: new fields, new endpoints, and new optional parameters can be added freely, but existing fields, behaviors, and contracts must remain unchanged. Maintaining backward compatibility within a version eliminates the need for consumer updates and preserves trust in the API platform. It is enforced through contract testing, semantic versioning of the API spec, and continuous validation in CI.

## Core Concepts
- **Additive-Only Rule**: New features added; existing features never removed or changed in a version
- **Wire Compatibility**: Request/response format unchanged for existing consumers
- **Semantic Versioning for APIs**: Major version for breaking changes, minor for additive changes, patch for fixes
- **Contract Testing**: Automated tests verifying that API responses match documented schemas
- **OpenAPI Diff Validation**: CI tools comparing spec changes to detect breaking modifications
- **Tolerant Reader**: Consumer-side pattern accepting unknown fields, reducing coupling
- **Default Behavior Preservation**: New optional parameters default to behavior identical to the previous version

## When To Use
- All public APIs with external consumers
- Internal APIs consumed by teams outside your control
- Any API where consumer cannot be updated simultaneously with the provider
- APIs with formal versioning and support commitments

## When NOT To Use
- Internal APIs where all consumers deploy in lockstep
- Rapid-prototyping APIs without established consumers
- APIs documented as "experimental" or "pre-release"

## Best Practices (explain WHY)
- **Never remove fields within a version**: Existing consumers may depend on every field; removal causes silent breakage (undefined property access) that may not surface immediately
- **Add only optional fields**: Required new fields break existing consumers that don't send them; optional fields with defaults ensure unchanged behavior
- **Validate backward compatibility in CI**: OpenAPI diff tools catch accidental breaking changes before deployment, preventing production incidents
- **Use Postel's Law (Robustness Principle)**: Be conservative in what you send, liberal in what you accept; accept unknown fields in requests, ignore unexpected response fields
- **Document migration paths for breaking changes**: When a breaking change is necessary, provide clear before/after examples and a migration window

## Architecture Guidelines
- Run OpenAPI spec diff in CI pipeline on every change
- Maintain spec examples covering both old and new field patterns
- Version responses using `Content-Type` with vendor MIME type
- Default new query parameters to emulate old behavior
- Use `null` vs `absent` to distinguish "not provided" from "explicitly null"
- Test with consumer contract test suites as part of CI

## Performance Considerations
- Backward compatibility validation adds CI time (spec diff: 1-5s) but zero runtime overhead
- Accepting unknown fields has no performance cost (JSON decoder ignores them)
- Default behavior preservation via parameter defaults is zero-cost
- Contract test execution adds 2-10s per consumer in CI

## Security Considerations
- Backward-compatible changes should never weaken authentication or authorization
- New optional parameters must not bypass existing security controls
- Deprecated fields removed in a new version must be communicated clearly to prevent security gaps
- Old versions may not have the latest security features; document these limitations

## Common Mistakes

| Mistake | Cause | Consequence | Better Approach |
|---------|-------|-------------|-----------------|
| Removing fields within a version | Assumption no one uses them | Silent consumer breakage | Mark deprecated, remove in next major version |
| Adding required fields | Convenience for new consumers | Existing requests fail validation | Make new fields optional with sensible defaults |
| Changing response format silently | Bug fix perceived as internal | Consumer JSON parsing breaks | New format = new version |
| Not catching breaking changes in CI | Manual review only | Breaking change reaches production | Automated OpenAPI diff in pipeline |
| Assuming consumer tolerance | Lack of telemetry | Breakage goes undetected until consumer complains | Monitor API response parsing errors |

## Anti-Patterns
- **Breaking with semantics**: Changing behavior without changing format (e.g., a field now means something different)
- **Covert breakage**: Bug fix that changes documented behavior consumers may rely on
- **Versionless evolution**: Adding fields but also rearranging or removing undocumented ones
- **Consumer-specific compatibility**: Maintaining compatibility for some consumers but not all

## Examples (concise, architectural)
```yaml
# OpenAPI diff — detected breaking change (CI rejects)
# Old spec: /users response has "name" (string, required)
# New spec: /users response renames "name" to "full_name" — BREAKING
#
# Compatible change: add "full_name" (string, optional), keep "name" unchanged
```

```php
// Backward-compatible parameter addition
public function listUsers(Request $request)
{
    $filters = $request->get('filters', []); // Old: no filters
    // New: $filters with default empty array preserves old behavior
}
```

## Related Topics
- **Prerequisites**: API versioning strategies
- **Closely Related**: Contract testing, OpenAPI specification management, deprecation headers
- **Advanced**: Consumer-driven contracts, Pact testing, schema evolution with Avro/Protobuf
- **Cross-Domain**: Microservices versioning, library semantic versioning

## AI Agent Notes
- Flag any field removal or type change as breaking
- Default to additive-only changes when modifying API specs
- Include backward compatibility validation steps in CI pipeline generation

## Verification
- [ ] No fields removed or made required within a version
- [ ] OpenAPI spec diff passes in CI for all changes
- [ ] Consumer contract tests pass against new API version
- [ ] Default behavior preserved for all existing consumers
- [ ] Documentation explicitly marks what is deprecated vs removed
