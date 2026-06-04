# Anti-Patterns: Module Boundaries in Monoliths

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Service Decomposition |
| **Topic** | Module boundaries in monoliths |
| **Difficulty** | Intermediate |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Shared Tables Across Modules | Architecture | High |
| 2 | Cross-Module Model References | Architecture | High |
| 3 | No Module Boundaries at All | Architecture | High |
| 4 | Module Database Communication | Design | Medium |

## Repository-Wide Anti-Patterns

- **Shared Schema Coupling**: Modules sharing database tables, preventing independent evolution or extraction
- **Eloquent Leakage**: Modules importing each other's models directly instead of through interfaces
- **Big Ball of Mud**: No explicit module structure — all code in the `app/` directory by technical layer

---

## 1. Shared Tables Across Modules

**Category:** Architecture

**Description:** Modules sharing database tables, creating implicit coupling that prevents extraction into services.

**Why It Happens:** Laravel's default structure encourages shared tables. Modules are initially just namespaces, not isolated components.

**Warning Signs:**
- Cross-module foreign key relationships
- Schema changes in one module require changes in another
- Module extraction blocked by data coupling

**Why Harmful:** If modules share tables, extracting a module into a service requires splitting the database — a high-risk, high-effort migration.

**Consequences:**
- Locked into monolith — cannot extract modules
- Schema changes require cross-module coordination
- Data ownership is ambiguous

**Alternative:** Give each module its own database tables. Cross-module data access happens through interfaces.

**Refactoring Strategy:**
1. Identify shared tables and their primary owning module
2. Create a repository interface for cross-module data access
3. Migrate other modules to use the interface instead of direct table access

**Detection Checklist:**
- [ ] Do modules share database tables?
- [ ] Are there cross-module foreign keys?
- [ ] Can a module change its schema without affecting others?

**Related Rules/Skills/Trees:**
- Rule: Each Module Owns Its Tables (`04-standardized-knowledge.md:14-15`)

---

## 2. Cross-Module Model References

**Category:** Architecture

**Description:** Modules importing and using each other's Eloquent models directly, creating tight ORM-level coupling.

**Why It Happens:** Models are the most accessible way to access data in Laravel. Importing a model from another module is a single use statement away.

**Warning Signs:**
- Module A calls `ModuleBModel::query()` directly
- Module A assumes Module B's database schema
- Module B changes its model and Module A breaks

**Why Harmful:** Direct model references expose Module B's internal persistence implementation to Module A. Module B cannot refactor its persistence without breaking Module A.

**Consequences:**
- Module B's internal changes break Module A
- Module A tests require Module B's database setup
- Module extraction requires rewriting Module A's data access

**Alternative:** Define repository or query interfaces in each module. Other modules consume these interfaces.

**Refactoring Strategy:**
1. Identify cross-module model imports
2. Define interfaces for cross-module data access
3. Implement interfaces in the owning module
4. Register implementations in the container

**Detection Checklist:**
- [ ] Does Module A import models from Module B?
- [ ] Are there cross-module Eloquent method calls?
- [ ] Would schema changes break other modules?

**Related Rules/Skills/Trees:**
- Rule: Modules Access Data Through Interfaces, Not Models (`04-standardized-knowledge.md:14-15`)

---

## 3. No Module Boundaries at All

**Category:** Architecture

**Description:** Building the monolith without any module structure — all code organized by technical layer (Controllers, Models, Services) with no domain grouping.

**Why It Happens:** Laravel's default directory structure organizes by technical layer. Teams never reorganize into modules.

**Warning Signs:**
- All code in `app/Http/Controllers`, `app/Models`, `app/Services`
- No domain-based directory structure
- Cannot identify which code belongs to which feature

**Why Harmful:** Without module boundaries, the codebase degrades into a big ball of mud. There's no isolation between features, no clear ownership, and no path toward service extraction.

**Consequences:**
- Feature changes affect seemingly unrelated code
- No clear code ownership
- Impossible to extract modules into services
- Onboarding new developers is slow

**Alternative:** Organize code by domain module, not technical layer. Each module has its own controllers, models, and services.

**Refactoring Strategy:**
1. Identify distinct business domains or bounded contexts
2. Create module directories with their own structure
3. Move related code into each module
4. Route by module — each module handles its own routes

**Detection Checklist:**
- [ ] Is code organized by technical layer only?
- [ ] Can you identify which code belongs to which feature?
- [ ] Is there a clear path toward modularity?

**Related Rules/Skills/Trees:**
- Rule: Organize Code by Domain Module (`04-standardized-knowledge.md:14-15`)

---

## 4. Module Database Communication

**Category:** Design

**Description:** Modules communicating by writing to and reading from shared database tables instead of through code-level interfaces.

**Why It Happens:** Database communication seems simpler than defining interfaces. Module A writes a record, Module B reads it.

**Warning Signs:**
- Cross-module data synchronization via database
- Module A writes to a table that Module B reads for processing
- No code-level API between modules

**Why Harmful:** Database communication is implicit and untraceable. There's no contract, no versioning, and no visibility into which modules depend on which data.

**Consequences:**
- Hidden coupling through shared schema
- No visibility into cross-module data dependencies
- Impossible to change schema without breaking other modules

**Alternative:** Define explicit interfaces using repository patterns or service contracts. Modules communicate through code, not through shared tables.

**Refactoring Strategy:**
1. Identify database-mediated module communication
2. Define an explicit interface for the communication
3. Replace database reads/writes with interface calls
4. Remove cross-module schema dependencies

**Detection Checklist:**
- [ ] Do modules communicate through shared tables?
- [ ] Are there cross-module data flows without code-level contracts?
- [ ] Can you trace which modules depend on which data?

**Related Rules/Skills/Trees:**
- Rule: Communicate Through Code, Not Shared Tables (`04-standardized-knowledge.md:14-15`)
