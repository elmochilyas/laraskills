# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Internal Developer Platforms
**Knowledge Unit:** Internal Template Registries (Laravel Project Templates)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we create internal project templates? | Scale, setup time, standards | Yes — for 3+ apps or > 30 min setup |
| 2 | How many templates to maintain? | Maintenance capacity, use case diversity | 3-5 templates |
| 3 | Distribution method: Composer vs GitHub? | Parameterization needs, post-generation | Composer packages for param'd templates |
| 4 | Template thickness: minimal vs opinionated? | Dev autonomy, standardization needs | Moderately opinionated |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Create Internal Project Templates?

---

## Decision Context

Internal templates encode organizational standards and reduce new project setup time. They require ongoing maintenance to stay current with Laravel versions and package updates. The decision depends on the number of projects and current setup friction.

---

## Decision Criteria

* performance
* maintainability

---

## Decision Tree

How many Laravel applications exist or are planned?
↓
1 → Templates not needed
2+ → ↓
How long does it take to set up a new project with all tooling?
↓
< 30 minutes → Templates provide marginal benefit
30+ minutes → ↓
Is there capacity to maintain templates (update for Laravel releases, package changes)?
↓
NO → Do not create templates; outdated templates are worse than no templates
YES → ↓
Do organizational standards change frequently?
↓
YES → Wait for stabilization; templates that change monthly are too costly
NO → **Create 3-5 templates** for common project types

---

## Rationale

Templates are a maintenance commitment. If standards change frequently, template maintenance becomes a constant overhead. The 30-minute threshold identifies where templates provide meaningful time savings. Single-project organizations don't benefit from template reuse.

---

## Recommended Default

**Default:** Create templates for organizations with 3+ Laravel apps and stable standards
**Reason:** Payback period is short when templates are used multiple times; maintenance cost is amortized across projects

---

## Risks Of Wrong Choice

- **Frozen templates (> 12 months stale):** Generated projects start with outdated practices, security debt from day one
- **No templates at scale (10+ apps):** Each project manually configured; inconsistent standards; high onboarding friction

---

## Related Rules

- TEMPLATE-RULE-018: 3+ Laravel apps justifies template registries
- TEMPLATE-RULE-019: Use templates when setup > 30 minutes
- TEMPLATE-RULE-021: Avoid the Frozen Template — update quarterly minimum

---

## Related Skills

- Build Internal Template Registries for Laravel Projects
- Implement Template Registry Distribution and Governance

---

## Decision 2: How Many Templates to Maintain?

---

## Decision Context

Each template requires ongoing maintenance for Laravel version upgrades, package updates, and CI configuration changes. The number of templates directly affects the maintenance burden.

---

## Decision Criteria

* maintainability

---

## Decision Tree

What are the distinct application types needed?
↓
1-2 types (e.g., only API services) → Start with 1-2 templates
3-4 types (API, monolith, package, worker) → Start with 3 templates
5+ types → ↓
Can some types be covered by parameters within existing templates?
↓
YES → Use parameters; do not create separate templates
NO → ↓
Does the team have dedicated template maintenance capacity?
↓
NO → Reduce scope; maintain fewer templates
YES → Maximum 5 templates — hard limit

---

## Rationale

Each template doubles as a maintenance commitment. The sweet spot of 3-5 templates covers the most common Laravel project types (API, monolith, package, queue worker) without fragmenting maintenance resources. Parameters within templates provide flexibility without multiplying templates.

---

## Recommended Default

**Default:** Maintain 3 templates — API service, monolith, package library
**Reason:** Covers 80% of Laravel project types with manageable maintenance load

---

## Risks Of Wrong Choice

- **10+ templates:** Maintenance burden exceeds capacity; templates go stale; developers lose trust
- **1 template for everything:** Bloated template with unnecessary configuration for simple projects

---

## Related Rules

- TEMPLATE-RULE-001: Limit to 3-5 templates
- TEMPLATE-RULE-020: Avoid the Monolith Template
- TEMPLATE-RULE-023: Avoid Over-Parameterization

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 3: Distribution Method — Composer vs GitHub?

---

## Decision Context

Templates can be distributed as Composer packages (supports parameterization and post-generation hooks) or GitHub template repositories (simple clone-and-go). The choice depends on how much customization is needed at generation time.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Do templates need parameterization (project name, PHP version, starter kit selection)?
↓
NO (simple skeleton, no customization needed) → **GitHub template repository**
YES → ↓
Are post-generation hooks needed (composer install, git init, CI setup)?
↓
NO → **GitHub template repository** with manual setup instructions
YES → ↓
Is the team familiar with Composer package development?
↓
NO → Build a custom CLI tool instead; avoid Composer complexity
YES → **Composer package** with post-generation Artisan commands

---

## Rationale

Composer packages provide the richest template experience with parameter substitution (Blade syntax), post-generation scripts, and dependency management. However, they require more setup and Composer expertise. GitHub template repositories are simpler but limited to static skeletons.

---

## Recommended Default

**Default:** Composer packages for parameterized templates; GitHub repos for simple skeletons
**Reason:** Composer's `create-project` command is the natural Laravel distribution mechanism; Blade syntax for parameters is already familiar to Laravel developers

---

## Risks Of Wrong Choice

- **GitHub templates for complex setups:** Developers must manually configure after clone; template value is diminished
- **Composer packages for simple skeletons:** Over-engineered; unnecessary complexity for static templates

---

## Related Rules

- TEMPLATE-RULE-006: Distribution method
- TEMPLATE-RULE-005: Template format — Blade syntax for parameters

---

## Related Skills

- Build Internal Template Registries for Laravel Projects

---

## Decision 4: Template Thickness — Minimal vs Opinionated?

---

## Decision Context

Templates range from minimal (just organizational config files) to highly opinionated (full architecture with DTOs, repositories, services, specific packages). The thickness affects developer autonomy, generation time, and maintenance burden.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

What is the primary goal of the template?
↓
**Speed** — fastest path to a working project
↓
**Moderately opinionated** — include tooling config + recommended structure + one page of setup
↕
**Consistency** — all projects follow the same architecture
↓
**Opinionated** — include architecture patterns, DTOs, repositories, services, specific packages
↕
**Flexibility** — developers should make their own architecture choices
↓
**Minimal** — config files only (pint, phpstan, CI); no architectural decisions

Consider:
- Junior developers benefit from more opinionation
- Senior teams resent being told how to structure code
- Opinionated templates require more maintenance
- Minimal templates leave more decisions to developers

---

## Rationale

Template thickness should match team maturity and organizational goals. Junior-heavy teams benefit from opinionated templates that enforce patterns. Senior teams prefer minimal templates that handle tooling but leave architecture decisions open. The maintenance burden increases with opinionation.

---

## Recommended Default

**Default:** Moderately opinionated — tooling configuration + recommended project structure + README with guidance
**Reason:** Balances standardization with flexibility; works for most team compositions

---

## Risks Of Wrong Choice

- **Too opinionated (senior team):** Developers strip template decisions; template becomes irrelevant
- **Too minimal (junior team):** No guidance on project structure; developers make inconsistent choices

---

## Related Rules

- TEMPLATE-RULE-003: Template as a contract
- TEMPLATE-RULE-011: Include post-generation guidance
- TEMPLATE-RULE-022: Avoid the Empty Template

---

## Related Skills

- Build Internal Template Registries for Laravel Projects
- Design Golden Paths for Laravel Development Workflows

