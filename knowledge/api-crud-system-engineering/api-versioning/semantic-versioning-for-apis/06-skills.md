# Skill: Apply Semantic Versioning to APIs

## Purpose
Apply MAJOR.MINOR.PATCH versioning to API contracts where MAJOR signals breaking changes requiring new version, MINOR signals backward-compatible additions, and PATCH signals implementation-only bug fixes transparent to consumers.

## When To Use
- Any API with formal versioning and compatibility promises
- APIs consumed by third-party developers relying on version signals
- Teams using conventional commits to automate version bumps
- APIs with long-term support (LTS) version policies

## When NOT To Use
- Internal-only APIs with single consumer
- Prototypes and experimental APIs
- Date-based versioning (e.g., Stripe's date-based) is an alternative

## Prerequisites
- Breaking change identification process
- Conventional commits convention

## Inputs
- OpenAPI spec diff results
- Conventional commit history

## Workflow
1. Document MAJOR/MINOR/PATCH definitions specific to your API — MAJOR is contract breaking
2. Scope URL path versioning to MAJOR only — `/api/v1/`, never include MINOR or PATCH
3. Run automated OpenAPI spec diff in CI to determine required version bump
4. Enforce conventional commit mapping — `feat!` → MAJOR, `feat` → MINOR, `fix` → PATCH
5. Keep PATCH releases as zero contract change — implementation fixes only
6. Publish version compatibility table — maps versions to semver, status, removal dates
7. Maintain version changelog generated from conventional commits
8. Define LTS versions with 24-month minimum support window
9. Never ship breaking changes as MINOR to avoid the MAJOR conversation

## Validation Checklist
- [ ] MAJOR/MINOR/PATCH definitions documented for the API
- [ ] URL version reflects MAJOR only
- [ ] Automated OpenAPI diff determines version bumps
- [ ] PATCH releases have zero contract change
- [ ] Version manifest maintained and published
- [ ] Changelog maps versions to release dates and changes
- [ ] LTS version policy defined

## Common Failures
- Bumping MAJOR for internal refactors that don't change the contract
- Bumping MINOR for breaking changes to avoid the MAJOR conversation
- Including MINOR/PATCH in URL path
- Not documenting what version numbers mean for your specific API

## Decision Points
- SemVer vs date-based versioning — SemVer for compatibility signals, date for time-based clarity
- URL MAJOR only vs full semver in header — URL for simplicity, header for precision
- LTS vs standard versions — LTS for enterprise, standard for fast-moving features

## Performance Considerations
- OpenAPI diff runs in CI — zero runtime cost
- Version header injection adds ~0.01ms
- Config version reads are cached by Laravel — O(1)

## Security Considerations
- PATCH releases deployable without communication but security patches should be announced
- LTS versions must continue receiving security updates
- Version ambiguity can lead to consumers running on unpatched versions

## Related Rules
- Bump MAJOR Only For Consumer-Visible Breaking Changes
- Use URL MAJOR Version Only
- Automate Version Bump Detection In CI
- Patch Releases Must Have Zero Contract Change
- Publish A Version Compatibility Table
- Never Ship Breaking Changes As MINOR

## Related Skills
- Breaking Change Identification — input for MAJOR decisions
- When To Create New Version — deciding when MAJOR is needed
- Version Retirement Policy — end-of-life for old versions

## Success Criteria
- Version numbers accurately reflect contract changes
- MAJOR bumps only happen for genuine breaking changes
- PATCH releases never contain contract changes
- Consumers can check version compatibility table
- Automated CI enforces semver rules on every PR