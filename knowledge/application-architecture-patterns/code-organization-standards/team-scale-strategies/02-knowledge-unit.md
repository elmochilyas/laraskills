# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Team-scale organizational strategies (10+ engineers)
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

At 10+ engineers, organizational strategies shift from "where does this file go" to "how do multiple teams work in the same codebase without colliding." The primary concerns become: namespace ownership (which team owns which namespaces), merge conflict reduction (how to minimize teams touching the same files), and code review scalability (how to review changes without blocking progress). The answer is almost always domain-based or module-based organization with clear team-to-domain mapping.

---

# Core Concepts

At team scale, the default Laravel structure becomes harmful because:
- Multiple teams can't all own `app/Http/Controllers/`
- Merge conflicts spike when 10+ engineers modify files in the same directories
- Code review becomes a bottleneck when reviewers must understand unrelated changes to review their domain's code
- Framework upgrade impact is amplified across all teams

The solution is structural partitioning: each team owns a namespace prefix and operates independently within it.

---

# Mental Models

**The "Team-as-Tenant" model:** Each team operates as if they're developing in a separate application within the same repository. They own their domain's namespace and have minimal interaction with other teams' code.

**The "Conway's Law as Strategy" model:** The code structure reflects the team structure. If you have 3 teams (Billing, Catalog, Identity), you have 3 domain directories. Communication between teams goes through explicit integration points, not shared code.

**The "Merged Ownership" model:** No two teams should ever need to modify the same file for different reasons. If they do, the file is either shared infrastructure (which should be stable) or a cross-cutting concern that needs its own owner.

---

# Internal Mechanics

**Required PSR-4 restructing:** Default `App\` namespace becomes inadequate. Each team/domain needs its own namespace root:
```json
{
  "autoload": {
    "psr-4": {
      "Billing\\": "domains/billing/src/",
      "Catalog\\": "domains/catalog/src/",
      "Identity\\": "domains/identity/src/",
      "Shared\\": "domains/shared/src/"
    }
  }
}
```

**Per-domain service providers:** Each domain registers its own routes, events, and services via its own service provider. The main application provider only registers shared infrastructure.

**Merge conflict budgeting:** Teams should aim for <5 merge conflicts per month. If conflicts exceed this, structural reorganization is needed.

---

# Patterns

**Module-per-team with contracts:** Each team owns a module with explicit inbound/outbound contracts. Other teams depend on contracts, not implementations.

**API-first internal communication:** Teams expose internal APIs (service contracts) that other teams consume. No direct database access across team boundaries.

**Feature flags across teams:** Cross-team features use feature flags to decouple deployment from release. Team A can ship without waiting for Team B.

**Stable shared kernel:** A `Shared` or `Support` namespace owned by an infrastructure team or with strict change control. Changes require broad review.

---

# Architectural Decisions

**Use module-per-team when:** 10+ engineers across 2+ teams, multiple business domains with different release cadences, and the organization can support architectural enforcement.

**Use domain-per-team (simpler) when:** 10-20 engineers, clear domain boundaries, strong architectural review culture, and less formal contract management.

**Avoid strict partitioning when:** Teams are cross-functional (each team touches multiple domains), or the application is a single domain with complex interdependencies.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Teams work independently | Contract overhead between teams | Each integration point requires interface + testing |
| Merge conflicts minimized | Shared resource coordination | Database migrations, config changes need cross-team sync |
| Domain expertise deepens | Duplication across domains | Each team may build similar infrastructure independently |
| Onboarding is domain-local | Cross-domain mobility is harder | Developers specialize in one domain |

---

# Performance Considerations

Multiple service providers increase boot time. With 10+ domain providers, consider deferred providers and config caching.

Database schema ownership per team means querying data owned by another team requires API calls (HTTP or internal), not direct queries. This adds latency to cross-domain workflows.

---

# Production Considerations

**Cross-team coordination:** Schedule regular "architecture sync" meetings for shared concerns (database migrations, package upgrades, framework version changes).

**Contract testing:** Each team's contracts (service interfaces, event schemas) should have consumer-driven contract tests to prevent breaking changes.

**Documentation:** Maintain a team-to-namespace mapping document. New developers need to know which team owns which domain.

---

# Common Mistakes

**Cross-team shared models:** A `User` model used by all teams creates a single point of coupling. Each team should own its user concept or communicate through contracts.

**No shared kernel owner:** The `Shared/` or `Support/` namespace has no explicit owner. Everyone contributes, no one maintains. Assign ownership.

**Siloed infrastructure decisions:** Each team choosing different logging strategies, monitoring approaches, or queue backends creates operational inconsistency.

---

# Failure Modes

**Team boundary mismatch with code boundaries:** If team A owns billing but needs constant changes from team B's catalog, the team structure or domain boundaries need adjustment.

**Integration overload:** So many cross-domain contracts that teams spend more time on contract management than feature delivery. Consider merging domains or using events instead of synchronous calls.

---

# Ecosystem Usage

Larger organizations using Laravel at scale (Beyond Code, Spatie, Tighten) often employ domain-per-team structures. The `nwidart/modules` and `Modulate` packages provide scaffolding optimized for team-scale development.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-09 When to deviate | MMD-01 Module vs microservice | DBC-09 Team-to-context mapping |
| COS-06 Domain-based org | MMD-11 Module extraction | AEG-06 Architecture Decision Records |

---

## Research Notes

Research into Laravel code organization patterns in 2025-2026 reveals a strong community consensus around action classes and domain-based organization. Stu Mason's 2026 analysis documents how Laravel 12's streamlined bootstrap/app.php centralizes middleware, exception handling, and routing configuration. Jeffrey Davidson's "How I Structure Every Laravel Project" advocates for thin controllers, single-purpose Action classes, and DTOs for type safety. The community overwhelmingly recommends starting with the default structure and evolving toward feature or domain organization only when measurable pain emerges. The 
widart/laravel-modules package and spatie/laravel-query-builder represent the most popular third-party extensions to the default structure.
