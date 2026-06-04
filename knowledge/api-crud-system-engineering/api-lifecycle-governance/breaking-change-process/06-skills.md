# Skill: Manage Breaking Changes

## Purpose
Govern the introduction of breaking changes through RFC proposals with impact analysis, Change Advisory Board approval, dark launch behind feature flags, tested migration guides, progressive rollout, and 30-day post-migration retention.

## When To Use
- Any breaking change being introduced to a public API
- Changes affecting multiple consumer integrations
- Modifications requiring consumer action before migration
- API surface changes requiring documentation updates

## When NOT To Use
- Additive-only changes (covered by backward compatibility policy)
- Internal refactoring with no consumer-visible impact
- Emergency security fixes (use exception process)

## Prerequisites
- Backward compatibility policy
- Consumer registry with contact information
- Feature flag infrastructure

## Inputs
- Breaking change RFC with impact analysis
- Consumer audit (affected consumers and migration effort)
- Migration guide with tested code examples
- Rollout timeline and monitoring gates

## Workflow
1. Write structured RFC with quantitative impact analysis before implementation — never implement without approved RFC
2. Submit RFC to Change Advisory Board for approval — never bypass for any breaking change regardless of size
3. Dark launch breaking changes behind feature flags — test internally before consumer exposure
4. Create and test every code example in the migration guide before announcement — CI-verified
5. Roll out progressively: 1% → 5% → 25% → 100% of consumers with monitoring gates at each stage
6. Maintain old behavior (deployed but deactivated) for 30 days post-migration cutoff
7. Conduct individual consumer outreach to affected consumers during the migration window

## Validation Checklist
- [ ] RFC written with quantitative impact analysis
- [ ] CAB approval obtained before implementation
- [ ] Breaking change deployed behind feature flag
- [ ] Migration guide created with tested code examples
- [ ] Progressive rollout with monitoring gates (1%→5%→25%→100%)
- [ ] Old behavior retained for 30 days post-cutoff
- [ ] Individual consumer outreach completed
- [ ] Post-migration monitoring active for 30 days

## Common Failures
- Bypassing CAB process for "small" breaking changes
- Underestimating consumer migration effort (always 2x estimate)
- Publishing migration guide too technical or too vague
- Not tracking which consumers have migrated
- Setting sunset date too early due to internal pressure

## Decision Points
- RFC urgency: standard (48h review) vs urgent (24h) vs emergency (4h)
- Progressive rollout stages: 4 stages vs more granular (5-10 stages)
- Post-migration retention: 30 days vs 90 days for complex migrations

## Performance Considerations
- RFC process is human-driven — no significant performance impact
- Impact analysis queries consumer registry — async and cached
- Feature flags add minimal overhead (single boolean check per request)

## Security Considerations
- Security breaking changes may bypass standard CAB via exception path
- Migration guides must not expose vulnerability details before patch deployed
- Emergency exceptions require VP-level sign-off and post-incident review

## Related Rules
- Require RFC with Impact Analysis Before Implementation
- Obtain CAB Approval Before Implementation
- Dark Launch Breaking Changes Behind Feature Flags
- Create Tested Migration Guide Before Rollout
- Progressive Rollout with Monitoring Gates
- Maintain Old Behavior for 30 Days Post-Migration
- Conduct Individual Consumer Outreach

## Related Skills
- Retire API Versions
- Deprecate API Endpoints
- Document API Changelogs

## Success Criteria
- Every breaking change has an approved RFC with impact analysis
- CAB reviews all breaking changes regardless of perceived size
- Breaking changes are dark-launched before consumer exposure
- Migration guides have CI-tested code examples
- Rollout is progressive with monitoring gates at each stage
- Old behavior is available for 30 days post-cutoff
- All affected consumers are individually contacted
