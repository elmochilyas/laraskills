# Data Mapper — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Data Mapper pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Data Mapper for Every Table | High |
| 2 | Mapping Leaks into Domain Objects | Critical |
| 3 | Not Using Identity Map | Medium |
| 4 | Mixing Data Mapper and Active Record | High |

---

## 1. Data Mapper for Every Table

### Category
Architecture

### Description
Applying Data Mapper to every database table regardless of complexity, creating unnecessary abstraction for simple CRUD operations that Eloquent handles efficiently.

### Why It Happens
Architecture-first mindset. Teams adopt Data Mapper without evaluating whether the domain complexity justifies the additional mapping layer.

### Warning Signs
- Data Mapper for lookup tables (categories, statuses, types)
- Mapping code for every table with identical CRUD patterns
- Developers avoiding the mapper layer for simple operations
- Simple queries bypassing mapper via raw SQL

### Why Harmful
Data Mapper adds significant infrastructure: mapper classes, hydrators, unit of work, identity map. For simple CRUD, this overhead provides no benefit.

### Consequences
- Reduced development velocity
- Unnecessary code to maintain
- Developer frustration with simple operations
- Resistance to the architectural approach

### Alternative
Use Eloquent ActiveRecord for simple CRUD tables. Introduce Data Mapper selectively for complex domains with deep inheritance or persistence-ignorance requirements.

### Refactoring Strategy
1. Identify tables with simple CRUD-only access patterns
2. Keep Data Mapper for complex domain models
3. For simple tables, use Eloquent directly
4. Document which tables use which pattern

### Detection Checklist
- [ ] Audit which tables use Data Mapper vs ActiveRecord
- [ ] Evaluate domain complexity per table
- [ ] Measure mapping overhead vs elapsed time

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Data Mapper implementation

---

## 2. Mapping Leaks into Domain Objects

### Category
Architecture

### Description
Domain objects contain database-aware properties (column names, hydration logic, type casting) that couple them to the mapping infrastructure.

### Why It Happens
Convenience: adding `$fillable`, `$casts`, or database field names to domain objects saves a separate mapping step.

### Warning Signs
- Domain objects with database column names as properties
- Domain objects extending framework base classes
- Mapper logic embedded in domain constructors
- Domain objects aware of database types

### Why Harmful
The core benefit of Data Mapper is persistence ignorance. Mapping leaks couple domain to database, preventing independent evolution.

### Consequences
- Database changes force domain changes
- Domain objects not portable across storage systems
- Testing requires database setup
- Lost persistence-ignorance benefit

### Alternative
Define domain objects with only domain-relevant properties and types. Mappers handle the translation between domain and persistence representations.

### Refactoring Strategy
1. Create pure domain objects without persistence concerns
2. Move all database-aware code to mapper classes
3. Add mapper methods for hydration and extraction
4. Test domain objects without database

### Detection Checklist
- [ ] Check domain objects for database field names
- [ ] Verify domain objects don't extend framework classes
- [ ] Test domain without database

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Data Mapper implementation
- Decision Trees: Data Mapper vs Active Record

---

## 3. Not Using Identity Map

### Category
Data Integrity

### Description
Using Data Mapper without an identity map, allowing multiple in-memory object instances to represent the same database row.

### Why It Happens
Identity map adds complexity. Developers skip it, not realizing duplicate objects lead to inconsistent in-memory state.

### Warning Signs
- Multiple object instances for same DB row
- In-memory state conflicts (same row, different objects)
- Stale data served from older instance
- == comparisons failing for same logical entity

### Why Harmful
Without identity map, two modifications to the same row through different objects cause data loss — the second save overwrites the first without merging.

### Consequences
- Lost updates (last-write-wins)
- Inconsistent in-memory state
- Hard-to-debug data conflicts
- Transaction boundary violations

### Alternative
Implement an identity map in the mapper layer. Track loaded objects by primary key. Return existing instance on subsequent loads of the same row.

### Refactoring Strategy
1. Add identity map to Data Mapper
2. Track objects by identifier on load
3. Return cached instance on same-ID requests
4. Clear on transaction or request end

### Detection Checklist
- [ ] Check for identity map in mapper layer
- [ ] Test duplicate object behavior
- [ ] Verify same-ID consistency

### Related Rules/Skills/Trees
- Skills: Identity Map, Unit of Work
- Decision Trees: Data Mapper vs Active Record

---

## 4. Mixing Data Mapper and Active Record

### Category
Architecture

### Description
Using both Data Mapper (Doctrine or custom) and Active Record (Eloquent) for the same entities in the same project, creating inconsistent and confusing data access.

### Why It Happens
Gradual adoption: some tables use Eloquent, others use Data Mapper. Or different teams choose different patterns.

### Warning Signs
- Both Eloquent models and mapper classes for overlapping entities
- Inconsistent hydration patterns across the codebase
- Confusion about which pattern to use for new features
- Developers fighting the mapper while using Eloquent everywhere else

### Why Harmful
Two competing patterns create cognitive overhead, inconsistent testing strategies, and unpredictable performance characteristics.

### Consequences
- Confusing codebase with inconsistent patterns
- Higher cognitive load for developers
- Inconsistent testing strategies
- Difficult onboarding

### Alternative
Choose one pattern per project or module. If using both, enforce strict module boundaries: some modules use Eloquent, others use Data Mapper. Never mix for the same entity.

### Refactoring Strategy
1. Document the boundary between pattern usage
2. Migrate one pattern to the other over time
3. Or create strict module-level isolation
4. Add automated checks to prevent mixing

### Detection Checklist
- [ ] Audit pattern usage across codebase
- [ ] Identify overlapping usage
- [ ] Define module boundaries

### Related Rules/Skills/Trees
- Rules: Enforce Boundaries via Automation
- Skills: Data Mapper implementation
- Decision Trees: Data Mapper vs Active Record
