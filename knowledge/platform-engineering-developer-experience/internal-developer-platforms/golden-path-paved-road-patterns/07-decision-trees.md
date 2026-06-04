# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Internal Developer Platforms
**Knowledge Unit:** Golden Path / Paved Road Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we invest in golden paths? | Scale, common patterns, resources | Yes — for 3+ apps with similar needs |
| 2 | Which workflows to path first? | Developer pain, frequency | Highest-frequency, highest-pain |
| 3 | Level of opinionation? | Team autonomy, standardization needs | Default-optimized with escape hatches |
| 4 | Enforcement vs attraction? | Adoption metric, culture | Attract through convenience |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Invest in Golden Paths?

---

## Decision Context

Golden paths (paved roads) are opinionated, well-documented workflows for common developer tasks. They require significant upfront investment in design, automation, and ongoing maintenance. The decision depends on organizational scale and workflow homogeneity.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

How many Laravel applications does the organization have?
↓
< 3 → Golden paths not justified; ad-hoc workflows are fine
3+ → ↓
Do the applications share similar patterns?
↓
NO (highly heterogeneous) → Golden paths add little value
YES → ↓
Team size?
↓
< 5 developers → Path maintenance burden exceeds benefit
5+ → ↓
Is there a dedicated platform team with maintenance capacity?
↓
NO → Do not invest; paths require ongoing upkeep
YES → ↓
Do developers report pain in repetitive workflows?
↓
NO → Identify real pain points first; don't build without demand
YES → **Invest in 2-3 golden paths** starting with highest pain

---

## Rationale

Golden paths require ongoing maintenance — they are not "build once" artifacts. Without enough applications or developers to benefit, the investment doesn't pay back. The 80/20 rule applies: cover 80% of use cases with 2-3 paths and provide escape hatches for the rest.

---

## Recommended Default

**Default:** Start with 2-3 golden paths for highest-frequency workflows
**Reason:** Limiting initial scope ensures maintenance capacity; paths can be added based on measured demand

---

## Risks Of Wrong Choice

- **No paths at scale (10+ apps):** Inconsistent practices, duplicated effort, no standardization
- **Too many paths too quickly:** Maintenance burden exceeds capacity; paths become outdated and erode trust

---

## Related Rules

- GP-RULE-019: 3+ Laravel apps with similar requirements justifies golden paths
- GP-RULE-020: < 5 developers too small to justify
- GP-RULE-004: Start small, expand on demand

---

## Related Skills

- Design Golden Paths for Laravel Development Workflows
- Manage Golden Path Lifecycle and Adoption

---

## Decision 2: Which Workflows to Path First?

---

## Decision Context

Golden paths require significant effort to create. Choosing which workflows to path first determines early adoption and platform credibility. The wrong first workflow can doom the entire golden path initiative.

---

## Decision Criteria

* performance

---

## Decision Tree

Survey developers: what is the most painful repetitive task?
↓
**Environment setup / new project creation**
↓
Path: "Create new Laravel API service" — scaffold, CI, deploy
↕
**CI/CD configuration**
↓
Path: "Set up CI pipeline" — Pint, PHPStan, Pest, deploy
↕
**Deployment / release process**
↓
Path: "Deploy to staging/production" — zero-downtime deploy
↕
**Onboarding / local dev setup**
↓
Path: "Set up local environment" — Sail, DB, services

Sort candidates by:
- Frequency (how often is this task done?)
- Pain level (how long does it take? how error-prone?)
- Automation feasibility (can we fully automate?)

**Choose the one with highest (frequency × pain × feasibility)**

---

## Rationale

The first golden path must demonstrate clear value to build credibility. Choosing a low-frequency or low-pain workflow risks the path going unused, which undermines the entire initiative. Developer survey data is essential — never guess which workflows are painful.

---

## Recommended Default

**Default:** "Create new Laravel API service" — highest frequency, highest pain, fully automatable
**Reason:** New project creation is the most common and most painful workflow in growing Laravel orgs

