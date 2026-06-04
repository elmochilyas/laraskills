# Semantic Versioning for APIs: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | Semantic Versioning for APIs |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Version Inflation** — MAJOR bumped too frequently, consumers ignore version signals
2. **Version Stagnation** — Fear of MAJOR bumps leads to breaking changes shipped as MINOR
3. **No Automated Enforcement** — Developers claim to follow SemVer but CI doesn't enforce it
4. **MAJOR for Internal Refactors** — Bumping MAJOR for changes that don't affect the consumer
5. **MINOR for Breaking Changes** — Bumping MINOR to avoid having "the MAJOR version conversation"

## Repository-Wide Anti-Patterns

- Not documenting what MAJOR/MINOR/PATCH means for the specific API
- Inconsistent version bumping across microservices
- Using version numbers that don't correspond to SemVer (e.g., `v2.3.1` in URL path)
- Not publishing a version compatibility table

---

## 1. Version Inflation

### Category
Signal Noise

### Description
MAJOR version is bumped too frequently — multiple times per year for any change that could be considered "breaking." Consumers become desensitized and ignore version signals.

### Why It Happens
"Any breaking change = MAJOR bump" is applied literally without considering the practical impact. Every minor behavioral change triggers a new major version.

### Warning Signs
- MAJOR version changes quarterly or monthly
- Consumers still on V1 because "there's a new major version every quarter"
- New MAJOR versions have minimal adoption
- Consumers ask "do I really need to upgrade?"
- Multiple MAJOR versions actively maintained simultaneously
- Version inflation accepted as normal

### Why Harmful
The cost of creating a MAJOR version (documentation, testing, migration, dual maintenance) is incurred frequently without proportional consumer benefit. Consumers learn to stay on old versions.

### Real-World Consequences
An API releases V7 in two years. Consumers are still on V3. Each MAJOR version had 2-3 changes, none critical. Consumers ignore version upgrade emails. The team spends 40% of engineering time maintaining 5 active versions.

### Preferred Alternative
Reserve MAJOR bumps for significant, high-impact changes. Use MINOR for backward-compatible additions. Communicate the significance of each MAJOR release.

### Refactoring Strategy
1. Review past MAJOR bumps — identify which were truly necessary
2. Define clear criteria for what warrants a MAJOR version
3. Consider using MINOR for changes that are technically breaking but have defaults
4. Consolidate planned breaking changes into fewer MAJOR releases
5. Communicate the upgrade significance per version

### Detection Checklist
- [ ] MAJOR bumped > 1/year
- [ ] Low adoption of new MAJOR versions
- [ ] High version number (V7+) with few actual changes
- [ ] Consumers stay on old versions

### Related Rules/Skills/Trees
- Rule: API-SEMVER-001 (MAJOR Bump Discipline)
- Skill: semantic-versioning-for-apis
- Tree: api-governance

---

## 2. Version Stagnation

### Category
Technical Debt

### Description
Fear of creating a new MAJOR version leads to breaking changes being shipped as MINOR or PATCH releases. Consumers don't expect breaking changes in MINOR updates and their integrations break.

### Why It Happens
"Creating a MAJOR version is expensive." The team avoids the cost by labeling breaking changes as MINOR, hoping consumers won't notice.

### Warning Signs
- MINOR version bumps include field removals or behavioral changes
- Consumers report "this MINOR update broke our integration"
- Changelog shows breaking changes in MINOR entries
- No distinction between breaking and non-breaking MINOR releases
- Team avoids MAJOR because "it's too much work"

### Why Harmful
SemVer guarantees are broken. Consumers cannot trust version signals. They must manually review every MINOR release for breaking changes, defeating the purpose of SemVer.

### Real-World Consequences
An API ships a field removal as MINOR 2.4.0. A consumer's auto-update pipeline applies all MINOR updates. The field removal breaks their integration. They pin to 2.3.x and never upgrade again.

### Preferred Alternative
Follow strict SemVer: breaking changes require a MAJOR version. If the MAJOR creation cost is too high, batch multiple breaking changes into a single MAJOR release.

### Refactoring Strategy
1. Audit past releases for SemVer violations
2. Add automated CI check that prevents breaking changes in MINOR/PATCH
3. Plan MAJOR releases with multiple breaking changes bundled
4. Reduce the cost of MAJOR creation (automation, templates)
5. Communicate the importance of SemVer to the team

### Detection Checklist
- [ ] Breaking changes in MINOR releases
- [ ] Consumers report broken upgrades
- [ ] Changelog shows breaking changes in MINOR
- [ ] No automated SemVer enforcement
- [ ] MAJOR considered "too expensive"

### Related Rules/Skills/Trees
- Rule: API-SEMVER-002 (Breaking Changes Require MAJOR)
- Skill: when-to-create-new-version
- Tree: api-governance

---

## 3. No Automated Enforcement

### Category
Process Failure

### Description
The team claims to follow SemVer but there's no automated check that enforces it. Developers manually decide the version bump, and decisions are inconsistent.

