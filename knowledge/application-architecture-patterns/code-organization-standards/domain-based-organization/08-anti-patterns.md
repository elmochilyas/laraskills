# ECC Anti-Patterns — Domain-Based Organization

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Organizing by domain: app/Domains/{Domain} structure |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Circular Domain Dependency
2. Domain Boundary Erosion
3. Anemic Domain Directories
4. Domain Too Large / Core Dumping Ground

---

## Repository-Wide Anti-Patterns

- God Services
- Overengineering
- Premature Abstraction
- Business Logic in Models

---

## Anti-Pattern 1: Circular Domain Dependency

### Category
Architecture

### Description
Domain A depends on Domain B's service contract, and Domain B depends on Domain A's service contract — creating a circular dependency. Neither domain can be independently tested, developed, or extracted.

### Why It Happens
Designing domains without a dependency graph. Cross-domain communication designed bidirectionally instead of unidirectionally. Failure to identify that shared concepts belong in a shared kernel.

### Warning Signs
- Architecture tests for domain isolation fail with circular references
- Both domains register each other's service providers
- Changing one domain requires changing the other
- Domains must be loaded in a specific order

### Why It Is Harmful
Domain isolation becomes meaningless — domains are tightly coupled. Extracting either domain to a microservice is impossible. Testing requires booting both domains.

### Preferred Alternative
Design domain dependencies as a directed acyclic graph. Extract shared concepts to a shared kernel. Use events for one-way communication. If Domain A needs Domain B's data, only Domain A depends on Domain B — never both directions.

### Refactoring Strategy
1. Map domain dependency graph and identify cycles
2. Extract shared code to application-level shared kernel
3. Redesign cross-domain communication as unidirectional
4. Use events for fire-and-forget; contracts for request-response
5. Enforce acyclic dependency rules with architecture tests

### Related Rules
- R04: Use Domain Events for Cross-Domain Communication (COS-06/05-rules.md)
- R06: Enforce Domain Isolation via Automated Checks (COS-06/05-rules.md)

### Related Skills
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)

### Related Decision Trees
- Full Domain Isolation vs Hybrid Domain-Layer Approach (COS-06/07-decision-trees.md)

---

## Anti-Pattern 2: Domain Boundary Erosion

### Category
Architecture

### Description
Domain boundaries degrade as new features are added to the "closest" domain instead of creating new domains or placing code in the correct one. Over time, domains become inconsistent collections of unrelated capabilities.

### Why It Happens
Creating a new domain directory feels like overhead. The existing domain "kind of" fits the new feature. No team convention for when to create a new domain. No automated boundary enforcement.

### Warning Signs
- A domain contains features that don't match its name
- "Core" domain exists and keeps growing
- New features are added to arbitrary domains
- No one can clearly describe what each domain owns

### Why It Is Harmful
Domains lose meaning — they become arbitrary groupings. Team ownership becomes fuzzy. Extraction to microservices requires significant untangling.

### Preferred Alternative
Document domain boundaries in a `domain-map.md` with explicit ownership, key models, and dependencies. Use architecture tests to enforce isolation. Establish rules for when to create new domains.

### Refactoring Strategy
1. Create or update `domain-map.md` with current state
2. Identify features in wrong domains
3. Move files, update namespaces, and fix imports
4. Add architecture tests preventing future erosion

### Related Rules
- R05: Document Domain Boundaries Explicitly (COS-06/05-rules.md)
- R06: Enforce Domain Isolation via Automated Checks (COS-06/05-rules.md)

### Related Skills
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)

---

## Anti-Pattern 3: Anemic Domain Directories

### Category
Code Organization

### Description
Domain directories that contain only Eloquent models with no controllers, services, events, or routes — effectively just namespacing. The "domain" adds organizational structure without any domain behavior or isolation.

### Why It Happens
Partial migration from default structure. Team creates domain directories but never moves behavior into them. Misunderstanding domain-based organization as purely a namespacing exercise.

### Warning Signs
- Domain directory contains only Models/ subdirectory
- No Services/, no Events/, no providers in the domain
- All business logic for the domain lives elsewhere
- Domain can be removed without affecting any functionality

### Why It Is Harmful
Domain grouping without behavior provides no value — it's just extra directory depth. The team gains isolation overhead without isolation benefits.

### Preferred Alternative
Each domain should be a mini-application with its own controllers, services, events, and service provider. If a domain has no behavior, it should not be a separate domain — move models to shared kernel or flatten.

### Refactoring Strategy
1. For each anemic domain, determine its real responsibility
2. Move related controllers, services, and routes into the domain
3. Create a domain service provider for registration
4. If no behavior exists, remove the domain directory and flatten models

### Related Rules
- R02: Give Each Domain Its Own Service Provider (COS-06/05-rules.md)
- R01: Never Access Another Domain's Eloquent Models Directly (COS-06/05-rules.md)

### Related Skills
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)

---

## Anti-Pattern 4: Domain Too Large / Core Dumping Ground

### Category
Code Organization

### Description
A "Core" domain containing everything that doesn't fit elsewhere — shared models, base classes, authentication logic, utility functions, and orphaned code. The Core domain becomes the new dumping ground, replacing `app/Helpers/` with `app/Domains/Core/`.

### Why It Happens
Failure to identify proper domain boundaries. Avoiding the effort to split into meaningful domains. The Core domain is a "miscellaneous" bucket that never gets reorganized.

### Warning Signs
- "Core" domain exists and keeps growing
- Core contains unrelated capabilities (auth + utilities + shared models + logging)
- No one can describe what "Core" means
- Core is imported by every other domain

### Why It Is Harmful
Core becomes a coupling bottleneck — every domain depends on it. The domain provides no meaningful isolation or ownership. Splitting it later is expensive.

### Preferred Alternative
Split Core into meaningful domains: `Identity`, `Platform`, `Shared`, etc. Cross-cutting infrastructure belongs in application-level directories (`app/Http/`, `app/Providers/`), not in any domain.

### Refactoring Strategy
1. List every class in the Core domain
2. Group by purpose: auth, shared models, utilities, base classes
3. Create proper domain directories or move to application level
4. Remove Core directory after all files are relocated
5. Add a team rule prohibiting catch-all domains

### Related Rules
- R07: Keep Shared Kernel Outside Any Domain (COS-06/05-rules.md)
- R03: Use Domain-Scoped Eloquent Models for Each Domain (COS-06/05-rules.md)

### Related Skills
- Organize Code by Domain With Bounded Context Isolation (COS-06/06-skills.md)

### Related Decision Trees
- Domain-Scoped Models vs Shared Models Across Domains (COS-06/07-decision-trees.md)
