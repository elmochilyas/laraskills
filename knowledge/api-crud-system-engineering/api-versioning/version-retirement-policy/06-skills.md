# Skill: Implement Version Retirement Policy

## Purpose
Define and enforce the rules and procedures for removing old API versions: minimum notice periods, eligibility criteria, automated checks, exception handling, and post-retirement validation.

## When To Use
- When an API version has been deprecated and meets retirement criteria
- As part of API lifecycle governance — regular retirement cadence
- When setting consumer expectations about version support windows

## When NOT To Use
- For versions still actively used by significant consumer percentage
- When no stable alternative version exists
- During peak business periods or holidays

## Prerequisites
- Phased deprecation timeline in place
- Alternative stable version exists

## Inputs
- Retirement policy configuration (notice periods, criteria)
- Version traffic analytics

## Workflow
1. Publish retirement policy publicly at stable URL — minimum notice periods (12mo public, 6mo internal)
2. Define retirement criteria — traffic <1% for 60 days, notice period met, alternative stable
3. Never retire a version without a stable alternative available
4. Automate retirement eligibility checks — weekly scheduled command evaluates criteria
5. Use retirement queue prioritized by traffic — remove least-used versions first
6. Maintain exception register with rationale, approver, and expiry for all exceptions
7. Maintain 410 Gone responses for 90 days after retirement for consumer debugging
8. Use config-gated route loading so retired versions can be restored immediately
9. Run post-retirement validation — automated tests verify retired versions return 410

## Validation Checklist
- [ ] Retirement policy published publicly
- [ ] Minimum notice period defined (12mo public, 6mo internal)
- [ ] Retirement criteria enforced (traffic %, notice period, alternative stability)
- [ ] Retirement queue maintained with priority scoring
- [ ] Exception register maintained with approval chain
- [ ] Post-retirement 410 maintained for 90 days
- [ ] Post-retirement validation runs automatically

## Common Failures
- Having retirement policy but not enforcing it — versions never removed
- Retiring version while alternative is still in beta or unstable
- Not having exception process — every retirement is rigid or arbitrary
- Making too many exceptions — policy becomes meaningless

## Decision Points
- Automated vs manual retirement — automated for low-traffic, manual for high-traffic
- Exception approval level — manager for minor, VP for major exceptions
- 410 duration — 90 days standard, extended for high-traffic versions

## Performance Considerations
- Retirement policy evaluation runs offline — zero runtime cost
- Exception handling is a process, not code — no performance impact
- Post-retirement validation runs as test suite, not in production

## Security Considerations
- Emergency retirement process for security vulnerabilities (bypasses standard timeline)
- Ensure retired versions don't accidentally serve data due to configuration drift
- Post-retirement audit to verify retired versions return 410

## Related Rules
- Publish The Retirement Policy Publicly
- Never Retire Without A Stable Alternative
- Automate Retirement Eligibility Checks
- Use A Retirement Queue Prioritized By Traffic
- Maintain Exception Register With Approval Chain
- Post-Retention 410 Guarantee For 90 Days

## Related Skills
- Phased Deprecation Timeline — phases leading to retirement
- When To Create New Version — trigger for creating replacement
- Route File Organization — config-gated loading for emergency restore

## Success Criteria
- Retirement policy is published and followed consistently
- All retired versions have alternatives available
- Low-traffic versions are automatically queued for retirement
- Exception register tracks all deviations with approvals
- Retired versions return 410 with migration info for 90+ days