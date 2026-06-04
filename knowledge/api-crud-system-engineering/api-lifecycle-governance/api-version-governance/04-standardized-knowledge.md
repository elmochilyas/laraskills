# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** api-lifecycle-governance
**Knowledge Unit:** Api Version Governance
**Difficulty:** Advanced
**Category:** Governance & Lifecycle Management
**Last Updated:** 2026-06-03

---

# Overview

API Version Governance is the systematic management of API version lifecycles: defining which versions are active, deprecated, or sunset; establishing policies for breaking vs non-breaking changes; tracking consumer migration; and enforcing minimum supported version commitments. It exists because ungoverned APIs accumulate unsupported versions, fragment the consumer base, increase maintenance burden, and erode trust when breaking changes occur without notice.

Engineers must care because every supported version is a liability. Without governance, teams support N-10 versions indefinitely, security patches spread thin, and API consumers cannot plan migrations. Governance transforms version management from reactive firefighting to proactive lifecycle planning with predictable timelines and clear consumer communication.

---

# Core Concepts

**Version States:** Active (fully supported, receiving features and patches), Deprecated (still operational, migration recommended, no new features), Sunset (removal date communicated, active migration required), Removed (no longer available).

**N-x Support Policy:** The number of previous versions actively maintained. N-2 (current + 2 previous) is standard for public APIs; N-1 is common for internal APIs.

**Breaking Change:** Any API contract modification that would break existing consumers — removing fields, changing response types, altering endpoint semantics, tightening validation.

**Non-Breaking Change:** Additive modifications that do not break existing consumers — adding fields, new endpoints, optional parameters.

**Major-Minor Versioning:** API versions use Major.Minor (v2.0, v2.1) where major signifies breaking changes and minor denotes additive capabilities. Patch versions are irrelevant to API consumers.

**Usage Metrics:** Per-version request counts, active consumer tracking, and migration velocity data that drive deprecation decisions.

**Governance Cadence:** Regular review cycles (typically quarterly) to assess version usage, plan deprecations, schedule sunsets, and update the support matrix.

---

# When To Use

- Multi-version APIs with more than one supported version concurrently
- Public-facing APIs with external consumers who cannot be forced to upgrade
- API platforms serving multiple products or business units
- Enterprise environments requiring formal deprecation and migration processes
- Regulated industries where API version tracking is an audit requirement
- APIs with SLAs that commit to specific support windows
- Teams practicing API-first development with multiple integration consumers

---

# When NOT To Use

- Single-version APIs — governance adds overhead without benefit
- Prototype or internal-only APIs with a single consumer
- Rapidly iterating APIs still finding product-market fit (pre-v1.0)
- APIs where all consumers are controlled by the same deployment pipeline
- Short-lived ephemeral APIs used for data migration or batch processing

---

# Best Practices

**Define clear version nomenclature** before launching v1. Active, Deprecated, Sunset, Removed states must be documented and understood by all stakeholders. Ambiguity in version state causes consumer distrust.

**Adopt N-2 as the default support policy.** Supporting more than current + 2 previous versions creates unacceptable maintenance burden. Internal APIs may use N-1. Document the policy explicitly in the API style guide.

**Enforce Major-only versioning for API contracts.** API versions communicate breaking change boundaries, not patch fixes. Minor versions indicate additive changes within a major version. Never use semantic versioning patch component for API releases.

**Track usage metrics before deprecating.** Without data showing which consumers use which versions, deprecation decisions are guesses. Sample metrics rather than counting every request to avoid infrastructure overhead.

**Set sunset dates at deprecation time.** A deprecated version without a sunset date is effectively still supported — consumers have no urgency to migrate. Minimum 6-month sunset windows are standard for public APIs.

**Document every governance decision in the changelog.** Version state changes, policy updates, and migration paths must be recorded with dates and rationale for audit trail and consumer transparency.

---

# Architecture Guidelines

**Governance operates as a policy layer above individual API implementations.** Version state management should be centralized — not scattered across route files or controllers. A single `ApiVersionGovernor` service class manages state transitions and policy enforcement.

**Usage metrics collection belongs in middleware,** not in business logic. A `VersionUsageMiddleware` samples requests per version and writes to a time-series store or log stream. This keeps governance instrumentation separate from API behavior.

**Version state changes follow a state machine:** Active → Deprecated → Sunset → Removed. Each transition requires specific actions: deprecation triggers migration path documentation; sunset triggers consumer notification; removal triggers 410 Gone responses.

**The changelog is a governance artifact, not a development artifact.** API changelogs record consumer-facing changes only — version state, breaking changes, additions. Internal refactoring without consumer impact does not belong.

**Version governance integrates with CI/CD** through automated checks: no breaking changes allowed on non-major versions, deprecation policy violations block deployments, changelog entries required for version state changes.

---

# Performance Considerations

