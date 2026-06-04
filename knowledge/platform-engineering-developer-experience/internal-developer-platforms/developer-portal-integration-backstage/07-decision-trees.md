# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Internal Developer Platforms
**Knowledge Unit:** Developer Portal Integration (Backstage)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we adopt Backstage as our developer portal? | Scale, resources, team size | No — for teams < 20 developers |
| 2 | Self-hosted vs managed Backstage? | Ops capacity, customization needs | Self-host for deep customization |
| 3 | Scaffolder-first vs Catalog-first? | Developer pain points, immediate value | Scaffolder-first |
| 4 | Plugin depth: thin vs deep? | Maintenance budget, upgrade tolerance | Thin — minimize custom plugins |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Adopt Backstage?

---

## Decision Context

Backstage provides a unified developer portal with service catalog, TechDocs, and self-service scaffolding. However, it requires significant infrastructure investment (K8s, PostgreSQL) and ongoing maintenance. The decision depends on organizational scale and existing pain points.

---

## Decision Criteria

* performance
* architectural
* security
* maintainability

---

## Decision Tree

Does the organization have 20+ Laravel services?
↓
NO → Use simpler tools (CLI, README, GitHub repo topics)
YES → ↓
Is there a dedicated platform engineering team to maintain Backstage?
↓
NO → Do NOT adopt Backstage
YES → ↓
Do teams struggle with service discovery, ownership, or documentation?
↓
NO → Backstage may not solve a real problem; defer
YES → ↓
Is the organization exclusively Laravel?
↓
YES → Consider custom dashboard instead of Backstage
NO → ↓
**Adopt Backstage** — start with Scaffolder + TechDocs

---

## Rationale

Backstage is a heavy investment that only pays back at scale. Teams under 20 developers can manage service discovery with GitHub tools and conventions. Laravel-only orgs may get more value from a purpose-built dashboard. The decision hinges on multi-stack needs, catalog maintenance discipline, and platform team capacity for upgrades every few weeks.

---

## Recommended Default

**Default:** Do not adopt Backstage for teams under 20 developers or Laravel-only orgs
**Reason:** The operational cost exceeds the value at small scale; simpler tools (CLI, README, GitHub topics) suffice

---

## Risks Of Wrong Choice

- **Over-investing:** Empty portal with no adoption, wasted infrastructure cost, platform team credibility damaged
- **Under-investing:** Teams cannot discover services, duplicate efforts, ownership confusion grows with scale
- **Custom plugin graveyard:** Heavy UI customization breaks on Backstage's frequent (weekly) releases

---

## Related Rules

- BACKSTAGE-RULE-018: 20+ Laravel services to justify Backstage
- BACKSTAGE-RULE-020: Laravel-only org may benefit more from custom dashboard
- BACKSTAGE-RULE-019: No official Laravel Backstage plugin exists
- BACKSTAGE-RULE-021: Avoid the Empty Portal
- BACKSTAGE-RULE-025: Never recommend Backstage for teams under 20

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel
- Build a Laravel-Specific Backstage Scaffolder Template

---

## Decision 2: Self-Hosted vs Managed Backstage?

---

## Decision Context

Backstage can be self-hosted (Kubernetes + PostgreSQL) for maximum customization or managed via services like Roadie or Kion for lower operational burden. The tradeoff is control vs maintenance overhead.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the organization have dedicated Kubernetes operations?
↓
NO → Use managed Backstage (Roadie, Kion)
YES → ↓
Is deep customization (custom scaffolder actions, Forge plugin) required?
↓
NO → Use managed Backstage
YES → ↓
Is there capacity for weekly Backstage upgrades?
↓
NO → Managed Backstage handles upgrades for you
YES → ↓
**Self-host Backstage** on Kubernetes with PostgreSQL

---

## Rationale

Self-hosting provides full control over plugins and scaffolder actions but requires significant operational expertise. Managed services handle upgrades, scaling, and backups but limit customization. For most Laravel teams, managed Backstage is sufficient unless custom Forge API plugins are critical.

---

## Recommended Default

