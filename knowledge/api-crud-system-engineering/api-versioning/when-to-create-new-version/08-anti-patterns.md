# When to Create New Version: Anti-Patterns

## Metadata

| Attribute | Value |
|-----------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Versioning |
| Knowledge Unit | When to Create New Version |
| Phase | 8-anti-patterns |
| Last Updated | 2026-06-03 |

## Anti-Pattern Inventory

1. **Version Avoidance** — No new versions for years despite major changes
2. **Unnecessary Cost** — New version created, maintained for years, used by nobody
3. **Wrong Trigger** — New version created for an internal refactor with no consumer-visible change
4. **Accumulated Conditionals** — Endpoint full of version conditionals when a new version is needed
5. **Premature Versioning** — Creating a new version for every minor change

## Repository-Wide Anti-Patterns

- Creating a new version without a clear migration path for consumers
- Version proliferation — 10+ active versions because "every change deserves its own version"
- Not tracking version proliferation costs
- Not documenting new version creation decisions in ADRs

---

## 1. Version Avoidance

### Category
Technical Debt

### Description
No new API versions are created for years despite significant changes and accumulated complexity. The API surface is full of deprecated, confusing parameters that can't be removed.

### Why It Happens
"Creating a new version is expensive." The team keeps adding backward-compatible changes until the API surface is a mess.

### Warning Signs
- No new MAJOR version in 3+ years
- API surface has many deprecated parameters and endpoints
- Codebase full of version conditionals
- Documentation warns "this parameter is deprecated, don't use it"
- Adding new features requires complex backward-compatibility workarounds
- Developer productivity declining

### Why Harmful
The API becomes increasingly difficult to use and maintain. New consumers have no clean "current version" — they must navigate the accumulated cruft of years of backward-compatible changes.

### Real-World Consequences
After 5 years without a MAJOR version, the API has 30 deprecated parameters, 12 deprecated endpoints, and 8 different authentication methods. New developers spend weeks learning which features to use and which to avoid.

### Preferred Alternative
Periodically create new MAJOR versions to clean the API surface. Remove deprecated features. Provide a clean starting point for new consumers.

### Refactoring Strategy
1. Assess the accumulated deprecated features and complexity
2. Plan a MAJOR version that removes all deprecated items
3. Set a regular cadence for MAJOR versions (every 1-2 years)
4. Communicate the benefits to consumers
5. Provide migration guides

### Detection Checklist
- [ ] No MAJOR version in 3+ years
- [ ] Many deprecated features in current API
- [ ] Codebase has version conditionals everywhere
- [ ] Documentation warns about deprecated features
- [ ] Developer productivity declining

### Related Rules/Skills/Trees
- Rule: API-VERSION-015 (Regular Major Version Cadence)
- Skill: when-to-create-new-version
- Tree: api-governance

---

## 2. Unnecessary Cost

### Category
Waste

### Description
A new API version is created, maintained for 2+ years, and adopted by zero or very few consumers. The effort of creating and maintaining it was wasted.

### Why It Happens
The team believes "build it and they will come." They create a new version without confirming consumer demand or providing compelling reasons to migrate.

### Warning Signs
- New version has < 5% consumer adoption
- Consumers ask "what's different in this version?"
- No migration incentives offered
- Consumer migration not tracked
- Team maintains two versions with similar functionality
- New version created "because it's cleaner" without consumer benefits

### Why Harmful
Engineering effort is wasted on dual maintenance. The team maintains two versions, but the new one has negligible adoption. The old version still requires full support.

### Real-World Consequences
A team invests 6 months creating V3 with a cleaner architecture. After 2 years, 3% of consumers have migrated. The team maintains V2 and V3 simultaneously, spending 25% of engineering time on V3 which nobody uses.

### Preferred Alternative
Only create a new version when there's demonstrated consumer demand or critical improvements. Provide migration incentives. Track adoption.

### Refactoring Strategy
1. Assess consumer demand before creating a new version
2. Provide clear migration benefits (performance, new features)
3. Offer migration support and incentives
4. Track adoption metrics monthly
5. Consider deprecating unused new versions

### Detection Checklist
- [ ] New version has low adoption
- [ ] No consumer demand demonstrated
- [ ] No migration benefits communicated
- [ ] Adoption not tracked
- [ ] Dual maintenance with low value

### Related Rules/Skills/Trees
- Rule: API-VERSION-016 (Consumer-Demand-Driven Versioning)
- Skill: when-to-create-new-version
- Tree: api-governance

---

## 3. Wrong Trigger

### Category
False Positive

### Description
Creating a new API version for an internal implementation change that has no consumer-visible effect. Consumers must migrate with no benefit.

### Why It Happens
Confusing internal implementation versioning with API contract versioning. "We rewrote the code, so it's a new version."

