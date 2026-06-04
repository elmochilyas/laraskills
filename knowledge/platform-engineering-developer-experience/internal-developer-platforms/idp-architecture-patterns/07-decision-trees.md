# Metadata

**Domain:** Platform Engineering & Developer Experience
**Subdomain:** Internal Developer Platforms
**Knowledge Unit:** IDP Architecture Patterns for Laravel Teams
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Key Criteria | Default |
|---|----------|-------------|---------|
| 1 | Should we build an IDP for our Laravel organization? | Scale, pain points, resources | Yes — for 5+ devs and 3+ apps |
| 2 | Compose vs build platform components? | Existing tool maturity, team capacity | Always compose first |
| 3 | Portal vs CLI-first? | Discovery needs, team size, UI budget | CLI-first for small teams |
| 4 | Forge vs Kubernetes for provisioning? | Existing investment, ops expertise | Forge is default for Laravel |

---

# Architecture-Level Decision Trees

---

## Decision 1: Should We Build an IDP?

---

## Decision Context

Internal Developer Platforms abstract infrastructure complexity behind a self-service interface. For Laravel teams, IDPs compose Forge, GitHub Actions, and Sail into a unified experience. The decision depends on scale, pain points, and available resources.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

How many Laravel applications does the team manage?
↓
< 3 → IDP not needed; Forge + Actions + Sail is sufficient
3+ → ↓
How many developers?
↓
< 5 → Simpler tools suffice; IDP overhead not justified
5+ → ↓
Do developers spend significant time on infrastructure setup?
↓
NO (minimal friction reported) → Do not build IDP yet
YES → ↓
Is there a dedicated platform engineering resource?
↓
NO → Do not build IDP; no one will maintain it
YES → ↓
Are development patterns stable?
↓
NO (requirements change frequently) → Wait for stabilization before automating
YES → **Build IDP** — start with 2-3 golden paths, compose existing tools

---

## Rationale

IDPs require ongoing investment in design, development, and maintenance. Building too early (before patterns are stable) or without resources results in an abandoned platform. The threshold of 5 developers and 3 apps ensures enough scale for ROI.

---

## Recommended Default

**Default:** Do not build IDP for < 5 developers or < 3 applications
**Reason:** Forge + GitHub Actions + Sail already covers most needs at small scale

---

## Risks Of Wrong Choice

- **Building too early:** Platform solves no real problem; abandoned within 6 months
- **Not building at scale (20+ devs, 10+ apps):** Inconsistent practices, no standardization, high cognitive load on developers

---

## Related Rules

- IDP-RULE-021: Team >= 5 developers to justify IDP investment
- IDP-RULE-022: 3+ Laravel apps before building an IDP
- IDP-RULE-010: Start with developer pain points

---

## Related Skills

- Design an IDP Architecture for Laravel Teams
- Design Golden Paths for Laravel Development Workflows

---

## Decision 2: Compose vs Build Platform Components?

---

## Decision Context

When implementing an IDP, each component (provisioning, CI/CD, service catalog, developer portal) can be built from scratch or composed from existing tools. The choice affects development speed, maintenance burden, and customization capability.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does a mature, well-maintained tool already exist for this capability?
↓
YES → **Compose** — use the existing tool; wrap with thin abstraction if needed
NO → ↓
Is the capability unique to our organization (no general tool exists)?
↓
NO → Look harder for existing tools; compose is almost always better
YES → ↓
Do we have capacity to build AND maintain this component?
↓
NO → Do not build; find workaround or accept manual process
YES → ↓
Can we build this as an abstraction over multiple backends (avoid vendor lock-in)?
↓
NO → Build but plan for migration path
YES → **Build** with abstraction layer; test for long-term maintainability

---

## Rationale

Composing existing tools (Forge API, GitHub Actions, Backstage) provides proven reliability with lower maintenance. Custom components require ongoing development and testing. The "thin platform, thick tooling" principle means most value comes from composing mature tools, not building new ones.

---

## Recommended Default

**Default:** Compose existing tools; build only when no tool exists
**Reason:** Composing mature tools is faster, more reliable, and requires less maintenance

---

## Risks Of Wrong Choice

- **Building when a tool exists:** Re-inventing the wheel; high maintenance burden; bugs in custom code
- **Composing too many tools without abstraction:** Tight coupling to each vendor; hard to migrate