**Default:** Managed Backstage (Roadie/Kion)
**Reason:** Eliminates upgrade burden; weekly Backstage releases make self-hosting a significant operational commitment

---

## Risks Of Wrong Choice

- **Self-hosting without ops capacity:** Outdated, broken Backstage instance after missed upgrades
- **Managed service with deep customization needs:** Vendor limitations block required features

---

## Related Rules

- BACKSTAGE-RULE-005: Self-host vs managed
- BACKSTAGE-RULE-008: Weekly upgrade cadence

---

## Related Skills

- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 3: Scaffolder-First vs Catalog-First?

---

## Decision Context

Backstage has two primary value propositions: the Scaffolder (self-service project creation) and the Catalog (service discovery). Teams must choose which to implement first based on their most pressing pain points.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

What is the primary developer pain point?
↓
**Project creation inconsistency / slow setup**
↓
**Scaffolder-first** — build templates for new Laravel services
↓
Add Catalog after Scaffolder is adopted
↕
**Service discovery / ownership tracking**
↓
**Catalog-first** — register all services with metadata
↓
Add Scaffolder after Catalog is populated

---

## Rationale

Scaffolder provides immediate developer productivity gains by standardizing project creation and reducing setup time from hours to minutes. Catalog delivers value only after critical mass of registered services. Most Laravel teams benefit from Scaffolder-first because project creation is a discrete, automatable workflow with clear ROI.

---

## Recommended Default

**Default:** Scaffolder-first
**Reason:** Immediate, measurable productivity improvement; templates encode standards from day one

---

## Risks Of Wrong Choice

- **Catalog-first without Scaffolder:** Developers register services but have no self-service capability; catalog remains static
- **Scaffolder-first without eventual catalog:** Services proliferate without discovery mechanism

---

## Related Rules

- BACKSTAGE-RULE-001: Scaffolder first
- BACKSTAGE-RULE-002: catalog-info.yaml in every repo

---

## Related Skills

- Build a Laravel-Specific Backstage Scaffolder Template
- Implement a Service Catalog for Laravel Applications

---

## Decision 4: Plugin Depth — Thin vs Deep?

---

## Decision Context

Backstage plugins range from thin wrappers (pass-through to existing tools like GitHub) to deep integrations (custom UI, custom backend actions, Forge API orchestration). Depth increases value but also maintenance cost.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

Does the plugin require custom backend logic or external API calls?
↓
NO → Frontend-only plugin (dashboard, display)
YES → ↓
Is the external system (Forge, CI) stable with a well-documented API?
↓
NO → Avoid deep integration; use webhook-based triggers instead
YES → ↓
Can this be achieved with Backstage Scaffolder built-in actions?
↓
YES → Use Scaffolder actions — no custom plugin needed
NO → ↓
Does the organization have capacity to maintain this plugin through Backstage upgrades?
↓
NO → Do not build; find alternative approach
YES → **Build a full plugin** (frontend + backend) with thin abstraction layer

---

## Rationale

Custom plugins break frequently on Backstage's weekly release cycle. Each custom plugin is a maintenance liability. The Scaffolder's built-in action system covers most Laravel use cases (GitHub repo creation, CI triggering, catalog registration) without custom code. Reserve full plugins for cases where Scaffolder actions cannot work.

---

## Recommended Default

**Default:** Minimize custom plugins; use Scaffolder built-in actions
**Reason:** Each custom plugin is a maintenance burden that breaks on upgrades

---

## Risks Of Wrong Choice

- **Deep integration with fragile APIs:** External system changes break the plugin; no one notices until developers report it
- **Too many thin plugins:** Developers have to visit multiple tools; portal fails to provide unified experience

---

## Related Rules

- BACKSTAGE-RULE-006: Plugin architecture
- BACKSTAGE-RULE-014: Vet third-party plugins
- BACKSTAGE-RULE-023: Avoid the Custom Plugin Graveyard

---

## Related Skills

- Build a Laravel-Specific Backstage Scaffolder Template
- Build a Forge-Based Self-Service Provisioning Platform

