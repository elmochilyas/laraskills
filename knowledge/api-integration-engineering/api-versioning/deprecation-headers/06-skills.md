# Skill: Communicate API Deprecations via Headers

## Purpose
Notify API consumers of upcoming breaking changes using standard deprecation headers (`Sunset`, `Deprecation`, `X-API-Warning`) without disrupting existing behavior.

## When To Use
- Deprecating API fields, endpoints, or versions
- Announcing end-of-life dates for older API versions
- Giving consumers time to migrate before breaking changes

## When NOT To Use
- Breaking changes in internal-only APIs
- Changes where you control all consumers

## Prerequisites
- Existing API with consumers
- Deprecation policy with defined timelines

## Workflow
1. Add `Deprecation: true` header to deprecated endpoints
2. Add `Sunset: {datetime}` header with expected removal date
3. Include `Sunset` link header to migration guide
4. Add `X-API-Warning` with human-readable message
5. Return deprecation headers for all requests to deprecated endpoints
6. Log deprecation header delivery for consumer tracking
7. Monitor deprecated endpoint usage over time
8. Remove endpoints only after sunset date and zero usage

## Validation Checklist
- [ ] `Deprecation: true` header on deprecated endpoints
- [ ] `Sunset` header with ISO datetime
- [ ] `Link` header with migration guide URL
- [ ] `X-API-Warning` with human-readable message
- [ ] Deprecation headers logged for tracking
- [ ] Deprecated endpoint usage monitored
- [ ] Endpoints removed only after sunset + zero usage