**Each supported version adds linear maintenance overhead** — code branches, test suites, documentation variants. N-2 is usually the economic maximum before overhead outweighs consumer convenience.

**Multiple versions sharing the same underlying code** (via feature flags or conditional logic) reduces overhead but increases code complexity. Measure the tradeoff: duplication vs conditionals.

**Version usage metrics should be sampled, not counted per-request.** Statistical sampling (1 in 1000 requests) provides sufficient accuracy for deprecation decisions at a fraction of the infrastructure cost.

**Removing a sunset version improves deploy times, reduces codebase complexity, and eliminates associated test runs.** The performance gain from removal is a concrete metric to justify deprecation schedules.

---

# Security Considerations

**Deprecated versions must receive security patches until their sunset date.** A known-vulnerability in a deprecated version that remains exploitable creates organizational liability. Sunset versions faster when CVEs are unpatched.

**Active versions must have security patches within SLA.** Governance must track patch latency per version and escalate when SLAs are missed.

**Old versions with known vulnerabilities accelerate the deprecation timeline.** Security findings override standard deprecation schedules — sunset within 30 days for critical vulnerabilities.

**Version enumeration attacks** — attackers may probe for old, unpatched versions. Monitor for unexpected version usage spikes as a security signal.

**Minimum supported version policy must exclude versions with known critical vulnerabilities.** Governance reviews should check CVE status of all supported versions.

---

# Common Mistakes

**No sunset date on deprecation.** Teams mark versions as deprecated but never set a removal date. Deprecated versions accumulate indefinitely, consumers never migrate, and the maintenance burden grows without bound.

**Supporting too many versions (N-5 or more).** Teams afraid to break consumers keep every version alive. The maintenance burden of testing, securing, and deploying N-5 versions eventually slows all development.

**Breaking changes in non-major versions.** Violating semver by removing fields or changing behavior in a minor/patch version destroys consumer trust and forces emergency consumer-side fixes.

**No usage metrics.** Deprecation decisions made by guesswork. The team doesn't know which consumers use which versions, so they either never deprecate (accumulating versions) or deprecate dangerously (breaking unknown consumers).

**Governance not documented.** Version lifecycle policies exist only in team discussions. New team members, external stakeholders, and API consumers have no reference for what to expect or when.

**Deprecation without migration path.** Informing consumers a version is deprecated without providing a migration guide leaves them stranded. They cannot upgrade without understanding what changed.

**Quarterly reviews skipped.** Version governance requires active maintenance. When reviews are postponed, versions accumulate, sunset dates pass, and governance falls into disrepair.

---

# Anti-Patterns

**Eternal Deprecation:** Deprecated versions without sunset dates that live forever. This defeats the purpose of deprecation — consumers never migrate because there's no consequence.

**Version Hoarding:** Maintaining more versions than economically justified (N-5+). Fear of breaking consumers leads to unsustainable support burden.

**Silent Breaking Changes:** Deploying breaking changes in minor or patch versions without communication. Consumers discover breaks at runtime, destroying trust in the API platform.

**Governance by Anecdote:** Making deprecation decisions based on "I think nobody uses that version" instead of usage metrics. Leads to breaking consumers who were unknown to the team.

---

# Examples

**Version nomenclature documented:**
```
Active v3:     Full support, features + security patches
Deprecated v2: Operational, security patches only, sunset TBD
Sunset v1:     Removal date: 2026-12-31, migrate to v2+
Removed v0:    No longer available
```

**Governance review agenda (quarterly):**
```
1. Review version usage metrics (requests/day per version)
2. Assess any new breaking changes since last review
3. Evaluate deprecation candidates (<5% traffic, >6 months since replacement)
4. Set/confirm sunset dates for deprecated versions
5. Document decisions in changelog
6. Schedule consumer communications
```

---

# Related Topics

**Prerequisites:**
- Versioning Strategy Selection — must choose between URL path, query string, header, or media type versioning
- Deprecation Policy Design — defines the high-level deprecation rules that governance enforces

**Closely Related Topics:**
- API Changelog Maintenance — governance decisions must be recorded
- Breaking Change Management — identifying and communicating breaking changes
- Version Retirement Process — operational steps for sunsetting and removing versions

**Advanced Follow-Up Topics:**
- Automated Version Governance — CI/CD integration for policy enforcement
- Consumer Migration Analytics — tracking and accelerating consumer upgrades

**Cross-Domain Connections:**
- API Style Guide Documentation — governance policies belong in the style guide
- API Usage Tracking — infrastructure for version-level metrics

---

# AI Agent Notes

- Version governance is a policy layer, not implementation — focus on rules and decision criteria, not code
- The key tension is between consumer convenience (keep old versions) and team velocity (remove old versions)
- N-2 is the most common support window, but enterprise SLAs may require longer
- Always link governance rules to the changelog — undocumented governance is unenforceable governance
- Usage metrics are the single most important input to deprecation decisions — if you can't measure usage, you can't govern versions
