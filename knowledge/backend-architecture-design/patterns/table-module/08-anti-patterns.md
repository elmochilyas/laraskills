# Table Module — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Table Module pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Table Module Growing Into God Class | Critical |
| 2 | Mixing Table Module Concerns | High |
| 3 | Table Module Calling Other Table Modules | High |
| 4 | Table Module Becoming Transaction Script in Disguise | Medium |

---

## 1. Table Module Growing Into God Class

### Category
Architecture

### Description
The table module accumulates every possible operation for its table (CRUD, reporting, import, export, archival), becoming a god class.

### Why It Happens
Table module is the natural place for table operations. Every team adds their feature to the same class.

### Warning Signs
- 30+ methods in one table module
- Methods covering unrelated operation types
- Module doing CRUD, reporting, import, export
- Module file exceeding 500 lines

### Why Harmful
SRP violation. The class is too large to understand, test, or modify safely. Any change risks breaking unrelated operations.

### Consequences
- God class anti-pattern
- SRP violation
- High change impact
- Testing complexity
- Developer avoidance

### Alternative
Split into focused classes: `UserCrud`, `UserReporting`, `UserImport`. Each handles one concern for the same table.

### Refactoring Strategy
1. Group operations by concern
2. Extract to separate classes
3. Share common dependencies
4. Limit each table module to related operations

### Detection Checklist
- [ ] Count methods per table module
- [ ] Group methods by operation type
- [ ] Assess SRP compliance

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Table Module, SRP

---

## 2. Mixing Table Module Concerns

### Category
Architecture

### Description
A single table module handling validation, persistence logic, formatting, and business rules together in one class, violating SRP.

### Why It Happens
All operations for a table go to one class. Different concerns are mixed because they all relate to the same table.

### Warning Signs
- Validation logic in same methods as persistence
- Formatting/transformation mixed with business rules
- Output preparation alongside input validation
- Multiple responsibility types in one module

### Why Harmful
Each concern has different change drivers. Validation changes impact formatting code. Business rule changes risk breaking persistence logic.

### Consequences
- SRP violation
- Change collision (one change affects multiple concerns)
- Difficult testing
- Low maintainability

### Alternative
Separate concerns: validation class, business logic class, persistence class. Table module becomes an orchestrator.

### Refactoring Strategy
1. Identify concern types in module
2. Extract validation to separate class
3. Extract formatting to separate class
4. Keep only business logic in table module
5. Test each concern independently

### Detection Checklist
- [ ] Identify concern types within module
- [ ] Evaluate SRP compliance
- [ ] Check change impact per concern

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Table Module, SRP

---

## 3. Table Module Calling Other Table Modules

### Category
Architecture

### Description
Table modules directly calling methods on other table modules, creating tight coupling between table-focused classes.

### Why It Happens
Cross-table operations naturally need data from multiple tables. Developers call other table modules directly.

### Warning Signs
- `UserModule` calling `OrderModule::method()`
- Circular dependencies between table modules
- Table module importing other table modules
- Cross-table logic spread across modules

### Why Harmful
Tight coupling between table modules creates a tangled graph. Changes to one module propagate to all dependents.

### Consequences
- High coupling
- Circular dependency risk
- Fragile dependencies
- Hard to test in isolation

### Alternative
Use a higher-level service that coordinates multiple table modules. Table modules should not know about each other.

### Refactoring Strategy
1. Identify cross-table calls
2. Create coordinating service
3. Move cross-table logic to service
4. Remove direct module-to-module calls
5. Table modules become focused on single table

### Detection Checklist
- [ ] Scan for module-to-module calls
- [ ] Map module dependency graph
- [ ] Identify cross-table coordination needs

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Table Module, Service Layer

---

## 4. Table Module Becoming Transaction Script in Disguise

### Category
Architecture

### Description
Table module organizes by table but each method is a procedural transaction script with no real cohesion or shared state, losing the pattern's value.

### Why It Happens
Table module is used as a namespace for table-related procedures without leveraging shared structure or encapsulated behavior.

### Warning Signs
- Methods share no state or behavior
- Each method is self-contained with all dependencies resolved locally
- No shared helpers or utilities within module
- Could be standalone functions instead of class methods

### Why Harmful
The table module pattern provides no benefit over standalone functions or a Transaction Script. The class adds overhead without value.

### Consequences
- No organizational benefit
- Wasted class structure
- Could be replaced with standalone functions
- Misleading architecture

### Alternative
If methods share no state, use Transaction Script or standalone action classes. Only use Table Module when shared table-specific behavior exists.

### Refactoring Strategy
1. Evaluate shared behavior within module
2. If none, replace with action classes or transaction scripts
3. Extract shared behavior if present
4. Remove unnecessary table module class

### Detection Checklist
- [ ] Evaluate module cohesion
- [ ] Check for shared state or behavior
- [ ] Assess if standalone functions would work better

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Table Module, Transaction Script
- Decision Trees: Table Module vs Transaction Script