### Why It Happens
"Everyone knows SemVer." The team assumes manual review is sufficient.

### Warning Signs
- Version bump is decided manually in release meetings
- No OpenAPI diff or breaking change detection in CI
- Different developers have different thresholds for MAJOR vs MINOR
- Retrospectives reveal "that should have been a MAJOR"
- Changelog inconsistent with SemVer conventions

### Why Harmful
Version numbers lose meaning. Without enforcement, human bias and pressure lead to incorrect versioning. Consumers cannot rely on version signals.

### Real-World Consequences
A team manually decides "this is MINOR" for a change that removes a field. The CI doesn't verify SemVer compliance. Consumers break. The next release, the team overcorrects and bumps MAJOR for a trivial change, unnecessarily creating a new version.

### Preferred Alternative
Implement automated OpenAPI diff in CI that determines the required version bump based on change classification.

### Refactoring Strategy
1. Add OpenAPI spec diff to CI pipeline
2. Automate version bump calculation based on diff results
3. Fail CI if manual version bump doesn't match automated classification
4. Generate changelog entries from diff results
5. Train team to read and interpret diff output

### Detection Checklist
- [ ] No automated SemVer enforcement
- [ ] Manual version bump decisions
- [ ] Inconsistent MAJOR/MINOR classification
- [ ] Consumers report unexpected breaking changes
- [ ] Changelog inconsistent with version bumps

### Related Rules/Skills/Trees
- Rule: API-SEMVER-003 (Automated Version Calculation)
- Skill: breaking-change-identification
- Tree: ci-pipeline

---

## 4. MAJOR for Internal Refactors

### Category
False Positive

### Description
Creating a new MAJOR API version for internal implementation changes that have no consumer-visible effect. The contract is unchanged but version is bumped.

### Why It Happens
Confusing implementation versioning with API contract versioning. A database migration or code refactor prompts a version bump even though the response format is identical.

### Warning Signs
- MAJOR bump with no response structure changes
- Changelog says "internal refactoring" for MAJOR release
- OpenAPI spec diff shows no breaking changes
- Consumer doesn't need to change anything
- New MAJOR version has identical consumer contract to the old

### Why Harmful
Unnecessary new version creation. Consumers must update URLs or headers for no benefit. The team maintains two versions with identical contracts. The new version has zero adoption because consumers see no reason to migrate.

### Real-World Consequences
A team creates V2 because they migrated from MySQL to PostgreSQL. The API contract is identical. Consumers must update their API URLs from `/api/v1/` to `/api/v2/` for no functional difference. Adoption is <5% after a year.

### Preferred Alternative
Use MAJOR only for contract-breaking changes. Internal implementation changes should be transparent to consumers.

### Refactoring Strategy
1. Avoid version bumps for internal-only changes
2. Use feature flags for gradual internal changes
3. If a version bump is required, add at least one consumer-visible improvement
4. Document the consumer impact for each version

### Detection Checklist
- [ ] MAJOR bump with no consumer-visible change
- [ ] OpenAPI spec unchanged
- [ ] No consumer migration required
- [ ] Low adoption of new version

### Related Rules/Skills/Trees
- Rule: API-SEMVER-004 (Contract-Focused Versioning)
- Skill: semantic-versioning-for-apis
- Tree: api-governance

---

## 5. MINOR for Breaking Changes

### Category
False Negative

### Description
Deliberately labeling a breaking change as MINOR to avoid the effort and conversation around a MAJOR version bump.

### Why It Happens
"Nobody will notice." The team rationalizes that the breaking change affects few consumers, so they can avoid the MAJOR bump.

### Warning Signs
- Known breaking changes labeled as MINOR
- Release notes downplay breaking changes
- Team avoids MAJOR "conversation" with stakeholders
- Consumers surprised by breaking changes in MINOR releases
- No consumer impact assessment before version decision

### Why Harmful
Fraudulent versioning — the version number implies backward compatibility but doesn't provide it. Consumers who trust SemVer are betrayed.

### Real-World Consequences
A product manager says "we can't call this V3, we just released V2." The team ships a breaking field rename as V2.1.0 (MINOR). Consumers on auto-update receive the breaking change unexpectedly. Several integrations break.

### Preferred Alternative
Follow strict SemVer regardless of difficulty. If a MAJOR bump is politically difficult, batch multiple breaking changes and communicate the value clearly.

### Refactoring Strategy
1. Establish that SemVer is non-negotiable
2. Create a process for communicating MAJOR version value to stakeholders
3. Batch breaking changes to reduce MAJOR release frequency
4. Add CI enforcement that prevents MINOR bumps with breaking changes
5. Document the cost of SemVer violations

### Detection Checklist
- [ ] Known breaking changes in MINOR release
- [ ] Team avoids MAJOR conversation
- [ ] Consumers break on MINOR updates
- [ ] No automated detection of SemVer violations
- [ ] Product pressure to minimize version numbers

### Related Rules/Skills/Trees
- Rule: API-SEMVER-005 (SemVer Integrity)
- Skill: breaking-change-identification
- Tree: api-governance
