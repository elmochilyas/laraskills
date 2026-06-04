# Skill: Validate Documentation in CI

## Purpose
Automate OpenAPI spec validation in CI/CD pipelines including syntax linting, breaking change detection, completeness checks, changelog presence validation, and contract testing for both success and error paths.

## When To Use
- Every API with a published OpenAPI spec
- Public APIs consumed by external developers
- APIs generating SDKs from their spec
- CI pipelines where documentation is part of the deliverable

## When NOT To Use
- Prototype/experimental APIs with no external consumers
- Documentation maintained separately from code
- APIs without formal documentation pipeline

## Prerequisites
- CI/CD pipeline (GitHub Actions, GitLab CI, etc.)
- OpenAPI spec generated or maintained in repository
- Redocly CLI or equivalent linting tool

## Inputs
- OpenAPI spec file
- Previous released spec for diff comparison
- Contract test configuration
- Changelog file

## Workflow
1. Run `npx @redocly/cli lint` on the OpenAPI spec for every PR modifying routes or schema files
2. Run breaking change detection against the latest released spec — block PRs introducing breaking changes without version bump
3. Validate changelog presence: block PRs modifying route files without corresponding changelog entry
4. Store validated spec as a CI artifact tagged with build number for historical traceability
5. Split validation into fast checks (lint, breaking changes) on every commit and slow checks (full contract test suite) on merge to main
6. Write contract tests for error responses (400, 401, 403, 404, 422, 429, 500) in addition to success responses
7. Archive each build's validated spec for post-mortem analysis and spec diff comparisons

## Validation Checklist
- [ ] Lint step runs on every PR (syntax, structure, OpenAPI compliance)
- [ ] Breaking change detection against previous version
- [ ] Changelog presence check for route-modifying PRs
- [ ] Validated spec stored as CI artifact
- [ ] Fast checks on every commit; slow contract tests on merge to main
- [ ] Error response contract tests covering all documented error status codes
- [ ] Success response contract tests per endpoint

## Common Failures
- No documentation validation — docs silently drift
- Only syntax validation (valid ≠ complete content)
- No breaking change detection — breaking changes discovered after deployment
- Contract tests only for happy path — error response schemas never validated
- Validation as bottleneck — 15-minute checks cause developers to bypass

## Decision Points
- Linting ruleset: recommended (Redocly) vs custom team rules
- Breaking change policy: block PR vs warn vs manual review gate
- Contract test frequency: every PR vs nightly vs on merge to main

## Performance Considerations
- Spec lint: 1-10 seconds
- Breaking change diff: 5-30 seconds
- Full contract test suite for 100 endpoints: 2-10 minutes
- Split fast/slow checks to avoid developer workflow friction

## Security Considerations
- Spec exposes full API surface — protect generated specs if API is internal
- Never commit real credentials in contract test configurations
- Review custom validation rules for security-relevant documentation gaps

## Related Rules
- Lint The OpenAPI Spec On Every PR
- Run Breaking Change Detection Against The Previous Version
- Validate Changelog Entry For Route-Modifying PRs
- Run Contract Tests On Error Paths Not Just Happy Paths
- Store Validated Spec As A CI Artifact
- Split Fast And Slow Validation Checks

## Related Skills
- Generate API Changelogs
- Document Endpoint Content
- Identify Breaking Changes

## Success Criteria
- PRs with invalid specs are blocked before merge
- Breaking changes are detected before deployment
- Changelog entries are mandatory for route changes
- Archived specs provide historical traceability
- Error response schemas are contract-tested alongside success responses
- CI validation runs in under 2 minutes for fast checks
