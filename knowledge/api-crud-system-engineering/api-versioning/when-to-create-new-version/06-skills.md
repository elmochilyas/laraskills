# Skill: Decide When to Create a New Version

## Purpose
Evaluate proposed API changes against a decision framework to determine whether a new version is needed, a backward-compatible change suffices, or backward-compatible-with-work is possible — with cost/benefit analysis and ADR documentation.

## When To Use
- When evaluating a proposed breaking change
- When accumulated non-breaking changes create excessive complexity
- Before committing to a new major version
- As part of API lifecycle governance

## When NOT To Use
- For trivial backward-compatible additions (new field, new endpoint)
- When the change is internal-only with no consumer-visible impact
- When the change can be made backward-compatible with a default value

## Prerequisites
- Understanding of backward-compatible change patterns
- Breaking change identification process

## Inputs
- Change specification (what is changing and why)
- Compatibility assessment

## Workflow
1. Exhaust all backward-compatible options first — optional fields, new endpoints, relaxed validation
2. Implement `VersionDecisionService` that programmatically evaluates change against decision tree
3. Ask: Is the change breaking? → Can it be made compatible? → New version or not
4. Evaluate cost of new version: development, testing, documentation, consumer education, dual maintenance
5. Consider beta/preview flag within current version before committing to full new version
6. Document every version creation decision in an ADR — context, assessment, cost, decision
7. Create new version only when team can commit to maintaining it for expected lifespan (2+ years)
8. Monitor version proliferation — max 3 concurrently active versions
9. Allocate 20% of lifecycle cost to consumer migration tooling

## Validation Checklist
- [ ] Version creation decision framework documented and followed
- [ ] Every new version has ADR with rationale and cost estimate
- [ ] Backward-compatible options exhausted before new version
- [ ] Migration plan exists for every new version
- [ ] Version proliferation monitored (max 3 active versions)
- [ ] 20% of lifecycle cost allocated to migration tooling

## Common Failures
- Creating new version for change that could have been backward-compatible
- Accumulating so many conditionals in one version that new version would be cleaner
- Creating new version without clear migration path
- Version proliferation — 10+ active versions

## Decision Points
- Breaking vs non-breaking — use automated OpenAPI diff as objective arbiter
- Beta flag vs new version — beta for experimental features, new version for contract breaks
- Cost of versioning vs cost of not versioning — versioning for stability, not for convenience

## Performance Considerations
- No direct performance impact from the decision-making process
- Creating new version adds ~1-2 KB to route cache — negligible
- Accumulated conditionals in single version create if-else chains

## Security Considerations
- New version is opportunity to fix security debt in old version's implementation
- Ensure new version doesn't introduce security regressions
- Old versions must continue receiving security patches until fully deprecated

## Related Rules
- Exhaust Backward-Compatible Options First
- Use A Decision Tree Service For Version Evaluation
- Document Every New Version With An ADR
- Create New Version Only When You Can Maintain It
- Monitor Version Proliferation — Max 3 Active Versions
- Consider Beta Flags Before Committing To New Version

## Related Skills
- Backward Compatible Changes — options to exhaust before new version
- Breaking Change Identification — input for decision tree
- Semantic Versioning For APIs — version numbering rules
- Version Retirement Policy — lifecycle after creation

## Success Criteria
- New versions created only when truly necessary
- Every new version has documented rationale and migration plan
- Backward-compatible options are always exhausted first
- Version count stays within team's maintenance capacity
- Consumers can migrate with clear guides and tooling