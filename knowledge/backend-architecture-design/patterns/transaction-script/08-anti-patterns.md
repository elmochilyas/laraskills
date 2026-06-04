# Transaction Script — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Transaction Script (Fowler) in PHP/Laravel context |
| Anti-Pattern Count | 5 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Transaction Script Growing Beyond 100 Lines | Critical |
| 2 | Duplicating Validation Across Scripts | High |
| 3 | Mixing UI Concerns in Transaction Script | High |
| 4 | Transaction Script Assuming Specific UI | Medium |
| 5 | No Separation of Concerns | High |

---

## 1. Transaction Script Growing Beyond 100 Lines

### Category
Architecture

### Description
A single transaction script method exceeding 100 lines, handling input, validation, business rules, persistence, email, and response in one procedural block.

### Why It Happens
Transaction scripts are easy to extend. Each feature adds lines to the same script without refactoring.

### Warning Signs
- Single method > 100 lines
- Multiple concerns in one method
- Script handling input, logic, persistence, and output
- No helper methods extracted

### Why Harmful
Long scripts violate SRP, are hard to read, cannot be tested at unit level, and hide bugs in procedural noise.

### Consequences
- Low readability
- Difficult testing
- SRP violation
- High bug probability
- Fear of modification

### Alternative
Extract validation, business rules, and output as separate private methods or classes. Keep the script focused on orchestration.

### Refactoring Strategy
1. Extract validation to separate method
2. Extract business rules to domain objects
3. Extract persistence calls to repository
4. Keep script as thin orchestrator
5. Add unit tests for extracted components

### Detection Checklist
- [ ] Measure script method length
- [ ] Evaluate single responsibility
- [ ] Check test coverage of extracted logic

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Transaction Script, Refactoring
- Decision Trees: Transaction Script vs Domain Model

---

## 2. Duplicating Validation Across Scripts

### Category
Architecture

### Description
The same validation rules (e.g., email format, required fields) duplicated across multiple transaction scripts, causing inconsistent enforcement.

### Why It Happens
Transaction scripts are self-contained. There's no shared validation layer.

### Warning Signs
- Same validation logic in multiple controllers/services
- Inconsistent error messages for same rule
- Some scripts forget validation
- Validation changes require updating N scripts

### Why Harmful
Duplicated validation inevitably becomes inconsistent. Some scripts have validation, others don't. Changing a rule requires finding all copies.

### Consequences
- Inconsistent validation
- Business rules scattered
- Validation gaps
- High maintenance cost

### Alternative
Extract validation into reusable classes (Form Requests, custom validation rules). Apply consistently across all entry points.

### Refactoring Strategy
1. Identify duplicated validation patterns
2. Create reusable validation rules
3. Apply to all transaction scripts
4. Remove inline validation from scripts
5. Test validation once at rule level

### Detection Checklist
- [ ] Scan for duplicated validation
- [ ] Check consistency across scripts
- [ ] Verify validation rule reuse

### Related Rules/Skills/Trees
- Skills: Transaction Script, Form Request, Custom Validation Rules

---

## 3. Mixing UI Concerns in Transaction Script

### Category
Architecture

### Description
Transaction script directly handles UI concerns (setting flash messages, redirecting, building view responses), preventing reuse in API or CLI contexts.

### Why It Happens
Controllers naturally mix HTTP response with business logic. Transaction scripts in controllers are the common pattern.

### Warning Signs
- Transaction script in controller doing business logic
- Redirect or view response in the script
- Flash messages set in business logic
- `return redirect()` or `return view()` in script

### Why Harmful
UI-coupled scripts cannot be called from APIs, queues, or CLI commands. Business logic is trapped in the HTTP layer.

### Consequences
- No non-HTTP reuse
- Business logic coupled to UI
- Testing requires HTTP simulation
- UI changes force business logic changes

### Alternative
Extract business logic to a separate service class. Controllers handle UI concerns; services handle business logic.

### Refactoring Strategy
1. Extract business logic from controller
2. Create service class with business methods
3. Controller calls service and handles UI
4. Call service from any entry point

### Detection Checklist
- [ ] Check controller for business logic
- [ ] Verify services are UI-independent
- [ ] Test services without HTTP

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Transaction Script, Service Layer

---

## 4. Transaction Script Assuming Specific UI

### Category
Architecture

### Description
Transaction script built with implicit assumptions about the user interface (web form, specific redirect flow), preventing other interfaces from using it.

### Why It Happens
Scripts are written for the current UI without considering future interfaces.

### Warning Signs
- Script assumes form POST parameters
- Redirect logic embedded in business code
- Flash messages for specific UI framework
- Script only usable from web controller

### Why Harmful
Adding an API or CLI requires rewriting or duplicating scripts. Business rules are duplicated across interfaces.

### Consequences
- UI-specific scripts
- Duplicated logic for different interfaces
- Hard to add new interfaces
- Business rule inconsistency

### Alternative
Extract business logic to UI-agnostic services. Pass only data (DTOs, primitives), not request objects.

### Refactoring Strategy
1. Identify UI assumptions
2. Extract business logic to service
3. Service takes typed parameters
4. All interfaces call same service

### Detection Checklist
- [ ] Review scripts for UI assumptions
- [ ] Check parameter types (data vs request)
- [ ] Test script from non-web entry point

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Transaction Script, Service Layer

---

## 5. No Separation of Concerns

### Category
Architecture

### Description
Transaction script does everything in one method: input extraction, validation, business rules, database access, email sending, logging, and response building — all mixed together.

### Why It Happens
The script grew over time. No refactoring was done. The script remains a single procedural block.

### Warning Signs
- Single method doing 5+ different concern types
- No helper methods or extracted classes
- Mixing DB access, email, logging, validation
- Script hard to read or modify

### Why Harmful
Every concern is coupled. Changing validation might break email. Testing requires full environment setup. The script cannot be reused for partial operations.

### Consequences
- High coupling
- Low cohesion
- Impossible to test discrete parts
- Change has wide impact
- Difficult maintenance

### Alternative
Separate concerns into focused classes: validation class, business logic, persistence repository, notification service. Script orchestrates them.

### Refactoring Strategy
1. Identify concern types in script
2. Extract validation to reusable class
3. Extract persistence to repository
4. Extract notifications to separate service
5. Script orchestrates with clear steps
6. Test each concern independently

### Detection Checklist
- [ ] Identify concern count in script
- [ ] Evaluate separation of concerns
- [ ] Check test isolation per concern

### Related Rules/Skills/Trees
- Skills: Transaction Script, SRP, Refactoring
- Decision Trees: Transaction Script vs Domain Model
