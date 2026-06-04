# ECC Anti-Patterns -- The Dependency Rule: inward-pointing dependencies

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Layered Architecture Patterns |
| **Knowledge Unit** | The Dependency Rule: inward-pointing dependencies |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Facade usage in Domain layer:
2. Extending framework classes in Domain:
3. Using framework helpers in Application:
4. Transitive dependency violation:

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- God Classes
- Premature Abstraction
- Architecture Without Enforcement
- Inconsistent Pattern Application

---

---

## Anti-Pattern 1: Facade usage in Domain layer:

### Category
Architecture

### Description
Facade usage in Domain layer:. This pattern violates architectural best practices and creates coupling between concerns that should remain separate.

### Why It Happens
Convenience during development. Lack of architectural enforcement or awareness. Time pressure prioritizing speed over structure.

### Warning Signs
- Instances of this pattern visible in the codebase
- No automated checks preventing this pattern
- Code review consistently flags this issue

### Why It Is Harmful
Increases coupling, reduces testability, and makes the codebase harder to evolve. Violates separation of concerns.

### Real-World Consequences
Technical debt slows feature delivery. Debugging and testing become more complex. Architectural migration becomes expensive.

### Preferred Alternative
Follow the documented architectural conventions. Use automated enforcement via architecture tests or static analysis.

### Refactoring Strategy
1. Audit the codebase for all instances
2. Create a systematic migration plan
3. Replace with the preferred pattern
4. Add automated enforcement checks
5. Verify across all affected paths

### Detection Checklist
- [ ] Code review identifies this pattern
- [ ] Automated checks flag this pattern
- [ ] Team conventions explicitly prohibit it

### Related Rules
- LAP-04/05-rules.md

### Related Skills
- LAP-04/06-skills.md

### Related Decision Trees
- LAP-04/07-decision-trees.md


---

## Anti-Pattern 2: Extending framework classes in Domain:

### Category
Architecture

### Description
Extending framework classes in Domain:. This pattern violates architectural best practices and creates coupling between concerns that should remain separate.

### Why It Happens
Convenience during development. Lack of architectural enforcement or awareness. Time pressure prioritizing speed over structure.

### Warning Signs
- Instances of this pattern visible in the codebase
- No automated checks preventing this pattern
- Code review consistently flags this issue

### Why It Is Harmful
Increases coupling, reduces testability, and makes the codebase harder to evolve. Violates separation of concerns.

### Real-World Consequences
Technical debt slows feature delivery. Debugging and testing become more complex. Architectural migration becomes expensive.

### Preferred Alternative
Follow the documented architectural conventions. Use automated enforcement via architecture tests or static analysis.

### Refactoring Strategy
1. Audit the codebase for all instances
2. Create a systematic migration plan
3. Replace with the preferred pattern
4. Add automated enforcement checks
5. Verify across all affected paths

### Detection Checklist
- [ ] Code review identifies this pattern
- [ ] Automated checks flag this pattern
- [ ] Team conventions explicitly prohibit it

### Related Rules
- LAP-04/05-rules.md

### Related Skills
- LAP-04/06-skills.md

### Related Decision Trees
- LAP-04/07-decision-trees.md


---

## Anti-Pattern 3: Using framework helpers in Application:

### Category
Architecture

### Description
Using framework helpers in Application:. This pattern violates architectural best practices and creates coupling between concerns that should remain separate.

### Why It Happens
Convenience during development. Lack of architectural enforcement or awareness. Time pressure prioritizing speed over structure.

### Warning Signs
- Instances of this pattern visible in the codebase
- No automated checks preventing this pattern
- Code review consistently flags this issue

### Why It Is Harmful
Increases coupling, reduces testability, and makes the codebase harder to evolve. Violates separation of concerns.

### Real-World Consequences
Technical debt slows feature delivery. Debugging and testing become more complex. Architectural migration becomes expensive.

### Preferred Alternative
Follow the documented architectural conventions. Use automated enforcement via architecture tests or static analysis.

### Refactoring Strategy
1. Audit the codebase for all instances
2. Create a systematic migration plan
3. Replace with the preferred pattern
4. Add automated enforcement checks
5. Verify across all affected paths

### Detection Checklist
- [ ] Code review identifies this pattern
- [ ] Automated checks flag this pattern
- [ ] Team conventions explicitly prohibit it

### Related Rules
- LAP-04/05-rules.md

### Related Skills
- LAP-04/06-skills.md

### Related Decision Trees
- LAP-04/07-decision-trees.md


---

## Anti-Pattern 4: Transitive dependency violation:

### Category
Architecture

### Description
Transitive dependency violation:. This pattern violates architectural best practices and creates coupling between concerns that should remain separate.

### Why It Happens
Convenience during development. Lack of architectural enforcement or awareness. Time pressure prioritizing speed over structure.

### Warning Signs
- Instances of this pattern visible in the codebase
- No automated checks preventing this pattern
- Code review consistently flags this issue

### Why It Is Harmful
Increases coupling, reduces testability, and makes the codebase harder to evolve. Violates separation of concerns.

### Real-World Consequences
Technical debt slows feature delivery. Debugging and testing become more complex. Architectural migration becomes expensive.

### Preferred Alternative
Follow the documented architectural conventions. Use automated enforcement via architecture tests or static analysis.

### Refactoring Strategy
1. Audit the codebase for all instances
2. Create a systematic migration plan
3. Replace with the preferred pattern
4. Add automated enforcement checks
5. Verify across all affected paths

### Detection Checklist
- [ ] Code review identifies this pattern
- [ ] Automated checks flag this pattern
- [ ] Team conventions explicitly prohibit it

### Related Rules
- LAP-04/05-rules.md

### Related Skills
- LAP-04/06-skills.md

### Related Decision Trees
- LAP-04/07-decision-trees.md


---

## Related Knowledge Units

- LAP-04 knowledge unit documentation (02-knowledge-unit.md)
- LAP-04 decomposition (03-decomposition.md)

---

*Generated on 2026-06-03 as part of the ECC Anti-Patterns documentation suite.*