---

## Risks Of Wrong Choice

- **Bicycle path (low-use workflow):** Path goes unused; platform team credibility damaged
- **Hard-to-automate workflow:** Partial automation with manual final steps creates a dead end

---

## Related Rules

- GP-RULE-001: Design from developer pain points
- GP-RULE-024: Avoid the Bicycle Path

---

## Related Skills

- Design Golden Paths for Laravel Development Workflows

---

## Decision 3: Level of Opinionation?

---

## Decision Context

Golden paths range from minimal (just config files) to highly opinionated (specific architecture patterns, packages, and structure). The level of opinionation affects developer autonomy, standardization, and escape hatch usage.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the organization operate in a regulated environment (PCI, HIPAA, SOC2)?
↓
YES → **Highly opinionated** — compliance encoded in the path; deviations require review
NO → ↓
Are developers experienced and autonomous?
↓
YES (senior team) → **Minimally opinionated** — defaults only; maximum flexibility
NO (mixed/junior team) → ↓
What is the primary goal?
↓
Standardization → **Moderately opinionated** — recommend structure and packages; allow opt-out
Speed → **Moderately opinionated** — optimized for fastest path to working app

---

## Rationale

The right level of opinionation depends on team maturity and regulatory requirements. Junior teams benefit from more guidance; senior teams need flexibility. In regulated environments, opinionation is not optional — compliance must be encoded. The 80/20 rule applies: default-optimized configuration for 80% of use cases with documented opt-out for 20%.

---

## Recommended Default

**Default:** Moderately opinionated with documented escape hatches
**Reason:** Balances standardization with flexibility; works for most team compositions

---

## Risks Of Wrong Choice

- **Under-opinionated:** Path provides no real guidance; developers still make all decisions
- **Over-opinionated:** Path becomes a straitjacket; developers create shadow IT and workarounds

---

## Related Rules

- GP-RULE-003: 80/20 rule
- GP-RULE-005: Default-optimized configuration
- GP-RULE-014: Compliance encoding

---

## Related Skills

- Design Golden Paths for Laravel Development Workflows

---

## Decision 4: Enforcement vs Attraction?

---

## Decision Context

Golden paths can be enforced (CI blocks non-compliant projects, mandates) or attraction-based (the path is so convenient developers choose it naturally). The approach affects adoption, developer sentiment, and platform culture.

---

## Decision Criteria

* architectural

---

## Decision Tree

Is there existing developer resistance to standardization?
↓
YES → **Attract only** — enforcement will backfire; make path compelling, not mandatory
NO → ↓
Is the organization in a regulated environment?
↓
YES → **Enforce at CI gates** — compliance is non-negotiable; provide generous escape hatch
NO → ↓
Monitor adoption rate after 3 months:
↓
> 80% adoption → **Attract is working** — maintain attraction-based approach
< 50% adoption → ↓
Why is adoption low?
- Path is slower than manual: fix path performance
- Path doesn't solve real problem: interview developers, redesign
- Path is missing features: expand path based on feedback

---

## Rationale

Enforcement creates resentment and workarounds. Attraction through convenience is more sustainable and builds platform trust. The exception is regulated environments where compliance cannot be optional. Adoption rate is the primary metric — if developers aren't choosing the path, fix the path rather than forcing it.

---

## Recommended Default

**Default:** Attract through convenience; monitor adoption rate
**Reason:** Enforced paths create resentment; convenient paths build trust and sustained adoption

---

## Risks Of Wrong Choice

- **Enforcement without convenience:** Developers bypass platform; shadow IT; damaged team morale
- **Pure attraction with no guardrails:** Extreme edge cases; no path to enforce critical compliance

---

## Related Rules

- GP-RULE-002: Attract, don't enforce
- GP-RULE-008: Path feedback loop
- GP-RULE-022: Avoid the Toll Road

---

## Related Skills

- Manage Golden Path Lifecycle and Adoption
- Design Golden Paths for Laravel Development Workflows

