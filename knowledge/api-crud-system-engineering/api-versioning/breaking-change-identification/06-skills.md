# Skill: Identify Breaking Changes

## Purpose
Detect breaking changes before they reach production using automated OpenAPI spec diff, snapshot testing, and a systematic categorization framework across field, behavior, contract, and semantic change types.

## When To Use
- Every PR that modifies API behavior or response structure
- Pre-release validation before deploying to production
- When evaluating existing APIs for version bump decisions
- CI pipeline as a pre-merge gate

## When NOT To Use
- Internal code refactoring with no consumer-visible changes
- Documentation-only changes
- Changes to non-API code (background jobs, CLI commands)

## Prerequisites
- OpenAPI spec for the API
- CI pipeline integration access

## Inputs
- Current and new OpenAPI specification files
- PR diff of API-related code

## Workflow
1. Run automated OpenAPI spec diff in CI as pre-merge gate — `oasdiff` or `openapi-diff`
2. Categorize changes by type: field, behavior, contract, semantic
3. Check field semantics not just structure — same name/type can have different meaning
4. Run snapshot tests against known-good response baselines
5. Treat auth/header changes as breaking — never deploy as MINOR or PATCH
6. Maintain a breaking change registry with rationale, migration path, and impact
7. Label breaking changes in changelog with `BREAKING` prefix and type category
8. Block CI pipeline if breaking changes are detected without approved registry entry

## Validation Checklist
- [ ] Automated OpenAPI spec diff runs in CI for every PR
- [ ] Breaking change checklist reviewed for every API change
- [ ] Snapshot tests exist for critical API responses
- [ ] Field semantics verified — not just structure
- [ ] Auth/header changes classified as breaking
- [ ] Breaking changes logged in registry with rationale and migration path

## Common Failures
- Only checking field structure, not field semantics (e.g., `active: 1` vs `active: true`)
- Missing behavior changes — pagination limit changed, sort order changed
- Assuming enum value addition is safe (some clients use exhaustive switch)
- Not checking error response shape changes
- False positive fatigue from overly strict detection

## Decision Points
- Automated vs manual detection — automated for structure, manual for semantics
- Block CI vs warn only — block for public APIs, warn for internal
- Breaking vs non-breaking reclassification — document any reclassification decision

## Performance Considerations
- Automated diff runs in CI — zero production impact
- Snapshot tests add ~50ms per endpoint in test suite
- Response comparison runs during staging, ~100ms per comparison

## Security Considerations
- Auth/authorization changes are breaking — test security policies unchanged
- Breaking changes affecting error responses can hide security errors
- Breaking change detection must include audit log and security header changes

## Related Rules
- Run Automated OpenAPI Spec Diff In CI
- Categorize Breaking Changes In Changelog
- Check Field Semantics Not Just Structure
- Snapshot Test Every Public API Response
- Treat Auth/Header Changes As Breaking
- Maintain A Breaking Change Registry

## Related Skills
- Backward Compatible Changes — contrast against breaking changes
- Semantic Versioning For APIs — mapping break type to version bump
- Snapshot Testing — response baseline verification

## Success Criteria
- No breaking change reaches production undetected
- Every breaking change has a registry entry with migration path
- CI blocks PRs with unapproved breaking changes
- Snapshot tests catch response shape drift
- Breaking changes are categorized and communicated in changelog