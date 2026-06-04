# Bridge — Anti-Patterns

## Metadata

| Field | Value |
|-------|-------|
| Domain | Backend Architecture & Design |
| Subdomain | Design Patterns & Principles |
| Knowledge Unit | Bridge pattern in PHP/Laravel context |
| Anti-Pattern Count | 4 |

## Repository-Wide Anti-Patterns

| # | Name | Severity |
|---|------|----------|
| 1 | Bridge Used Where Adapter Suffices | High |
| 2 | Abstraction Interface Leaking Implementor Concepts | Critical |
| 3 | Implementor Interface Too Specific | High |
| 4 | Over-Bridging: Every Class Gets an Abstraction Layer | Medium |

---

## 1. Bridge Used Where Adapter Suffices

### Category
Architecture

### Description
Implementing Bridge pattern (abstraction + implementor) for a single-abstraction, single-implementation scenario where Adapter would be simpler.

### Why It Happens
Developers use Bridge proactively "for future flexibility" that never materializes.

### Warning Signs
- Only one abstraction and one implementation
- No foreseeable second implementation
- Bridge structure with no actual variation
- Developer cannot explain why Bridge over Adapter

### Why Harmful
Bridge adds more complexity than Adapter (interface + implementor interface + concrete + client). Without variation, this is unnecessary.

### Consequences
- Premature abstraction
- Unnecessary complexity
- More files to maintain
- YAGNI violation

### Alternative
Use Adapter for single implementation translation. Extract to Bridge only when a second implementation emerges.

### Refactoring Strategy
1. Merge abstraction and implementor
2. Replace with Adapter pattern
3. Reduce class count
4. Add Bridge back only when needed

### Detection Checklist
- [ ] Count abstractions vs implementations
- [ ] Evaluate Bridge necessity
- [ ] Assess YAGNI compliance

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Bridge, Adapter
- Decision Trees: Bridge vs Adapter

---

## 2. Abstraction Interface Leaking Implementor Concepts

### Category
Architecture

### Description
The abstraction interface exposes methods or types that are specific to one implementor, defeating the purpose of the Bridge decoupling.

### Why It Happens
The interface is designed with the first implementor in mind, not as an abstraction.

### Warning Signs
- Abstraction methods named after implementor specifics
- Implementor-specific parameters in abstraction
- Adding second implementor requires abstraction changes
- Callers aware of implementor details

### Why Harmful
The abstraction is not actually abstract. It's coupled to one implementation, and adding another requires changes.

### Consequences
- Incomplete decoupling
- Interface instability
- Cannot add implementations independently
- OCP violation

### Alternative
Design the abstraction around the domain concept, not the implementation. Abstract method names and parameters from specific implementations.

### Refactoring Strategy
1. Identify implementor-leaking methods
2. Rename to domain-level concepts
3. Generalize parameters
4. Update all implementations
5. Test with multiple implementors

### Detection Checklist
- [ ] Review abstraction for implementor leaks
- [ ] Check second implementor feasibility
- [ ] Assess abstraction independence

### Related Rules/Skills/Trees
- Skills: Bridge, Interface Segregation
- Decision Trees: Bridge Interface Design

---

## 3. Implementor Interface Too Specific

### Category
Architecture

### Description
The implementor interface is too tightly scoped to one class of implementations, making it impossible for different implementation strategies to conform.

### Why It Happens
The implementor interface is designed from the first implementation's perspective.

### Warning Signs
- Adding alternative implementation requires interface changes
- Implementor interface has implementation-specific detail
- New implementations violate interface contract
- Interface methods not universally applicable

### Why Harmful
Bridge's benefit (independent variation) is blocked. Implementations cannot vary without interface changes.

### Consequences
- Cannot add diverse implementations
- Interface limits implementation options
- OCP violation
- Pattern benefit lost

### Alternative
Design implementor interface at a higher abstraction level. Each implementation maps its specific approach to the general interface.

### Refactoring Strategy
1. Generalize implementor interface
2. Remove implementation-specific details
3. Update existing implementations
4. Verify new implementation compatibility

### Detection Checklist
- [ ] Review implementor generality
- [ ] Check for implementation-specific methods
- [ ] Test with diverse implementations

### Related Rules/Skills/Trees
- Skills: Bridge, Interface Segregation
- Decision Trees: Bridge Interface Design

---

## 4. Over-Bridging: Every Class Gets an Abstraction Layer

### Category
Architecture

### Description
Applying Bridge pattern to every class "for flexibility," creating unnecessary abstraction layers throughout the codebase.

### Why It Happens
Developers over-apply the pattern without evaluating actual variation needs.

### Warning Signs
- Most classes have separate abstraction and implementor
- Abstractions without multiple implementations
- No concrete plans for additional implementations
- High ratio of abstraction files to implementation files

### Why Harmful
Each Bridge adds interface + implementor interface + concrete class. For classes with single implementation, this is pure overhead.

### Consequences
- High file count
- Navigation difficulty
- Maintenance overhead
- YAGNI violation

### Alternative
Only apply Bridge where both abstraction and implementation are expected to vary independently. For single implementations, use direct composition.

### Refactoring Strategy
1. Identify Bridge patterns with single implementation
2. Merge abstraction and implementor
3. Remove unnecessary interfaces
4. Document Bridge usage criteria

### Detection Checklist
- [ ] Count Bridges with single implementation
- [ ] Evaluate variation needs
- [ ] Assess abstraction value

### Related Rules/Skills/Trees
- Rules: Start Simple, Refactor Later
- Skills: Bridge, YAGNI
- Decision Trees: Bridge vs Adapter
