# Layer Supertype — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Layer Supertype pattern |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Deep Inheritance Chains | Critical |
| 2 | Base Class Accumulating Unrelated Methods | Critical |
| 3 | Extending Framework Supertype When Not Needed | Medium |
| 4 | Custom Domain Supertype with Framework Dependencies | High |

---

## 1. Deep Inheritance Chains

### Category
Architecture

### Description
Creating deep inheritance hierarchies (LayerSupertype → AbstractBase → AbstractSpecific → Concrete) that are hard to navigate, understand, and modify.

### Why It Happens
Adding abstraction layers over time. Each developer adds another level of indirection.

### Warning Signs
- Inheritance tree of 3+ levels
- Methods overridden two or more levels down
- Hard to trace method resolution
- "Where is this method defined?" confusion
- Multiple abstract classes between supertype and concrete

### Why Harmful
Deep hierarchies create tight coupling between all levels. Changing any level risks breaking subtypes. New developers cannot understand the chain.

### Consequences
- High cognitive load
- Fragile base class problem
- Difficult debugging
- Low developer productivity
- Resistance to change

### Alternative
Prefer shallow hierarchies (1-2 levels). Use traits for cross-cutting behavior. Favor composition over inheritance.

### Refactoring Strategy
1. Map inheritance hierarchy
2. Consolidate intermediate abstract classes
3. Extract traits for shared behavior
4. Limit to 1-2 levels max
5. Add documentation for each level

### Detection Checklist
- [ ] Map inheritance depth
- [ ] Check for unnecessary intermediate classes
- [ ] Extract trait candidates

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Layer Supertype, Inheritance vs Composition

---

## 2. Base Class Accumulating Unrelated Methods

### Category
Architecture

### Description
The layer supertype grows over time with unrelated methods (logging, caching, serialization, authorization), becoming a god object.

### Why It Happens
Layer supertype is a convenient place to add shared behavior. Every team adds their "utility" method without considering SRP.

### Warning Signs
- Base class with 20+ methods covering unrelated concerns
- All subclasses inherit methods they don't use
- New methods added to base class "for convenience"
- Base class imports from diverse namespaces

### Why Harmful
God object base class violates SRP. All subclasses carry unrelated behavior. Changes to base class risk breaking any subtype.

### Consequences
- SRP violation
- Unused methods inherited by all subtypes
- High change impact (any base change affects all subtypes)
- Testing complexity
- Fragile code

### Alternative
Use traits for specific concern groups. Use composition (wrapper/decorator) for cross-cutting behaviors. Keep base class focused on the layer's core concern.

### Refactoring Strategy
1. Audit base class methods by concern
2. Extract unrelated methods into traits or separate classes
3. Use composition in subclasses for cross-cutting concerns
4. Limit base class to essential commonality only

### Detection Checklist
- [ ] Review base class method count
- [ ] Group methods by concern
- [ ] Check for unused inherited methods
- [ ] Evaluate SRP compliance

### Related Rules/Skills/Trees
- Rules: Prefer Composition Over Inheritance
- Skills: Layer Supertype, Trait Design

---

## 3. Extending Framework Supertype When Not Needed

### Category
Architecture

### Description
Extending framework layer supertypes (e.g., `Model`, `Controller`, `ServiceProvider`) for classes that don't need the full supertype functionality.

### Why It Happens
Framework convention encourages extending base classes. Developers extend without evaluating whether it's necessary.

### Warning Signs
- Classes extending `Model` but only using basic features
- Plain DTOs or value objects extending `Model`
- Custom classes extending framework supertypes unnecessarily
- Unused inherited methods in subclasses

### Why Harmful
Extending a framework supertype couples the class to the framework. The class inherits framework behavior (guarded, events, serialization) that may be unwanted.

### Consequences
- Framework coupling for simple classes
- Carrying unused behavior
- Testing overhead (framework bootstrap needed)
- Unexpected behavior from inherited methods

### Alternative
Use plain PHP classes or specific interfaces/traits. Only extend framework supertypes when the full pattern functionality is required.

### Refactoring Strategy
1. Identify classes extending supertype unnecessarily
2. Convert to plain PHP classes
3. Import only needed traits or interfaces
4. Update consuming code

### Detection Checklist
- [ ] Audit supertype extension necessity
- [ ] Check for unused inherited functionality
- [ ] Verify plain PHP class viability

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Layer Supertype, Framework Fundamentals

---

## 4. Custom Domain Supertype with Framework Dependencies

### Category
Architecture

### Description
Creating a custom domain layer supertype that depends on framework classes, effectively coupling the domain to the framework.

### Why It Happens
Adding framework convenience (helpers, facades, base classes) to a "domain" base class for convenience.

### Warning Signs
- Custom domain base class extending framework class
- Framework imports in domain supertype
- Helpers like `app()`, `config()`, `event()` in domain supertype
- Domain tests requiring framework bootstrap

### Why Harmful
Framework coupling in the domain supertype propagates the coupling to all domain subtypes. The domain layer is no longer portable.

### Consequences
- Domain coupled to framework
- Cannot reuse domain outside framework
- Framework upgrades force domain changes
- Testing requires framework bootstrap

### Alternative
Domain supertype should be a plain PHP class with only domain-specific abstractions. Framework dependencies are injected, not inherited.

### Refactoring Strategy
1. Remove framework dependencies from domain supertype
2. Define interfaces for framework services used
3. Inject implementations through constructor
4. Move framework coupling to infrastructure layer

### Detection Checklist
- [ ] Check domain supertype for framework imports
- [ ] Verify domain layer independence
- [ ] Test domain without framework

### Related Rules/Skills/Trees
- Rules: Keep Domain Layer Framework-Agnostic
- Skills: Layer Supertype, Hexagonal Architecture
- Decision Trees: Domain Independence
