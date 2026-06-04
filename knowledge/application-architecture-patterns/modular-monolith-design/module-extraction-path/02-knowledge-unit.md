# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module extraction path: from module to independent service
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

Module extraction is the process of moving a module from the monolith to a standalone microservice. Extraction is justified when a module's resource requirements (CPU, memory, scaling), team ownership, or deployment cadence diverge significantly from the monolith. The extraction path follows: analyze dependencies, extract code, create independent service, establish communication, and cut over. The modular monolith's value proposition is that extraction is possible—if extraction is never needed, the modular structure was still beneficial for code organization.

---

# Core Concepts

**Extraction triggers:**
- Resource divergence: Module needs different scaling than the monolith
- Team independence: Module team needs independent deployment
- Technology divergence: Module needs a different database or infrastructure
- Performance isolation: Module's resource usage impacts other modules

**Extraction cost is lower than from a flat monolith:** Because module boundaries are already explicit, extraction is orders of magnitude cheaper than untangling a flat codebase.

---

# Mental Models

**The "Extraction, Not Rewrite" model:** A well-designed module can be extracted by copying its directory, adding `composer.json`, and deploying. You should NOT need to rewrite the module during extraction.

**The "Surgery, Not Amputation" model:** Extraction is surgical. You disconnect the module's dependencies, add network communication where in-process calls existed, and route traffic to the new service. The monolith keeps running during the transition.

**The "Strangler Fig" model:** Gradually replace the monolith's module handling with calls to the new microservice. Route by route, feature by feature, traffic shifts to the new service.

---

# Internal Mechanics

**Extraction steps:**
1. **Analyze dependencies:** Identify all inbound and outbound dependencies. Document contracts.
2. **Freeze contracts:** Ensure all cross-module interfaces are stable and versioned.
3. **Extract code:** Copy module directory to new repository. Add `composer.json`, CI, Dockerfile.
4. **Replace in-process calls with network calls:** Contracts become HTTP/API calls. Events become message queue events.
5. **Introduce API gateway or service mesh:** Route traffic for the extracted module's endpoints to the new service.
6. **Cut over:** Monolith stops handling the module's domain. New service is live.

**Deployment during extraction:**
- The module exists in both monolith and new service during transition
- Traffic is routed gradually: internal calls still go to monolith, external API calls go to new service
- Feature flags control which code path is active

---

# Patterns

**Strangler Fig extraction:** Keep the monolith serving. Add the new service alongside. Route specific endpoints or features to the new service. When everything is migrated, remove from monolith.

**Parallel run extraction:** Run both the monolith module and the new service simultaneously. Compare outputs to verify correctness before cutting over.

**Contract testing during extraction:** Consumer-driven contract tests ensure the new service behaves identically to the old module from the consumer's perspective.

---

# Architectural Decisions

**Extract when:** Module has diverging resource needs, team requires independent deployment, or the module genuinely benefits from a different technology stack.

**Don't extract when:** The only reason is "microservices are trendy." The modular monolith provides most benefits without distribution costs.

**Start with contract hardening:** Before any extraction, ensure the module's contracts are stable, tested, and versioned. This is the prerequisite for extraction.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Independent scaling and deployment | Network communication overhead | In-process calls (microseconds) become HTTP (milliseconds) |
| Team independence | Data consistency becomes distributed | ACID → eventual consistency |
| Technology flexibility | Duplicate infrastructure (CI, monitoring, logging) | Each service needs its own pipeline |
| Performance isolation | Operational complexity | N services instead of 1 deployment |

---

# Performance Considerations

Extracted module communication adds network latency. If the module was frequently called synchronously, consider batching, caching, or async communication patterns.

---

# Production Considerations

Extraction is a high-risk operation. Run parallel deployments for several weeks. Monitor error rates, latency, and data consistency. Roll back plan must exist.

---

# Common Mistakes

**Extracting too early:** Before the module's contracts have stabilized. Every contract change during extraction adds significant cost.

**Extracting too late:** After the monolith has grown so large that extraction requires rewriting because the module was never truly isolated.

**Forgetting shared database:** The extracted module continues using the monolith's database. This creates a distributed monolith (worst of both worlds).

---

# Failure Modes

**Extraction reveals missing boundaries:** The module that seemed isolated uses shared models, accesses other modules' tables, and has circular dependencies. Extraction requires a redesign.

**Data inconsistency post-extraction:** With separate databases, previously ACID operations are now eventually consistent. Bugs from stale data surface.

---

# Ecosystem Usage

The `Modulate` package includes `modulate:extract` which analyzes dependencies and generates extraction scaffolding. The `nwidart/modules` package documents extraction patterns.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-09 Module dependency mgmt | MMD-10 Cross-module data access | MMD-17 Modular vs microservices |
| MMD-06 Sync inter-module comm | MMD-13 Database schema ownership | DBC-12 Eventual consistency |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
