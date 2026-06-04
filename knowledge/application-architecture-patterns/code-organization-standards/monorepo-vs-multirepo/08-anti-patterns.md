# ECC Anti-Patterns — Monorepo vs Multi-Repo Tradeoffs

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Monorepo vs. multi-repo organizational tradeoffs |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Microservices Driving Premature Multi-Repo
2. Monorepo Without Module Boundaries
3. Multi-Repo Without Shared Contracts
4. Monorepo CI Death

---

## Anti-Pattern 1: Microservices Driving Premature Multi-Repo

### Description
Creating 5+ repositories for what could be a modular monolith. Anticipating future microservices that never arrive, multiplying operational costs (CI pipelines, deployment scripts, monitoring) without benefit.

### Why It Happens
Assuming all modularity requires separate repos. Following microservice hype without evaluating if independent deployment is needed.

### Warning Signs
- Repositories have shared code copy-pasted between them
- Cross-repo changes require multiple PRs and coordination
- Team spends more time on repo management than feature development
- No independent deployment benefits realized

### Preferred Alternative
Start with a modular monolith in a single repo. Extract to separate repos only when independent deployment is proven necessary.

### Related Rules
- R01: Modular Monolith Before Microservices (MMD-01/05-rules.md)

---

## Anti-Pattern 2: Monorepo Without Module Boundaries

### Description
Putting everything in one repository without any module structure. The monorepo is just a monolith with no internal boundaries — all code mixed together, no ownership, no isolation.

### Why It Happens
Equating monorepo with "no structure." Failing to enforce internal module boundaries.

### Warning Signs
- All code under `app/` with no module directories
- No team ownership boundaries
- Cross-cutting changes affect the entire codebase

### Preferred Alternative
Enforce module boundaries even within a monorepo. Use directories, namespaces, and architecture tests to establish internal isolation.

---

## Anti-Pattern 3: Multi-Repo Without Shared Contracts

### Description
Splitting into multiple repos without a shared contracts package. Each repo duplicates shared type definitions, interfaces, and DTOs — leading to code drift and incompatibility.

### Why It Happens
Underestimating cross-cutting concerns. Assuming APIs between repos are loose enough that shared contracts aren't needed.

### Warning Signs
- Same DTO defined in multiple repos
- Integration tests fail due to incompatible expectations
- Manual coordination needed for every cross-repo change

### Preferred Alternative
Maintain a shared contracts package (Composer package) with interfaces, DTOs, and type definitions. Version it with semantic versioning.
