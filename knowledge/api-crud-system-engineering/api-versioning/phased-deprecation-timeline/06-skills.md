# Skill: Implement Phased Deprecation Timeline

## Purpose
Move consumers from an old API version to a new version through defined stages — Announce, Warn, Enforce, Remove — with config-driven dates, automated phase transitions, and phase-specific middleware behavior.

## When To Use
- Every API version deprecation with a defined lifecycle
- Public APIs with third-party consumers who need migration time
- Any version removal where consumer impact must be managed

## When NOT To Use
- Internal-only versions with a single known consumer
- Emergency removals (security vulnerabilities) requiring immediate action
- Experimental/pre-release versions (no consumer commitment)

## Prerequisites
- Versioning strategy in place
- Deprecation header implementation

## Inputs
- Phase transition dates per version
- Degradation configuration per phase

## Workflow
1. Define phase enum — `PRE_ANNOUNCEMENT`, `ANNOUNCED`, `WARNING`, `ENFORCEMENT`, `REMOVED`
2. Store phase transition dates in configuration — automate transitions via scheduled command
3. Implement phase middleware that checks version phase and applies behavior
4. Announce phase — blog post, email, dashboard notification (never skip)
5. Warn phase — add Deprecation + Sunset headers (minimum 3-6 months for public)
6. Enforce phase — gradual degradation (rate limiting, intentional latency, not instant breakage)
7. Remove phase — return 410 Gone with migration message and link
8. Guard state machine — never transition directly from Announce to Remove
9. Provide phase status endpoint for consumers to check version lifecycle
10. Track consumer migration percentage per phase before advancing

## Validation Checklist
- [ ] Four phases defined and implemented in middleware
- [ ] Phase dates configured for each deprecated version
- [ ] Automated phase transition scheduled (daily)
- [ ] Warn phase minimum 3-6 months for public APIs
- [ ] Enforce uses gradual degradation, not instant breakage
- [ ] Remove returns 410 Gone with migration message
- [ ] Phase state machine prevents skip transitions
- [ ] Consumer migration percentage tracked

## Common Failures
- Skipping Announce phase — consumers surprised by warnings
- Warn phase too short (<30 days) — consumers can't migrate
- Enforce phase too harsh (rate limit to 0) — effectively instant removal
- No clear Remove phase — endpoints just stop working without 410

## Decision Points
- Automation vs manual transition — automated for consistency, manual for controlled rollouts
- Degradation severity — mild pressure vs strong enforcement
- Migration % threshold — typical 90% before advancing to Enforce

## Performance Considerations
- Phase check is single config lookup — O(1), negligible
- Enforcement phase rate limiting adds overhead per request
- Degradation latency during Enforce — use carefully

## Security Considerations
- Announce phase should include security implications of migration
- Ensure rate limiting in Enforce doesn't cause DoS for legitimate migration traffic
- Post-removal 410 should state no security support for removed version

## Related Rules
- Always Implement All Four Phases
- Use Config-Driven Dates For Automated Transitions
- Keep Warn Phase At Least Three Months
- Never Transition Directly From Announce To Remove
- Implement Enforcement As Degradation
- Return 410 Gone With Migration Message

## Related Skills
- Deprecation Header Implementation — headers used in Warn phase
- Sunset Header Implementation — removal date headers
- Version Retirement Policy — final removal procedures
- When To Create New Version — triggers for version creation

## Success Criteria
- All deprecated versions follow defined phase lifecycle
- Phase transitions are automated and config-driven
- Consumers receive 3-6 months warning before enforcement
- Degradation during enforcement is gradual, not instant breakage
- Removed versions return 410 with migration path