# Metadata

Domain: Application Architecture Patterns
Subdomain: Code Organization Standards
Knowledge Unit: Team-scale organizational strategies (10+ engineers)
Knowledge Unit ID: COS-10
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

At 10+ engineers, organizational strategies shift from "where does this file go" to "how do multiple teams work in the same codebase without colliding." Concerns become: namespace ownership, merge conflict reduction, and code review scalability. The solution is almost always domain-based or module-based organization with clear team-to-domain mapping.

---

# Core Concepts

- **Team-as-Tenant Model**: Each team operates as if developing in a separate application within the same repository. They own their domain's namespace with minimal interaction with other teams' code.
- **Conway's Law as Strategy**: Code structure reflects team structure. 3 teams = 3 domain directories.
- **Merged Ownership Rule**: No two teams should ever need to modify the same file for different reasons. If they do, the file is either shared infrastructure (should be stable) or a cross-cutting concern needing its own owner.
- **Namespace Ownership**: Each team/domain needs its own namespace root with separate PSR-4 mapping.

---

# When To Use

- 10+ engineers across 2+ teams
- Multiple business domains with different release cadences
- Organization can support architectural enforcement
- Teams need independent work without constant coordination

---

# When NOT To Use

- Teams are cross-functional (each team touches multiple domains)
- Application is a single domain with complex interdependencies
- Organization lacks architectural enforcement culture
- Fewer than 10 engineers — structural partitioning adds unnecessary overhead

---

# Best Practices

- **Use per-domain namespace roots** with separate PSR-4 mappings. WHY: Default `App\` namespace is inadequate for multi-team ownership. Each team needs its own root.
- **Implement per-domain service providers.** WHY: Each domain registers its own routes, events, and services independently; the main application provider only registers shared infrastructure.
- **Use API-first internal communication** with service contracts. WHY: No direct database access across team boundaries; teams depend on contracts, not implementations.
- **Establish a stable shared kernel** with explicit ownership. WHY: A `Shared/` or `Support/` namespace without an owner degrades into unmaintained code.
- **Track merge conflict budgets** (<5 conflicts/month). WHY: Exceeding this threshold indicates need for structural reorganization.
- **Schedule regular architecture sync meetings** for shared concerns. WHY: Database migrations, package upgrades, and framework changes need cross-team coordination.

---

# Architecture Guidelines

- Module-per-team with explicit inbound/outbound contracts is the recommended pattern.
- Cross-team features use feature flags to decouple deployment from release.
- Contract testing (consumer-driven) prevents breaking changes across team boundaries.
- Maintain a team-to-namespace mapping document for onboarding.

---

# Performance Considerations

- Multiple service providers increase boot time — consider deferred providers and config caching.
- Database schema ownership per team means cross-team queries require API calls (HTTP or internal), adding latency.
- 10+ domain providers can add 50-100ms to boot time.

---

# Security Considerations

- Team boundaries are organizational, not security boundaries.
- Cross-domain contracts must be designed to prevent leaking sensitive data between domains.

---

# Common Mistakes

1. **Cross-team shared models:** `User` model used by all teams creates single point of coupling. Cause: convenience. Consequence: one model becomes bottleneck. Better: each team owns its user concept or communicates through contracts.

2. **No shared kernel owner:** Everyone contributes to `Shared/`, no one maintains. Cause: shared kernel seen as "free" space. Consequence: unmaintained code. Better: assign explicit ownership.

3. **Siloed infrastructure decisions:** Each team picks different logging, monitoring, or queue backends. Cause: team autonomy without standards. Consequence: operational inconsistency. Better: infrastructure standards with room for team-specific choices.

---

# Anti-Patterns

- **Flat namespace with multi-team**: All 10+ engineers sharing `App\` namespace — merge conflict chaos.
- **No contract versioning**: Breaking changes propagate instantly across teams.
- **Over-partitioning**: Creating modules for each of 3 engineers on a 12-person team.

---

# Examples

Multi-team PSR-4 structure:
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

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-09 When to deviate | MMD-01 Module vs microservice | DBC-09 Team-to-context mapping |
| COS-06 Domain-based org | MMD-11 Module extraction | AEG-06 Architecture Decision Records |

---

# AI Agent Notes

- For multi-team projects, always reference the team-to-namespace mapping before suggesting file locations.
- Generate code inside the appropriate team/domain namespace root.
- Never suggest cross-team direct model access — use contracts or events.

---

# Verification

- [ ] Each team has its own namespace root with PSR-4 mapping
- [ ] Merge conflicts are tracked and below 5/month threshold
- [ ] Cross-domain communication uses contracts, not direct model access
- [ ] Shared kernel has explicit ownership
- [ ] Architecture tests enforce team namespace boundaries
