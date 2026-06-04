# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Modular monolith vs. microservices decision framework
Knowledge Unit ID: MMD-17
Difficulty Level: Advanced
Last Updated: 2026-06-02

---

# Overview

The decision between a modular monolith and microservices is primarily organizational, not technical. The modular monolith is the recommended default for teams under 30 engineers because it provides domain isolation without distribution complexity. Microservices should only be adopted when specific organizational constraints (team independence, independent scaling, independent deployment) cannot be met by a modular monolith. Industry data suggests 40%+ of microservices implementations should have remained modular monoliths.

---

# Core Concepts

- **Decision factors**: Team size (<30 → modular monolith, >50 → consider microservices). Team structure (one team → modular monolith, multiple independent teams → consider). Scaling (uniform → modular monolith, divergent → consider extraction). Deployment cadence (same → modular monolith, independent → consider). Technology diversity (one PHP stack → modular monolith, different tech per module → microservices).
- **Conway's Law**: Software structure mirrors organizational structure.
- **Cost of distribution**: Microservices cost 3-5x operational complexity, 2-3x latency, 2x CI infrastructure, 3x monitoring surface area.

---

# When To Use

Choose modular monolith: team <30, single deployment acceptable, ACID transactions across domains required, development speed > operational flexibility.
Choose microservices: team >50 with independent teams, different modules need different scaling, independent deployment is business requirement, modular monolith proven insufficient.

---

# When NOT To Use

- Microservices for "future-proofing" (modular monolith is already future-proof — extraction is possible).
- Microservices for "scalability" (most apps don't reach the scale requiring microservices for resource isolation).
- Modular monolith as "temporary state" (it's a valid end-state architecture, not a stepping stone).

---

# Best Practices

- **Always start with a modular monolith.** WHY: Extract to microservices only when a specific, measurable constraint prevents the monolith from working. Extraction is possible because modules are already isolated.
- **Track module resource usage.** WHY: CPU, memory, query volume per module. When a module's resource profile diverges significantly, extraction is justified.
- **Use Conway's Law as guidance.** WHY: If your team structure is one team, the software should be one deployment (modular monolith). Independent teams may justify microservices.
- **Avoid the distributed monolith.** WHY: Microservices that share a database or have synchronous call chains combine the operational complexity of microservices with the coupling of a monolith — worst of both worlds.

---

# Architecture Guidelines

- Start modular, extract when necessary. Begin with a modular monolith. Track resource usage per module.
- Use bounded contexts as module boundaries. If a bounded context would be a microservice in distributed architecture, it's a good module in a modular monolith.
- Independent deployability as signal: if the business requires "Team A must deploy without waiting for Team B," microservices may be justified.

---

# Performance Considerations

- Modular monolith: in-process calls (μs), single DB connection pool, uniform scaling.
- Microservices: network calls (ms), N connection pools, independent scaling.
- For latency-sensitive operations, modular monolith wins.

---

# Security Considerations

- Modular monolith: single security context, centralized auth.
- Microservices: distributed security, each service needs auth, inter-service communication must be encrypted/authenticated.

---

# Common Mistakes

1. **Microservices for "future-proofing":** Building microservices before needed. Cause: fear of monolith. Consequence: adds complexity without benefit. Better: modular monolith is already future-proof (extraction possible).

2. **Microservices for "scalability":** Assuming microservices are needed for scale. Cause: overestimating traffic. Consequence: unnecessary complexity. Better: well-optimized monolith handles millions of users.

3. **Modular monolith as temporary state:** Treating modular monolith as "not yet microservices." Cause: microservices bias. Consequence: never optimizing modular structure. Better: modular monolith is a valid end-state architecture.

---

# Anti-Patterns

- **Distributed monolith**: Microservices sharing a database or with synchronous call chains. Operational complexity of microservices + coupling of a monolith.
- **Premature microservices**: 5 services for a 5-person team. CI costs x5, deployment x5, monitoring x5. Development velocity drops 50%+.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| MMD-01 Module vs microservice | COS-11 Monorepo vs multirepo | DBC-09 Team-to-context mapping |
| MMD-11 Module extraction path | COS-10 Team-scale strategies | Microservices domain (cross-link) |

---

# AI Agent Notes

- Default recommendation: modular monolith for teams under 30.
- Only suggest microservices when specific organizational constraints prove modular monolith insufficient.
- If extraction path is unclear, recommend modular monolith first.

---

# Verification

- [ ] Team size and structure inform architecture decision
- [ ] Modular monolith is the default starting point
- [ ] Extraction triggers are defined and measured
- [ ] Distributed monolith anti-pattern is avoided
- [ ] Decision is documented with specific rationale
