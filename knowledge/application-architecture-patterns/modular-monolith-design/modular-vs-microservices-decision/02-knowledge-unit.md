# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Modular monolith vs. microservices decision framework
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Executive Summary

The decision between a modular monolith and microservices is primarily organizational, not technical. The modular monolith is the recommended default for teams under 30 engineers because it provides domain isolation without distribution complexity. Microservices should only be adopted when specific organizational constraints (team independence, independent scaling, independent deployment) cannot be met by a modular monolith. Industry data suggests 40%+ of microservices implementations should have remained modular monoliths.

---

# Core Concepts

**Decision factors:**
- **Team size:** <30 engineers → modular monolith. >50 → consider microservices.
- **Team structure:** One team → modular monolith. Multiple independent teams → consider microservices.
- **Scaling requirements:** Uniform scaling → modular monolith. Divergent module scaling → consider extraction.
- **Deployment cadence:** Same cadence → modular monolith. Independent cadences → consider microservices.
- **Technology diversity:** One PHP stack → modular monolith. Need different tech per module → microservices.

---

# Mental Models

**The "Modular First" model:** Always start with a modular monolith. Extract to microservices only when a specific, measurable constraint prevents the monolith from working. Extraction is possible because modules are already isolated.

**The "Cost of Distribution" model:** Microservices cost significantly more than monolithic deployment: 3-5x operational complexity, 2-3x latency for cross-service calls, 2x CI infrastructure, 3x monitoring surface area. The modular monolith avoids these costs.

**The "Conway's Law" model:** Software structure mirrors organizational structure. If your team structure is one team, the software should be one deployment (modular monolith). If your organization has independent teams, microservices may be justified.

---

# Internal Mechanics

**Scoring framework:**
| Factor | Modular Monolith | Microservices |
|---|---|---|
| Team size | 1-30 engineers | 30+ (per service: 3-8) |
| Deployment | One deployment | N deployments |
| Latency | In-process (μs) | Network (ms) |
| Data consistency | ACID | Eventual consistency |
| Testing | Single stack | Per-service integration |
| Monitoring | One app | N apps |

---

# Patterns

**Start modular, extract when necessary:** Begin with a modular monolith. Track module resource usage (CPU, memory, query volume). When a module's resource profile diverges significantly, consider extraction.

**Domain-driven module boundaries:** Use bounded contexts as module boundaries. If a bounded context would be a microservice in a distributed architecture, it's a good module in a modular monolith.

**Independent deployability as signal:** If the business constraint is "Team A must deploy without waiting for Team B," microservices may be justified. If not, modular monolith.

---

# Architectural Decisions

**Choose modular monolith when:**
- Team < 30 engineers
- Single deployment is acceptable
- ACID transactions across domains are required
- Development speed > operational flexibility
- Team is comfortable with architectural enforcement

**Choose microservices when:**
- Team > 50 engineers with independent team structures
- Different modules need different scaling
- Independent deployment is a business requirement
- Different technologies per module are required
- The modular monolith has been proven insufficient

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Modular monolith: simple operations | Modular monolith: single deployment bottleneck | All modules deploy together |
| Microservices: independent deployment | Microservices: coordination overhead | N deployment pipelines, N monitoring dashboards |
| Modular monolith: ACID transactions | Modular monolith: shared database evolution | Schema changes affect all modules |
| Microservices: independent scaling | Microservices: data duplication | Each service owns its data, duplication required |

---

# Performance Considerations

Modular monolith: in-process calls, single database connection pool, uniform scaling. Microservices: network calls, N connection pools, independent scaling. For latency-sensitive operations, modular monolith wins.

---

# Production Considerations

Startups and mid-stage companies should almost always choose modular monolith. The operational simplicity accelerates iteration. Microservices benefits (independent deployment, scaling) are rarely needed in early stages.

---

# Common Mistakes

**Microservices for "future-proofing":** Building microservices before they're needed adds complexity without benefit. The modular monolith is already future-proof because extraction is possible.

**Microservices for "scalability":** Most applications don't reach the scale where microservices are needed for resource isolation. A well-optimized monolith handles millions of users.

**Modular monolith as a temporary state:** Treating the modular monolith as "not yet microservices." The modular monolith is a valid end-state architecture, not a stepping stone.

---

# Failure Modes

**Distributed monolith:** The worst outcome. Microservices that share a database or have synchronous call chains. Has the operational complexity of microservices with the coupling of a monolith.

**Premature microservices:** 5 services for a 5-person team. CI costs x5, deployment complexity x5, monitoring x5. Development velocity drops by 50%+.

---

# Ecosystem Usage

Industry reports (AcquaintSoft, Internative, DigitalCodeLabs 2026) consistently recommend modular monolith as the default architecture for Laravel applications under 30 engineers. The community position is strongly modular-first.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-01 Module vs microservice | COS-11 Monorepo vs multirepo | DBC-09 Team-to-context mapping |
| MMD-11 Module extraction path | COS-10 Team-scale strategies | Microservices domain (cross-link) |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
