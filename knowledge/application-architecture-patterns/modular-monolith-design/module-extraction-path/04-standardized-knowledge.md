# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module extraction path: from module to independent service
Knowledge Unit ID: MMD-11
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

Module extraction is moving a module from the monolith to a standalone microservice. Justified when a module's resource requirements (CPU, memory, scaling), team ownership, or deployment cadence diverge significantly from the monolith. Extraction path: analyze dependencies, extract code, create independent service, establish network communication, cut over. The modular monolith's value proposition is that extraction is possible — if never needed, modular structure was still beneficial.

---

# Core Concepts

- **Extraction triggers**: Resource divergence, team independence, technology divergence, performance isolation.
- **Extraction cost is lower than from a flat monolith**: Module boundaries are already explicit.
- **Steps**: 1) Analyze dependencies. 2) Freeze contracts. 3) Extract code to new repo. 4) Replace in-process calls with network calls. 5) Route traffic. 6) Cut over.

---

# When To Use

- Module has diverging resource needs (different scaling).
- Team requires independent deployment.
- Module genuinely benefits from a different technology stack.

---

# When NOT To Use

- Only reason is "microservices are trendy." The modular monolith provides most benefits without distribution costs.
- Module's contracts are still evolving (every contract change during extraction adds significant cost).

---

# Best Practices

- **Start with contract hardening.** WHY: Before extraction, ensure module contracts are stable, tested, and versioned. This is the prerequisite for extraction.
- **Use parallel run extraction.** WHY: Run both monolith module and new service simultaneously. Compare outputs to verify correctness before cutting over.
- **Never share database after extraction.** WHY: The extracted module continuing to use the monolith's database creates a distributed monolith — worst of both worlds.
- **Feature flag the cutover.** WHY: Enables gradual traffic shifting and instant rollback.

---

# Architecture Guidelines

- Extraction follows the Strangler Fig pattern: gradually replace monolith module handling with calls to the new service, route by route.
- Contracts become HTTP/API calls. Events become message queue events.
- Use API gateway or service mesh to route extracted module endpoints to the new service.
- The module exists in both monolith and new service during transition.

---

# Performance Considerations

- Extracted module communication adds network latency (in-process μs → HTTP ms).
- Batch or cache data that was previously accessed via in-process contract calls.
- Consider async communication for non-critical cross-service calls.

---

# Security Considerations

- Extracted service needs its own authentication/authorization. No longer shares the monolith's security context.
- Network communication between services must be encrypted and authenticated.

---

# Common Mistakes

1. **Extracting too early:** Before module contracts have stabilized. Cause: excitement about microservices. Consequence: every contract change adds cost. Better: extract only when contracts have been stable for weeks.

2. **Extracting too late:** Monolith grew so large that extraction requires rewriting. Cause: no enforcement of module boundaries. Consequence: module was never truly isolated. Better: enforce boundaries from day one.

3. **Forgetting shared database:** Extracted module continues using the monolith's database. Cause: convenience. Consequence: distributed monolith. Better: separate database per service.

---

# Anti-Patterns

- **Big bang extraction**: Extracting the module in one massive deployment instead of using Strangler Fig pattern.
- **Extraction without rollback plan**: No way to revert if the new service fails.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-09 Module dependency mgmt | MMD-10 Cross-module data access | MMD-17 Modular vs microservices |
| MMD-06 Sync inter-module comm | MMD-13 Database schema ownership | DBC-12 Eventual consistency |

---

# AI Agent Notes

- Before suggesting extraction, verify module has stable contracts and no shared database access.
- Generate Strangler Fig migration scaffolding for gradual extraction.
- Include rollback plan in extraction recommendations.

---

# Verification

- [ ] Module contracts are stable and versioned
- [ ] Module has no shared database access with other modules
- [ ] Extraction follows Strangler Fig (gradual, not big bang)
- [ ] Rollback plan exists
- [ ] New service has its own database