---

## Related Rules

- IDP-RULE-001: Compose before build
- IDP-RULE-003: Thin platform, thick tooling
- IDP-RULE-029: Avoid Vendor Lock-In

---

## Related Skills

- Design an IDP Architecture for Laravel Teams
- Implement Platform Observability and Governance

---

## Decision 3: Portal vs CLI-First?

---

## Decision Context

The developer interface to the IDP can be a web portal (Backstage, custom dashboard) or a CLI tool (Artisan commands, custom CLI). The choice depends on team size, discovery needs, and UI development capacity.

---

## Decision Criteria

* performance
* architectural

---

## Decision Tree

How many developers will use the platform?
↓
< 20 → **CLI-first** — faster to build, lower maintenance, preferred by developers
20+ → ↓
Is service discovery a key pain point?
↓
NO → **CLI-first** — CLI is faster for repetitive tasks
YES → ↓
Does the organization have UI development capacity?
↓
NO → Start with CLI; add portal later if needed
YES → ↓
**Portal-first** (Backstage or custom) — expose service catalog and scaffolder

---

## Rationale

CLI tools are faster to build, easier to maintain, and preferred by experienced developers for daily use. Portals add value for discovery (browsing services, documentation) and for less technical users. The portal should complement the CLI, not replace it — both should consume the same API.

---

## Recommended Default

**Default:** CLI-first for teams under 20 developers
**Reason:** Faster development cycle, lower maintenance, higher developer preference for daily tasks

---

## Risks Of Wrong Choice

- **Portal-first without CLI:** Developers bypass portal for speed; portal adoption is low
- **CLI-only at scale (50+ developers):** No discovery mechanism; new developers can't find services

---

## Related Rules

- IDP-RULE-024: Portal vs CLI-first
- IDP-RULE-006: API-first design

---

## Related Skills

- Design an IDP Architecture for Laravel Teams
- Integrate Backstage as a Developer Portal for Laravel

---

## Decision 4: Forge vs Kubernetes for Provisioning?

---

## Decision Context

The provisioning backend can be Forge (VPS-based) or Kubernetes. Forge is Laravel-specific and simpler; K8s is more flexible but operationally intensive. The choice depends on existing investment and ops expertise.

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Does the organization already have Kubernetes expertise and infrastructure?
↓
YES → ↓
Are you running non-Laravel services alongside Laravel apps?
↓
YES → **Kubernetes** — consistent orchestration across stacks
NO → ↓
Is the team committed to multi-cloud/hybrid deployment?
↓
YES → **Kubernetes** — cloud-agnostic orchestration
NO → ↓
**Forge** — simpler, Laravel-specific, less operational overhead
↕
NO (no existing K8s) → ↓
Team size?
↓
< 20 developers → **Forge** — K8s ops overhead not justified
20+ → ↓
Do you already have a dedicated DevOps/platform team?
↓
NO → **Forge** — simpler learning curve; no K8s specialists needed
YES → ↓
**Forge is the default for Laravel** — switch to K8s only if Forge limitations are hit

---

## Rationale

Forge provides Laravel-specific knowledge (PHP-FPM, queue workers, scheduled tasks) that Kubernetes lacks. For most Laravel teams, Forge covers all needs without K8s complexity. Kubernetes is appropriate when the organization already has K8s infrastructure, runs multiple tech stacks, or has outgrown Forge's capabilities.

---

## Recommended Default

**Default:** Forge for Laravel teams without existing K8s investment
**Reason:** Forge is simpler, Laravel-optimized, and covers ~80% of use cases without K8s overhead

---

## Risks Of Wrong Choice

- **Kubernetes too early:** Ops overhead consumes platform team; no capacity for developer-facing features
- **Forge at massive scale (100+ servers):** Forge management becomes cumbersome; consider K8s at this scale

---

## Related Rules

- IDP-RULE-023: Forge vs K8s choice
- IDP-RULE-031: Never recommend K8s-based IDPs for small Laravel teams
- FORGE-RULE-001: Forge as provisioning backend

---

## Related Skills

- Design an IDP Architecture for Laravel Teams
- Build a Forge-Based Self-Service Provisioning Platform
- Configure Docker Compose for Laravel Environments

