# ECC Anti-Patterns -- Bounded context identification: language, teams, data

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Domain Boundaries and Bounded Contexts |
| **Knowledge Unit** | Bounded context identification: language, teams, data |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Database-driven boundaries:
2. Team-structure-only boundaries:
3. Too many contexts:

---

## Repository-Wide Anti-Patterns

- Fat Controllers
- God Classes
- Premature Abstraction
- Architecture Without Enforcement
- Inconsistent Pattern Application

---

---

## Anti-Pattern 1: Database-driven boundaries:

### Category
Architecture

### Description
Database-driven boundaries:. This pattern violates architectural best practices and creates coupling between concerns that should remain separate.

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
- DBC-01/05-rules.md

### Related Skills
- DBC-01/06-skills.md

### Related Decision Trees
- DBC-01/07-decision-trees.md


---

## Anti-Pattern 2: Team-structure-only boundaries:

### Category
Architecture

### Description
Team-structure-only boundaries:. This pattern violates architectural best practices and creates coupling between concerns that should remain separate.

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
- DBC-01/05-rules.md

### Related Skills
- DBC-01/06-skills.md

### Related Decision Trees
- DBC-01/07-decision-trees.md


---

## Anti-Pattern 3: Too many contexts:

### Category
Architecture

### Description
Too many contexts:. This pattern violates architectural best practices and creates coupling between concerns that should remain separate.

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
- DBC-01/05-rules.md

### Related Skills
- DBC-01/06-skills.md

### Related Decision Trees
- DBC-01/07-decision-trees.md


---

## Related Knowledge Units

- DBC-01 knowledge unit documentation (02-knowledge-unit.md)
- DBC-01 decomposition (03-decomposition.md)

---

*Generated on 2026-06-03 as part of the ECC Anti-Patterns documentation suite.*

