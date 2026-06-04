# Anti-Patterns: Modular Monolith

## Metadata

| | |
|---|---|
| **Domain** | Backend Architecture & Design |
| **Subdomain** | Architectural Styles |
| **Topic** | Modular monolith as starting architecture |
| **Difficulty** | Intermediate |
| **Maturity** | Standardized |
| **Domain Path** | backend-architecture-design |
| **Subdomain Path** | service-decomposition |

## Anti-Pattern Inventory

| # | Anti-Pattern | Category | Severity |
|---|---|---|---|
| 1 | Shared Database Tables Across Modules | Architecture | High |
| 2 | Cross-Module Eloquent References | Architecture | High |
| 3 | Bloated Shared Kernel | Architecture | Medium |
| 4 | Premature Module Separation | Design | Medium |

## Repository-Wide Anti-Patterns

- **Data-Level Coupling**: Modules sharing database tables, coupling at the persistence level
- **Model Leakage**: Modules importing each other's Eloquent models directly instead of using interfaces
- **Shared Kernel Sprawl**: The shared kernel growing to contain business logic, not just infrastructure utilities

---

## 1. Shared Database Tables Across Modules

**Category:** Architecture

**Description:** Multiple modules reading and writing to the same database tables, creating implicit coupling at the data level.

**Why It Happens:** Laravel's default project structure doesn't encourage database-per-module. Sharing tables is the path of least resistance.

**Warning Signs:**
- A migration file adds columns to a table owned by another module
- Queries join across module boundaries
- Schema changes require coordinated releases across modules

**Why Harmful:** Shared tables prevent modules from being extracted into services — data migration becomes a massive effort. Schema changes require coordination across module owners.

**Consequences:**
- Cannot extract modules into independent services
- Schema changes break other modules
- Module autonomy is an illusion

**Alternative:** Each module owns its own tables. Cross-module data access happens through APIs, not direct database queries.

**Refactoring Strategy:**
1. Identify shared tables and which module should own them
2. Create APIs for other modules to access that data
3. Migrate data gradually, starting with read operations

**Detection Checklist:**
- [ ] Do migrations from different module touch the same table?
- [ ] Are cross-module joins used?
- [ ] Can schema changes be made without coordinating with other modules?

**Related Rules/Skills/Trees:**
- Rule: Each Module Owns Its Database Tables (`04-standardized-knowledge.md:14-15`)

---

## 2. Cross-Module Eloquent References

**Category:** Architecture

**Description:** Modules referencing each other's Eloquent models directly using `Model::find()` or `$model->relation` instead of going through interfaces.

**Why It Happens:** Direct model access is the natural Laravel way. Importing `App\Modules\Orders\Models\Order` is one import away.

**Warning Signs:**
- Module A imports Eloquent models from Module B
- Module A calls `ModuleBModel::where(...)` directly
- Changing a model's schema breaks multiple modules

**Why Harmful:** Direct model references create tight coupling at the ORM level. Module A depends on Module B's internal persistence structure. Module B cannot refactor its persistence without breaking Module A.

**Consequences:**
- Module B's schema changes break Module A
- Module A tests require Module B's database setup
- Module extraction requires rewriting Module A's data access

**Alternative:** Define interfaces in each module for data access. Modules communicate through these interfaces, never through models.

**Refactoring Strategy:**
1. Identify cross-module model imports
2. Define a repository interface in the consuming module's domain
3. Implement the interface in the owning module
4. Register the implementation in the container

**Detection Checklist:**
- [ ] Does module A import Eloquent models from module B?
- [ ] Are cross-module Eloquent queries used?
- [ ] Would schema changes break other modules?

**Related Rules/Skills/Trees:**
- Rule: Modules Communicate Through Interfaces, Not Models (`04-standardized-knowledge.md:14-15`)

---

## 3. Bloated Shared Kernel

**Category:** Architecture

**Description:** The shared kernel (code shared across modules) growing to include business logic, not just infrastructure utilities.

**Why It Happens:** It's convenient to put shared code in a common directory. What starts as utility classes accumulates business logic over time.

**Warning Signs:**
- Shared kernel directory contains business services, not just utilities
- Business rules implemented in "common" or "shared" namespaces
- Modules depend on shared kernel for business functionality

**Why Harmful:** A bloated shared kernel creates hidden coupling. Changes to "shared" business logic affect all modules, requiring coordinated releases.

**Consequences:**
- Changes to shared business logic require testing all modules
- Modules cannot evolve independently
- Shared kernel becomes a "mini monolith" inside the modular monolith

**Alternative:** Keep the shared kernel small — only truly generic infrastructure (logging, HTTP client wrappers, base classes). Business logic belongs in specific modules.

**Refactoring Strategy:**
1. Audit shared kernel for business logic
2. Move business logic into the appropriate module
3. Keep only infrastructure utilities in the shared kernel

**Detection Checklist:**
- [ ] Does the shared kernel contain business logic?
- [ ] Do multiple modules depend on shared business code?
- [ ] Can the shared kernel be described as "infrastructure only"?

**Related Rules/Skills/Trees:**
- Rule: Keep Shared Kernel for Infrastructure Only (`04-standardized-knowledge.md:14-15`)

---

## 4. Premature Module Separation

**Category:** Design

**Description:** Creating module boundaries too early, before the domain is understood, resulting in wrong boundaries that require costly refactoring.

**Why It Happens:** Teams want to "do architecture right" from day one. Theoretical boundaries are drawn before real business requirements clarify.

**Warning Signs:**
- Module boundaries change frequently as understanding grows
- Features span multiple modules, requiring cross-module changes
- Modules have few files and little unique logic

**Why Harmful:** Wrong module boundaries are worse than no boundaries. They force developers to make cross-module changes for single features, increasing coordination overhead.

**Consequences:**
- Frequent boundary refactoring, wasting effort
- Features scattered across modules
- Team frustration with "architecture overhead"

**Alternative:** Start with a simple structure. Extract modules only when clear boundaries emerge from business understanding.

**Refactoring Strategy:**
1. Consider merging frequently co-changing modules
2. Wait for stable boundaries to emerge
3. Refactor toward modules incrementally

**Detection Checklist:**
- [ ] Are module boundaries stable over time?
- [ ] Do features fit within single module boundaries?
- [ ] Are modules justified by business logic volume?

**Related Rules/Skills/Trees:**
- Rule: Extract Modules as Boundaries Emerge (`04-standardized-knowledge.md:42-43`)
