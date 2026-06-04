# Skill: Implement Sunset HTTP Header

## Purpose
Add `Sunset` HTTP header to deprecated API responses with RFC 7231 formatted removal date, paired with Deprecation header, and configurable per-version schedule.

## When To Use
- Deprecated API versions with known removal dates
- Alongside Deprecation header for complete signaling
- Version retirement planning

## When NOT To Use
- Versions not yet deprecated
- Without confirmed removal date

## Prerequisites
- Deprecation header implementation
- Version governance policy

## Inputs
- Removal dates per deprecated version/endpoint

## Workflow
1. Set `Sunset` header with RFC 7231 formatted date: `Sunset: Sat, 31 Dec 2026 23:59:59 GMT`
2. Always pair with `Deprecation: true` and `since` parameter
3. Apply via middleware on deprecated route groups, not controllers
4. Configure sunset dates per version in config file
5. Use consistent date format — RFC 7231, GMT timezone
6. Include `Link` header with migration guide: `Link: <https://docs.example.com/migration>; rel="deprecation"`
7. Monitor sunset header delivery for consumer migration tracking
8. Remove sunset header after removal date — endpoint returns 410 Gone instead
9. Extend sunset date if consumer migration is insufficient
10. Test sunset header presence on deprecated endpoints

## Validation Checklist
- [ ] Sunset header with RFC 7231 date on deprecated responses
- [ ] Paired with Deprecation header
- [ ] Applied via middleware on route groups
- [ ] Sunset dates configured per version
- [ ] Consistent RFC 7231 GMT format
- [ ] Link header to migration guide
- [ ] Sunset header delivery monitored
- [ ] Removed after sunset date (replaced with 410)
- [ ] Sunset dates extendable based on migration
- [ ] Tests verify sunset header

## Related Rules
- Pair Sunset With Deprecation Header
- Use RFC 7231 Date Format
- Apply Via Middleware On Route Groups
- Monitor Sunset Header Delivery
- Remove Sunset Header After Removal Date

## Related Skills
- Deprecation Header Implementation
- Deprecation Link Headers
- Version Governance
