# Skill: Generate API Changelogs

## Purpose
Produce human-readable, sequentially-ordered changelog records combining automated OpenAPI spec diffing with curated migration instructions, covering every released version with categorized change entries.

## When To Use
- Public APIs consumed by external developers
- APIs with formal versioning and release cycles
- Any API where consumers need to track changes
- APIs in active development with frequent changes

## When NOT To Use
- Internal-only APIs with no external consumers
- Prototype/experimental APIs where changelog overhead exceeds value
- Single-consumer APIs where consumer coordinates directly with team

## Prerequisites
- Semantic versioning for APIs
- API versioning strategy
- OpenAPI spec per version

## Inputs
- Previous and current OpenAPI specs
- Git commit history with conventional commits
- Migration instructions for breaking changes

## Workflow
1. Diff previous and current OpenAPI specs using `npx @redocly/cli compare`
2. Categorize changes into Added, Changed, Deprecated, Removed, Fixed, Security
3. Create changelog entry for every released version including patches
4. Write specific behavioral descriptions per change — include endpoint path, what changed, consumer impact
5. Add migration instructions for every breaking change (step-by-step upgrade guide)
6. Link to full OpenAPI spec diff from each version entry
7. Validate changelog presence in CI: block PRs modifying routes without changelog entry
8. Retain all historical entries — never remove past version entries

## Validation Checklist
- [ ] Changelog entry for every released version (major, minor, patch)
- [ ] Categories: Added, Changed, Deprecated, Removed, Fixed, Security
- [ ] Specific change descriptions (not "bug fixes and improvements")
- [ ] Migration instructions for every breaking change
- [ ] Link to full spec diff per version
- [ ] Historical entries retained (reverse chronological order)
- [ ] CI validates changelog presence for route-modifying PRs

## Common Failures
- Changelog only for major versions — consumers miss incremental changes
- Vague descriptions — consumers cannot assess upgrade impact
- No migration guidance — consumers cannot plan breaking change upgrades
- Automated-only changelogs without curation — changes lack context
- Changelog drift from spec — entries claim changes not matching actual spec

## Decision Points
- Source of truth: spec diff vs git conventional commits vs manual curation
- Format: Keep a Changelog vs custom format vs automated release notes
- CI validation: block on changelog absence vs warn vs manual review

## Performance Considerations
- Spec diff time increases with spec size (5-30 seconds for large specs)
- Changelog size grows linearly with versions; negligible storage cost
- No runtime API performance impact

## Security Considerations
- Do not include security vulnerability details before they are patched
- Security entries should use general descriptions until safe disclosure
- Review changelog for accidental exposure of internal implementation details

## Related Rules
- Document Every Version Release Including Patches
- Combine Automated Spec Diff With Curated Migration Notes
- Validate Changelog Presence In CI For Route Changes
- Use Specific Descriptions Not Generic Categories
- Link To Full OpenAPI Spec Diff Per Version
- Never Remove Historical Changelog Entries

## Related Skills
- Document API Versions
- Identify Breaking Changes
- Document Deprecation Notes

## Success Criteria
- Every version release has a changelog entry
- Breaking changes include migration instructions
- Spec diff links provided per version
- CI blocks route changes without changelog entry
- Historical entries are never deleted
- Consumers can plan upgrades from changelog alone
