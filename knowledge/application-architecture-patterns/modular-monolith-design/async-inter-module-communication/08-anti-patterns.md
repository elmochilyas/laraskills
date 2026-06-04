# ECC Anti-Patterns -- Inter-module asynchronous communication via events

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Modular Monolith Design |
| **Knowledge Unit** | Inter-module asynchronous communication via events |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Event-driven request-response
2. Event explosion

---

## Repository-Wide Anti-Patterns

- God Classes / Fat Services
- Architecture Without Enforcement
- Premature Abstraction
- Inconsistent Pattern Application
- Missing Documentation and Rationale

---

# Anti-Pattern Sections

## Anti-Pattern 1: Event-driven request-response

### Category
Design / Architecture

### Description
Event-driven request-response. This pattern violates best practices and introduces technical debt that compounds over time.

### Why It Happens
Convenience over correctness during development. Lack of automated enforcement. Insufficient architectural awareness. Time pressure prioritizing speed over structural integrity.

### Warning Signs
- Instances of this pattern visible during code review
- No automated checks detecting this pattern
- Repeated conversations about the same issues
- Inconsistent application across the codebase

### Why It Is Harmful
Increases coupling between components. Makes the codebase harder to test and maintain. Pattern violations accumulate as technical debt, making future changes more expensive.

### Real-World Consequences
Feature velocity decreases. Debugging complexity increases. Architectural migration becomes prohibitively expensive. Team morale suffers from working in an inconsistent, hard-to-navigate codebase.

### Preferred Alternative
Follow the documented best practices from this knowledge unit. Implement automated enforcement. Establish team conventions and document rationale for architectural decisions.

### Refactoring Strategy
1. Audit the codebase for all instances of this anti-pattern
2. Prioritize remediation by impact and effort
3. Systematically replace with the preferred alternative
4. Add automated checks to prevent recurrence
5. Update team documentation
6. Verify completeness with tests

### Detection Checklist
- [ ] Automated checks detect this pattern
- [ ] CI pipeline includes relevant checks
- [ ] Code review guidelines mention this pattern
- [ ] Team conventions address this pattern

### Related Rules
- MMD-07/05-rules.md

### Related Skills
- MMD-07/06-skills.md

### Related Decision Trees
- MMD-07/07-decision-trees.md

## Anti-Pattern 2: Event explosion

### Category
Design / Architecture

### Description
Event explosion. This pattern violates best practices and introduces technical debt that compounds over time.

### Why It Happens
Convenience over correctness during development. Lack of automated enforcement. Insufficient architectural awareness. Time pressure prioritizing speed over structural integrity.

### Warning Signs
- Instances of this pattern visible during code review
- No automated checks detecting this pattern
- Repeated conversations about the same issues
- Inconsistent application across the codebase

### Why It Is Harmful
Increases coupling between components. Makes the codebase harder to test and maintain. Pattern violations accumulate as technical debt, making future changes more expensive.

### Real-World Consequences
Feature velocity decreases. Debugging complexity increases. Architectural migration becomes prohibitively expensive. Team morale suffers from working in an inconsistent, hard-to-navigate codebase.

### Preferred Alternative
Follow the documented best practices from this knowledge unit. Implement automated enforcement. Establish team conventions and document rationale for architectural decisions.

### Refactoring Strategy
1. Audit the codebase for all instances of this anti-pattern
2. Prioritize remediation by impact and effort
3. Systematically replace with the preferred alternative
4. Add automated checks to prevent recurrence
5. Update team documentation
6. Verify completeness with tests

### Detection Checklist
- [ ] Automated checks detect this pattern
- [ ] CI pipeline includes relevant checks
- [ ] Code review guidelines mention this pattern
- [ ] Team conventions address this pattern

### Related Rules
- MMD-07/05-rules.md

### Related Skills
- MMD-07/06-skills.md

### Related Decision Trees
- MMD-07/07-decision-trees.md

---

*Generated on 2026-06-03 as part of the ECC Anti-Patterns documentation suite.*
