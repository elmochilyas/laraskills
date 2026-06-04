# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module vs. microservice: definition and key differences
Knowledge Unit ID: MMD-01
Difficulty Level: Foundation
Last Updated: 2026-06-02

---

# Overview

A module is a logical boundary within a single deployment; a microservice is a network boundary across separate deployments. Modules communicate via in-process method calls; microservices communicate via network calls. The modular monolith is the recommended starting architecture for most Laravel teams.

---

# Core Concepts

- **Module**: Self-contained code group within a monolith owning a business domain. Shares database, process, deployment. Communication is in-process, type-safe.
- **Microservice**: Independently deployable service owning its data store. Separate process, scaling, deployment lifecycle. Communication is network-based.
- **Module = Library analogy**: Same process, function calls. **Microservice = Separate application**: HTTP requests.

---

# When To Use

Module: Teams <30 engineers, single deployment sufficient, operational simplicity valued.
Microservice: Module resource requirements diverge, team needs independent deployment, different data store technology needed.

---

# When NOT To Use

Module extraction when module is coupled to monolith internals (extraction requires rewrite). Microservice when team <15 engineers — operational overhead consumes development capacity.

---

# Best Practices

- **Start with modular monolith; extract to microservice only when justified.** WHY: 40%+ of microservice implementations should have remained monoliths. Modules provide domain isolation without distribution costs.
- **Design modules as extraction-ready** from the start. WHY: Explicit contracts, database schema ownership, and no shared models make extraction straightforward when needed.
- **Enforce module boundaries as runtime constraints** — not just folder names. WHY: Module as folder without enforcement (cross-module model access, shared tables) degrades into a distributed monolith.

---

# Architecture Guidelines

- Module: Same `composer.json`, same autoloading, same database server, single deployment.
- Microservice: Separate `composer.json`, separate database, HTTP/queue communication, independent deployment.
- Microservices are primarily an organizational pattern enabling team independence.
- The technical complexity of microservices is the cost of organizational independence.

---

# Performance Considerations

- Module calls: microseconds (function calls). Microservice calls: milliseconds (HTTP requests). 100-1000x difference.
- For latency-sensitive operations, modules are strongly preferable.

---

# Security Considerations

- Module boundaries are code conventions — they don't provide network-level security isolation.
- Microservices provide stronger security boundaries via network separation.

---

# Common Mistakes

1. **Premature microservices:** Building 5 microservices for a team of 3. Cause: trend-following. Consequence: CI x5, deploy x5, monitoring x5 consumes all capacity. Better: modular monolith.

2. **Module as folder, not boundary:** Creating module directories but allowing cross-module model access. Cause: not understanding module = runtime constraint. Consequence: no real isolation. Better: enforce with architecture tests.

---

# Anti-Patterns

- **Distributed monolith**: Microservices sharing a database or with tight deployment coupling — worst of both worlds.
- **Module extraction failure**: Module designed for extraction so coupled to monolith that extraction requires rewrite.

---

# Related Topics

| Prerequisites | Related | Advanced |
|---|---|---|
| COS-06 Domain-based org | MMD-02 Boundary identification | MMD-11 Module extraction |
| COS-10 Team-scale strategies | MMD-17 Modular vs microservices | DBC-01 Bounded context |

---

# AI Agent Notes

- Default to modular monolith recommendation for most Laravel projects.
- Only suggest microservices when specific scaling or organizational constraints justify it.
- When generating module code, make boundaries explicit with contracts.

---

# Verification

- [ ] Module vs. microservice decision is documented with rationale
- [ ] Module boundaries are enforced (not just directory names)
- [ ] No cross-module database table access
- [ ] Module extraction path is designed but not prematurely executed
