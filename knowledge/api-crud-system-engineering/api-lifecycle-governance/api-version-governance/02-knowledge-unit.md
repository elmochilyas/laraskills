# API Version Governance

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** api-lifecycle-governance
- **Knowledge Unit:** API Version Governance
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-04

---

## Executive Summary
API Version Governance establishes the policies, conventions, and organizational rules that control how API versions are introduced, deprecated, and retired. Engineers who implement strong version governance avoid breaking consumers, reduce technical debt from orphaned versions, and maintain clear communication about API lifecycle events.

---

## Core Concepts
- **Version Policy Definition**: Codified rules specifying when a new version is required versus when backward-compatible changes are acceptable
- **Deprecation Timeline**: The mandated period between announcing a version as deprecated and its retirement, giving consumers time to migrate
- **Breaking Change Taxonomy**: A classification system that defines what constitutes a breaking change in the context of your API consumers
- **Consumer Communication Channels**: The mechanisms used to notify consumers about version changes (headers, documentation, sunset headers)
- **Version Sunset Enforcement**: Technical gates that prevent consumers from using retired versions after the sunset date

---

## Mental Models
1. **Contract Law Model**: Treat each API version as a legally binding contract. Breaking a contract without proper notice erodes trust. Version governance defines the terms of renegotiation.
2. **Public Transit Schedule Model**: API versions are like train lines — they need clear schedules, advance notice of closures, and alternative routes for displaced riders.

---

## Internal Mechanics
The governance lifecycle begins when a proposed change is classified as breaking or non-breaking via the breaking change taxonomy. If breaking, a governance review determines whether a new version is warranted. A deprecation policy defines the minimum support window (e.g., 6 months), during which the old version runs alongside the new one. Sunset headers (`Sunset`, `Deprecation`) are added to responses. At end-of-life, requests to the retired version receive `410 Gone` or `404 Not Found` with a link to the current version.

---

## Patterns

### Pattern 1: Semantic Versioning Governance
**Purpose**: Align API versions with semver (v1, v2, v3) based on breaking changes
**Benefits**: Clear, industry-standard communication about change severity
**Tradeoffs**: Major version bumps can accumulate, leading to many supported versions

### Pattern 2: Calendar-Based Version Governance
**Purpose**: Release new versions on a fixed schedule regardless of breaking changes
**Benefits**: Predictable cadence for consumers; avoids version bloat
**Tradeoffs**: Forces migration even when no breaking changes exist

---

## Architectural Decisions
### When To Use
- Public APIs with external consumers who cannot coordinate upgrades
- Multi-team environments where version policies prevent miscommunication
- Compliance-adjacent systems requiring audit trails for API changes

### When To Avoid
- Internal-only APIs where consumers are controlled and can upgrade immediately
- Prototypes or early-stage products where rapid iteration trumps stability

### Alternatives
- No formal governance (informal coordination only) for small internal teams
- Backward-compatible-only approach (never release new versions, only additive changes)

---

## Tradeoffs
| Benefit | Cost | Consequence |
|---------|------|-------------|
| Consumer trust and stability | Governance overhead slows releases | Fewer but safer deployments |
| Clear deprecation communication | Multiple supported versions increase maintenance | Higher infrastructure and testing costs |
| Audit trail for compliance | Requires dedicated tooling and process | Additional team training needed |

---

## Performance Considerations
- Version routing logic should be O(1) — use middleware or route prefixes, not runtime string parsing
- Multiple active versions can double database query patterns; consider version-agnostic data access layers

---

## Production Considerations
- Automate sunset header injection via middleware so no developer can forget
- Monitor deprecated version usage to know when sunset is safe
- Maintain a public changelog and a version lifecycle page in your API documentation
- Test all versions in CI to avoid regression in old versions when deploying changes

---

## Common Mistakes
**Overly vague deprecation policy**: "We'll support old versions for a reasonable time" — without specific timelines, consumers cannot plan migrations. Define exact months or dates.
**No automated enforcement**: Manual enforcement of version sunset means versions stay alive indefinitely. Block requests to retired versions at the gateway or middleware level.
**Breaking changes in patch versions**: A breaking change in a minor or patch version violates consumer trust. Use the breaking change taxonomy to gate all releases.

---

## Failure Modes
**Orphaned version accumulation**: Old versions remain deployed because no one tracks usage or enforces sunset. *Detection:* API gateway metrics show traffic to old versions. *Mitigation:* Automated sunset dashboard with alerting when versions exceed deprecation windows.
**Consumer migration failure**: Consumers cannot upgrade before the sunset date. *Detection:* Sunset header analytics show high usage of deprecated versions near deadline. *Mitigation:* Allow extension requests with documented exceptions; never sunset without verified consumer migration.

---

## Ecosystem Usage
Laravel itself does not enforce version governance, but `Route::prefix('v1')`, `Route::group(['prefix' => 'v2'])`, and middleware for `Deprecation`/`Sunset` headers are the standard building blocks. Packages like `laravel/sunset` can automate header injection. API documentation tools like Scribe and Scramble can surface version lifecycle info.

---

## Related Knowledge Units
### Prerequisites
- API versioning strategies (URL path, header, query string, media type)
- Breaking change identification

### Related Topics
- API deprecation header implementation
- Consumer communication strategies

### Advanced Follow-up Topics
- Multi-version request lifecycle management
- Version-aware database schema migration

---

## Research Notes
- Industry consensus (Google, Stripe, GitHub) favors minimum 6-12 month deprecation windows for public APIs
- The `Sunset` HTTP header (RFC 8594) standardizes sunset notification; the `Deprecation` header (draft) standardizes deprecation signaling
- Stripe's API version governance is widely cited as a best-in-class example of clear consumer communication