### Warning Signs
- New version has identical consumer contract to old version
- Response structure, fields, and behavior unchanged
- Changelog says "internal architecture changes" for the new version
- No consumer-facing improvements documented
- OpenAPI spec diff shows no differences
- Consumer asks "what changed?"

### Why Harmful
Consumers must do work (update URLs, headers) for zero benefit. Migration resistance is high. The team maintains two identical contracts.

### Real-World Consequences
A team rewrites the backend from Laravel to Go. They release V2 with identical API contracts. Consumers must update all their URLs from `/v1/` to `/v2/` for no functional change. Adoption is <10%. The team maintains both versions.

### Preferred Alternative
Only create a new version for consumer-visible contract changes. Internal implementation changes should be transparent.

### Refactoring Strategy
1. Compare OpenAPI specs between versions
2. If specs are identical, don't create a new version
3. Use feature flags for internal implementation changes
4. If a new version is required, add at least one consumer-visible improvement
5. Document the consumer impact for each version

### Detection Checklist
- [ ] Identical consumer contract across versions
- [ ] No consumer-facing changes documented
- [ ] Internal refactoring cited as reason
- [ ] Low adoption of new version
- [ ] OpenAPI diff shows no differences

### Related Rules/Skills/Trees
- Rule: API-VERSION-017 (Consumer-Visible Changes Only)
- Skill: backward-compatible-changes
- Tree: api-governance

---

## 4. Accumulated Conditionals

### Category
Code Complexity

### Description
The codebase accumulates version conditionals (`if (version === 'v1')`, `if (version === 'v2')`) in controllers, resources, and services. Rather than creating a clean new version, the team adds conditional branches to existing code.

### Why It Happens
The team doesn't want to create a new version. Instead, they add version-specific logic to existing code paths.

### Warning Signs
- Controllers have `if (api_version === 'v1')` branching
- Resources conditionally include fields based on version
- Tests must cover multiple version branches per endpoint
- Adding a feature requires checking all existing version branches
- Code complexity metrics spiking
- Version branching affects >30% of code paths

### Why Harmful
Code becomes complex and fragile. Every change must consider all version branches. Testing matrix grows exponentially. Bugs in version-specific branches are common.

### Real-World Consequences
A controller has 5 version conditionals wrapping different field formats, pagination logic, and error handling. A bug fix for V3 accidentally changes V2 behavior because the conditional boundaries weren't clear. Two versions break simultaneously.

### Preferred Alternative
When version conditionals affect >30% of code paths, create a new version with clean, dedicated code.

### Refactoring Strategy
1. Measure conditional coverage per code path
2. If >30%, create a new version
3. Extract version-specific code to version-specific files
4. Remove conditionals from shared code
5. Test each version independently

### Detection Checklist
- [ ] Version conditionals in controllers
- [ ] Version-specific logic in resources
- [ ] Version branching >30% of code
- [ ] Tests cover all version branches
- [ ] Bug fixes affect wrong versions

### Related Rules/Skills/Trees
- Rule: API-VERSION-018 (Conditional Threshold for New Version)
- Skill: when-to-create-new-version
- Tree: code-organization

---

## 5. Premature Versioning

### Category
Over-Engineering

### Description
Creating a new API version for every minor change or improvement. The team has 10+ versions, most with trivial differences.

### Why It Happens
"Every change deserves its own version." The team creates a new version for any modification, avoiding backward-compatible work entirely.

### Warning Signs
- 10+ active API versions
- Most versions differ by only 1-2 fields
- No version gets sufficient adoption before the next appears
- Consumers frustrated by constant version migrations
- Team spends more time on version management than features
- Documentation coverage per version is low

### Why Harmful
Consumers suffer from "version fatigue" — they can't keep up with the constant changes. Version proliferation increases maintenance cost without proportional value.

### Real-World Consequences
An API has 12 versions in 3 years. Each version has 2-3 changes. Consumers on V3 don't know whether to jump to V12 (too many changes) or stay on V3 (increasingly outdated). Many consumers have abandoned the API entirely.

### Preferred Alternative
Batch changes into fewer, more significant versions. Use backward-compatible additions (new fields, new endpoints) for minor changes. Reserve version creation for meaningful improvements.

### Refactoring Strategy
1. Set a minimum threshold for version-worthy changes
2. Batch planned changes into quarterly releases
3. Use backward-compatible additions for minor changes
4. Deprecate underused versions
5. Limit the number of simultaneously active versions

### Detection Checklist
- [ ] 5+ active versions
- [ ] Versions differ by 1-2 minor changes
- [ ] Consumers frustrated with migration frequency
- [ ] Low adoption per version
- [ ] High version management overhead

### Related Rules/Skills/Trees
- Rule: API-VERSION-019 (Meaningful Version Thresholds)
- Skill: semantic-versioning-for-apis
- Tree: api-governance
