# Metadata

Domain: Application Architecture Patterns
Subdomain: Modular Monolith Design
Knowledge Unit: Module boundary identification: bounded context heuristics
Difficulty Level: Intermediate
Last Updated: 2026-06-02

---

# Executive Summary

Module boundaries are determined by business domain boundaries, not technical convenience. The primary heuristic for identifying a module boundary is language: do the same words (User, Order, Account) mean different things in different contexts? If "User" means "login credentials" in one context and "shipping recipient" in another, those are separate modules. Other heuristics include team ownership (can a team own this end-to-end?), data lifecycle (does this data change at different rates?), and change frequency (do concepts change for different reasons?).

---

# Core Concepts

**Bounded Context (DDD):** A boundary within which a particular domain model applies. Words and concepts have specific, unambiguous meanings inside the context. Outside it, they may mean different things.

**Module boundary heuristics:**
- **Language divergence:** Same word means different things
- **Data lifecycle:** Different change patterns
- **Team alignment:** Can one team own this entirely?
- **Change frequency:** Concepts that change for different reasons
- **Business capability:** Does this represent a distinct business capability?

---

# Mental Models

**The "Same Word, Different Meaning" model:** If "Customer" in Billing means "payment information and billing address" but in Support means "ticket history and satisfaction score," those are different modules. The word looks the same but the concept is different.

**The "Change Reason" model:** If changes to "Product" are driven by catalog management needs (pricing, description, images) vs. inventory management needs (stock levels, warehouse location), those may be separate modules changing for different reasons.

**The "Team Ownership" model:** If a 2-pizza team can own the feature end-to-end, it's a good module candidate. If it requires coordination with 3 other teams to ship a change, the boundary is wrong.

---

# Internal Mechanics

Boundary identification process:
1. List all business concepts (nouns: User, Order, Product, Invoice, etc.)
2. For each concept, list its attributes and behaviors
3. Group concepts that share attributes and change together
4. Split groups where concepts diverge in meaning or change frequency
5. Validate with domain experts: "Does 'Order' mean the same thing in these two contexts?"

---

# Patterns

**Event storming:** Facilitated workshop where domain experts and developers map business events to discover bounded contexts. Each context becomes a module candidate.

**Domain storytelling:** Walk through business processes end-to-end. Where the process hands off between teams or systems is a potential boundary.

**Stable vs. volatile grouping:** Identify which concepts are stable (change rarely) and which are volatile (change frequently). Group stable with stable, volatile with volatile.

---

# Architectural Decisions

**Module boundary is right when:** A team can own it independently, the concept has a clear definition within the boundary, and changes rarely require coordination across boundaries.

**Module boundary is wrong when:** Every change requires touching multiple modules, or the same concept has fragmented logic across modules.

**Start broad, split later:** Module boundaries are easier to split than merge. Start with broader boundaries and split as you discover divergence.

---

# Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Clear domain isolation | Boundary identification takes effort | Wrong boundaries cause painful restructuring |
| Team ownership clarity | Over-splitting creates integration overhead | 20 modules for a 5-person team |
| Independent evolution | Under-splitting creates god modules | One module contains everything, defeats purpose |

---

# Performance Considerations

More modules = more inter-module communication = more overhead. Very fine-grained modules (10+ for a single database) create cross-module query overhead without providing organizational value.

---

# Production Considerations

Document the rationale for each module boundary in an ADR. Include: the bounded context name, the concepts it owns, the interfaces it exposes, and the other modules it depends on.

---

# Common Mistakes

**Technical boundaries, not business boundaries:** Creating modules by technical layer (API Module, Admin Module) instead of business domain (Billing Module, Catalog Module).

**Database-driven boundaries:** Using existing database tables as module boundaries. Tables reflect historical data design, not necessarily business domain boundaries.

**Too fine-grained from the start:** Creating 15 modules for a 3-developer application. Module overhead consumes development capacity.

---

# Failure Modes

**Wrong boundary discovered too late:** Six months of development reveal that two "modules" should actually share a model. Merging modules is expensive and risky.

**Context conflation:** Two domains that should be separate (Billing and Subscriptions) treated as one module because they share database tables. Separation requires data migration.

---

# Ecosystem Usage

The `Modulate` package includes a `modulate:analyze` command that suggests module boundaries based on code dependencies. Manual event storming and domain modeling are the recommended approaches.

---

# Related Knowledge Units

| Prerequisites | Related Topics | Advanced Follow-up |
|---|---|---|
| MMD-01 Module vs microservice | DBC-01 Bounded context identification | DBC-02 Context mapping |
| DDD basics | MMD-03 Module internal structure | DBC-08 Evolutionary boundaries |

---

## Research Notes

The modular monolith pattern has gained significant traction in the Laravel community as a pragmatic alternative to microservices. Shazeed Ul Karim's 2026 guide on modular monoliths with Clean Architecture provides a concrete implementation blueprint using Domain, Application, Infrastructure, and Presentation layers per module. The approach emphasizes keeping business logic away from Laravel framework details, modules communicating through contracts, and dependency direction pointing inward. The 
widart/laravel-modules package remains the most popular module scaffolding tool, while modulate adds enforcement capabilities. Community research consistently shows that 40%+ of microservice implementations would have been better served by a modular monolith, making this pattern the recommended starting architecture for most Laravel teams.
