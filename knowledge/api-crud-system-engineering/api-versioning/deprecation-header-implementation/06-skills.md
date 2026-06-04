# Skill: Implement Deprecation HTTP Headers

## Purpose
Inject `Deprecation` and `Sunset` HTTP headers via middleware on deprecated API versions, using RFC 9745 standard header names, with `since` parameter and `Link` header to migration guide.

## When To Use
- When API version or endpoint is scheduled for removal
- As part of phased deprecation timeline (Warn phase)
- Before any API version removal

## When NOT To Use
- For versions still actively developed with new features
- Without accompanying `Sunset` header with removal timeline
- When deprecation date is not yet determined

## Prerequisites
- Versioning strategy already in place
- Migration guide documentation prepared

## Inputs
- Deprecation configuration per version (since date, sunset date, migration URL)

## Workflow
1. Create `DeprecationMiddleware` that checks version against deprecation config
2. Apply middleware to deprecated version route groups (not individual controllers)
3. Set `Deprecation: true` header with `since="2026-01-01"` ISO 8601 parameter
4. Always pair with `Sunset` header containing RFC 7231 formatted removal date
5. Add `Link` header with `rel="deprecation"` pointing to migration guide URL
6. Use standard header names per RFC 9745 — never `X-Deprecated` or custom names
7. Keep deprecated endpoints fully functional — deprecation signals intent, not permission to degrade
8. Log deprecation header deliveries to estimate consumer migration progress
9. Test deprecated endpoints in CI for both functionality and correct headers

## Validation Checklist
- [ ] Middleware applied to deprecated route groups, not individual controllers
- [ ] `Deprecation: true` header on all deprecated responses
- [ ] `since` parameter with ISO 8601 date included
- [ ] Paired with `Sunset` header with removal date (RFC 7231 format)
- [ ] `Link` header with migration guide URL
- [ ] Standard RFC 9745 header names used
- [ ] Deprecated endpoints still function correctly
- [ ] Deprecation header deliveries logged for migration tracking
- [ ] CI tests verify deprecated endpoint headers

## Common Failures
- Adding deprecation header but no Sunset header or timeline — not actionable
- Using non-standard header names (`X-Deprecated`)
- Deprecating version but still adding new features to it
- No migration path documented alongside deprecation
- Deprecated endpoints silently breaking without monitoring

## Decision Points
- Version-level vs endpoint-level deprecation — version-level via route group middleware, endpoint-level via attributes
- Deprecation duration — 6 months for standard endpoints, 12 months for critical
- Migration guide — single URL per version vs per-endpoint migration paths

## Performance Considerations
- Header injection adds ~0.01ms per deprecated response
- Config array lookup is O(1)
- Response body deprecation fields add minimal bandwidth

## Security Considerations
- Deprecated versions may have known vulnerabilities — maintain auth/authorization standards
- Never deprecate without an alternative that maintains security standards
- Monitor that consumers don't ignore deprecation headers and continue using unpatched old versions

## Related Rules
- Always Use Middleware For Header Injection
- Use RFC 9745 Standard Header Names
- Pair Deprecation With Sunset Header Always
- Include since Parameter With ISO 8601 Date
- Keep Deprecated Endpoints Fully Functional
- Test Deprecated Endpoints In CI
- Monitor Deprecation Header Frequency

## Related Skills
- URL Path Versioning — for route structure
- Deprecation Link Headers — for `Link` header management
- Sunset Header Implementation — for removal date headers
- Phased Deprecation Timeline — for full deprecation lifecycle

## Success Criteria
- All deprecated responses include `Deprecation` and `Sunset` headers with RFC 9745 compliance
- Migration guide URL is accessible via `Link` header
- Deprecated endpoints continue functioning identically during deprecation window
- CI tests verify both functionality and deprecation headers on deprecated endpoints
- Migration progress is tracked via deprecation header delivery logs
