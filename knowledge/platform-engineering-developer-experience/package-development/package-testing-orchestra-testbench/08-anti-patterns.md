# ECC Anti-Patterns -- Unknown

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Platform Engineering |
| **Subdomain** | Package Development |
| **Knowledge Unit** | Unknown |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Only unit tests, no Testbench
2. Only Testbench, no unit tests
3. Hardcoded database paths in tests
4. Testing implementation details
5. Skipping version matrix testing

---

## Repository-Wide Anti-Patterns

- God Classes / Fat Services
- Architecture Without Enforcement
- Premature Abstraction
- Inconsistent Pattern Application
- Missing Documentation and Rationale

---

# Anti-Pattern Sections

## Anti-Pattern 1: Only unit tests, no Testbench

### Category
Design / Architecture

### Description
Only unit tests, no Testbench. This pattern violates best practices and introduces technical debt that compounds over time.

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

## Anti-Pattern 2: Only Testbench, no unit tests

### Category
Design / Architecture

### Description
Only Testbench, no unit tests. This pattern violates best practices and introduces technical debt that compounds over time.

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

## Anti-Pattern 3: Hardcoded database paths in tests

### Category
Design / Architecture

### Description
Hardcoded database paths in tests. This pattern violates best practices and introduces technical debt that compounds over time.

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

## Anti-Pattern 4: Testing implementation details

### Category
Design / Architecture

### Description
Testing implementation details. This pattern violates best practices and introduces technical debt that compounds over time.

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

## Anti-Pattern 5: Skipping version matrix testing

### Category
Design / Architecture

### Description
Skipping version matrix testing. This pattern violates best practices and introduces technical debt that compounds over time.

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
