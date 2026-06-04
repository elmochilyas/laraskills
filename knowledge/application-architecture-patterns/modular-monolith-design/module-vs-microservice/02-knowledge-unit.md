# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module vs. microservice: definition and key differences
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Executive Summary

A module is a logical boundary within a single deployment; a microservice is a network boundary across separate deployments. Both isolate business domains, but modules communicate via in-process method calls, while microservices communicate via network calls (HTTP, message queues). The modular monolith is the recommended starting architecture for most Laravel teams because it provides domain isolation without distribution complexity. Modules can be extracted to microservices later if scaling constraints justify it.

---

# Core Concepts

**Module:** A self-contained group of code within a monolith that owns a specific business domain. Modules share a database (potentially schema-separated), process space, and deployment unit. Communication is synchronous, in-process, and type-safe.

**Microservice:** An independently deployable service that owns its data store and communicates via network APIs. Each service has its own process, scaling, and deployment lifecycle.

---

# Mental Models

**The "Library vs. Service" model:** A module is like a library in the same process. A microservice is like a separate application on another server. Module calls are function calls; microservice calls are HTTP requests.

**The "Code Boundary vs. Network Boundary" model:** Modules are enforced by code conventions and automated checks. Microservices are enforced by network boundaries—you literally cannot access another service's database without going through its API.

**The "Same Deployment vs. Independent Deployment" model:** Module changes are deployed together. Microservices deploy independently. A module change requires a full application deploy; a microservice change is isolated.

---

# Internal Mechanics

**Module in Laravel:**
- Same `composer.json`, same autoloading
- Same database server (different tables or schema)
- Communication via PHP method calls or Laravel events
- Single deployment

**Microservice in Laravel:**
- Separate `composer.json`, separate autoloading
- Separate database (could be different types)
- Communication via HTTP APIs or message queues
- Independent deployment

---

# Patterns

**Module as precursor to microservice:** Design modules such that extraction is straightforward: explicit contracts, database schema ownership, no shared models. The modular monolith is the "ready to extract" state.

**Microservice as team boundary:** Microservices are primarily an organizational pattern. They enable teams to work and deploy independently. The technical complexity is the cost of organizational independence.

---

# Architectural Decisions

**Start with modular monolith when:** Teams < 30 engineers, single deployment is sufficient, and operational simplicity is valued.

**Extract to microservice when:** A module's resource requirements diverge significantly (scaling independently), the team owning the module needs independent deployment, or the module's data store needs a different technology.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Module: simple communication (method calls) | Module: no independent scaling | Entire application scales together |
| Microservice: independent scaling | Microservice: network latency | API calls add 2-50ms per call |
| Module: single deployment | Module: no independent deployment | Full app deploy for one module change |
| Microservice: independent team ownership | Microservice: distributed system complexity | Monitoring, tracing, debugging across services |

---

# Performance Considerations

Module calls are function calls (microseconds). Microservice calls are HTTP requests (milliseconds). The performance difference is 100-1000x. For latency-sensitive operations, modules are preferable.

---

# Production Considerations

40%+ of microservices implementations should have remained monoliths according to production reports. The modular monolith provides most of the benefits (domain isolation, clear ownership) without most of the costs (network complexity, deployment coordination, data consistency challenges).

---

# Common Mistakes

**Premature microservices:** Building 5 microservices for a team of 3 engineers. The operational overhead (CI x5, deploy x5, monitoring x5, database x5) consumes all development capacity.

**Module as folder, not boundary:** Creating module directories but allowing cross-module model access and shared database tables. The module boundary is a runtime constraint, not a folder name.

---

# Failure Modes

**Distributed monolith:** Microservices that share a database or have tight deployment coupling. Has the worst of both worlds: network overhead AND no independence.

**Module extraction failure:** A module designed for extraction that is so coupled to the monolith that extraction requires a rewrite. The module boundary was always a folder, not a genuine boundary.

---

# Ecosystem Usage

The `nwidart/laravel-modules` package provides module scaffolding. `Modulate` adds enforcement. Both support extraction paths.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| COS-06 Domain-based org | MMD-02 Boundary identification | MMD-11 Module extraction |
| COS-10 Team-scale strategies | MMD-17 Modular vs microservices | DBC-01 Bounded context |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
