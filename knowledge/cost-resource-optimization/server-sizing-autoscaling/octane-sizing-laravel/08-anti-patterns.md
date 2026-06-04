# ECC Anti-Patterns -- Unknown

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Platform Engineering |
| **Subdomain** | Server Sizing Autoscaling |
| **Knowledge Unit** | Unknown |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Infinite worker count
2. No memory growth monitoring
3. Octane without opcache
4. Same scaling for queue and web workers

---

## Repository-Wide Anti-Patterns

- God Classes / Fat Services
- Architecture Without Enforcement
- Premature Abstraction
- Inconsistent Pattern Application
- Missing Documentation and Rationale

---

# Anti-Pattern Sections

## Anti-Pattern 1: Infinite worker count

### Category
Design / Architecture

### Description
Infinite worker count. This pattern violates best practices and introduces technical debt that compounds over time.

### Why It Happens
Convenience over correctness during development. Lack of automated enforcement. Insufficient architectural awareness. Time pressure prioritizing speed over structural integrity.

### Warning Signs
- Instances of this pattern visible during code review
- No automated checks detecting this pattern
- Repeated conversations about the same issues
- Inconsistent application across the codebase

### Why It Is Harmful
Reduces developer productivity. Increases friction in development workflows and slows delivery velocity. Pattern violations accumulate as technical debt, making future changes more expensive.

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
- Unknown/05-rules.md

### Related Skills
- Unknown/06-skills.md

### Related Decision Trees
- Unknown/07-decision-trees.md

## Anti-Pattern 2: No memory growth monitoring

### Category
Design / Architecture

### Description
No memory growth monitoring. This pattern violates best practices and introduces technical debt that compounds over time.

### Why It Happens
Convenience over correctness during development. Lack of automated enforcement. Insufficient architectural awareness. Time pressure prioritizing speed over structural integrity.

### Warning Signs
- Instances of this pattern visible during code review
- No automated checks detecting this pattern
- Repeated conversations about the same issues
- Inconsistent application across the codebase

### Why It Is Harmful
Reduces developer productivity. Increases friction in development workflows and slows delivery velocity. Pattern violations accumulate as technical debt, making future changes more expensive.

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
- Unknown/05-rules.md

### Related Skills
- Unknown/06-skills.md

### Related Decision Trees
- Unknown/07-decision-trees.md

## Anti-Pattern 3: Octane without opcache

### Category
Design / Architecture

### Description
Octane without opcache. This pattern violates best practices and introduces technical debt that compounds over time.

### Why It Happens
Convenience over correctness during development. Lack of automated enforcement. Insufficient architectural awareness. Time pressure prioritizing speed over structural integrity.

### Warning Signs
- Instances of this pattern visible during code review
- No automated checks detecting this pattern
- Repeated conversations about the same issues
- Inconsistent application across the codebase

### Why It Is Harmful
Reduces developer productivity. Increases friction in development workflows and slows delivery velocity. Pattern violations accumulate as technical debt, making future changes more expensive.

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
- Unknown/05-rules.md

### Related Skills
- Unknown/06-skills.md

### Related Decision Trees
- Unknown/07-decision-trees.md

## Anti-Pattern 4: Same scaling for queue and web workers

### Category
Design / Architecture

### Description
Same scaling for queue and web workers. This pattern violates best practices and introduces technical debt that compounds over time.

### Why It Happens
Convenience over correctness during development. Lack of automated enforcement. Insufficient architectural awareness. Time pressure prioritizing speed over structural integrity.

### Warning Signs
- Instances of this pattern visible during code review
- No automated checks detecting this pattern
- Repeated conversations about the same issues
- Inconsistent application across the codebase

### Why It Is Harmful
Reduces developer productivity. Increases friction in development workflows and slows delivery velocity. Pattern violations accumulate as technical debt, making future changes more expensive.

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
- Unknown/05-rules.md

### Related Skills
- Unknown/06-skills.md

### Related Decision Trees
- Unknown/07-decision-trees.md

---

*Generated on 2026-06-03 as part of the ECC Anti-Patterns documentation suite.*
