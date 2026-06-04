# Decision Trees: Modular Monolith vs. Microservices Decision Framework

## Metadata

- **Domain:** Application Architecture Patterns
- **Subdomain:** Modular Monolith Design
- **Knowledge Unit:** Modular monolith vs. microservices decision framework
- **Knowledge Unit ID:** MMD-17
- **Difficulty Level:** Advanced

---

## Decision Inventory

| # | Decision | Category | When Applied |
|---|----------|----------|-------------|
| 1 | Modular monolith vs microservices for project inception | Architecture | Project start |
| 2 | Extract module vs keep in monolith (ongoing decision) | Architecture | Growth evaluation |
| 3 | Conway's Law: align software to org structure vs optimize independently | Organization | Team scaling |

---

## Decision 1: Modular monolith vs microservices for project inception

### Context
Always start with a modular monolith. Microservices add 3-5x operational complexity, 2-3x latency, 2x CI infrastructure, and 3x monitoring surface area. Only adopt microservices when specific, measurable organizational constraints prevent the monolith from working. The modular monolith is a valid end-state architecture.

### Decision Tree

```
Is the team smaller than 30 engineers?
├── YES
│   Does the business require independently deployable sub-teams from day one?
│   ├── YES → Consider microservices (rare — most teams don't need this)
│   │   Document specific triggers that justify this decision
│   └── NO → Start with modular monolith (default)
└── NO (team ≥30)
    Does the team have independently operating sub-teams (>15 each)?
    ├── YES → Consider microservices for independent deployment
    │   Assess organizational coupling — are teams truly independent?
    │   └── YES → Microservices may be justified
    │   └── NO (teams still communicate frequently) → Stay modular monolith
    └── NO (single team) → Start with modular monolith
```

### Rationale
Team size is the strongest predictor. Teams under 30 cannot absorb the operational overhead of multiple services. The modular monolith provides domain isolation without distribution costs. Microservices primarily solve organizational independence — if the organization doesn't need independence, microservices add only cost.

### Recommended Default
Modular monolith for all projects with teams under 30 engineers

### Risks
- Premature microservices: 50%+ velocity drop from operational complexity
- Microservices for wrong reasons (scalability, future-proofing): no measurable benefit
- Not treating modular monolith as end-state: underinvesting in module quality

### Related Rules
- Start with Modular Monolith (MMD-17/05-rules.md)
- Team Size as Primary Factor (MMD-17/05-rules.md)
- Assess Cost of Distribution (MMD-17/05-rules.md)
- Use Conway's Law (MMD-17/05-rules.md)

### Related Skills
- Decide Between Modular Monolith and Microservices (MMD-17/06-skills.md)
- Decide Module vs Microservice (MMD-01/06-skills.md)

---

## Decision 2: Extract module vs keep in monolith (ongoing decision)

### Context
As the system grows, modules may need extraction to independent services. This decision should be data-driven: track per-module resource usage (CPU, memory, query volume, response time). Only extract when a module's resource profile diverges significantly from the rest of the monolith. Treat the modular monolith as a permanent architecture.

### Decision Tree

```
Is there a measurable resource divergence (CPU, memory, query volume)?
├── YES
│   Is the module's resource usage significantly different (>2x) from average?
│   ├── YES → Consider extraction — the module is constraining the rest
│   └── NO → Not yet — extract when divergence is significant
└── NO
    Does the module's team need independent deployment?
    ├── YES → Consider extraction — organizational need
    │   Has the team grown large enough to be independent (>15)?
    │   ├── YES → Extraction justified
    │   └── NO → Wait — smaller teams benefit from shared infrastructure
    └── NO → Keep in monolith — extraction provides no benefit
```

### Rationale
Extraction is a cost — doubling CI, deployment, monitoring. The trigger must provide a clear benefit. Resource divergence is the most common technical trigger: if Billing uses 70% of DB CPU, extracting it protects Catalog and Orders from Billing's scaling problems. Team independence is the organizational trigger. Without either, the cost of extraction exceeds the benefit.

### Recommended Default
Keep in modular monolith — extract only when resource or organizational triggers are met

### Risks
- Extracting without data: guessing instead of measuring — may extract wrong module
- Not monitoring resource usage: missing the signal that extraction is needed
- Extracting too late: module was never truly isolated — extraction requires rewrite

### Related Rules
- Track Module Resource Usage (MMD-17/05-rules.md)
- Start with Modular Monolith (MMD-17/05-rules.md)
- Avoid Distributed Monolith (MMD-17/05-rules.md)
- Document Decision in ADR (MMD-17/05-rules.md)

### Related Skills
- Decide Between Modular Monolith and Microservices (MMD-17/06-skills.md)
- Extract Module to Microservice (MMD-11/06-skills.md)
- Map Team to Context (DBC-09/06-skills.md)

---

## Decision 3: Conway's Law: align software to org structure vs optimize independently

### Context
Conway's Law states that software structure mirrors organizational communication structure. If one team communicates frequently, one deployment (modular monolith) is natural. If multiple independent teams exist, multiple deployments (microservices) may be justified. The decision is whether to align to org structure or optimize for technical independence.

### Decision Tree

```
How many independent communication groups exist in the team?
├── 1 (single team, frequent internal communication)
│   → Align with modular monolith — one deployment matches one team
│   Independent deployability provides no benefit because the same team maintains everything
├── 2-3 (sub-teams with distinct ownership)
│   Do sub-teams need independent deployment?
│   ├── YES → Consider extracting high-ownership modules to microservices
│   └── NO → Modular monolith with clear module ownership works
└── 4+ (multiple independent teams)
    → Microservices should be considered
    Modular monolith coordination overhead grows with team count
```

### Rationale
Conway's Law is descriptive, not prescriptive — it describes what will happen naturally, not what you should do. If you have one team and build microservices, the team will still need to coordinate across all services (no organizational benefit). If you have multiple teams and build a monolith, coordination costs increase. Align software structure to the org structure you have, not the one you wish for.

### Recommended Default
Align software deployment structure to current organizational structure

### Risks
- Microservices with one team: all coordination costs, no organizational benefit
- Monolith with independent teams: deployment coordination overhead blocks team independence
- Misaligned structure: either too much coordination (monolith + independent teams) or too much cost (microservices + one team)

### Related Rules
- Use Conway's Law (MMD-17/05-rules.md)
- Team Size as Primary Factor (MMD-17/05-rules.md)
- Start with Modular Monolith (MMD-17/05-rules.md)
- Avoid Distributed Monolith (MMD-17/05-rules.md)

### Related Skills
- Decide Between Modular Monolith and Microservices (MMD-17/06-skills.md)
- Map Team to Context (DBC-09/06-skills.md)
- Decide Module vs Microservice (MMD-01/06-skills.md)
