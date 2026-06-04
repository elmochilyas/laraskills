# ECC Anti-Patterns -- Unknown

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Platform Engineering |
| **Subdomain** | Monitoring Observability Cost |
| **Knowledge Unit** | Unknown |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Dumping Laravel log file to CloudWatch as-is
2. Not monitoring log costs
3. Excessive log retention
4. Logging in tight loops

---

## Repository-Wide Anti-Patterns

- God Classes / Fat Services
- Architecture Without Enforcement
- Premature Abstraction
- Inconsistent Pattern Application
- Missing Documentation and Rationale

---

# Anti-Pattern Sections

## Anti-Pattern 1: Dumping Laravel log file to CloudWatch as-is

### Category
Design / Architecture

### Description
Dumping Laravel log file to CloudWatch as-is. This pattern violates best practices and introduces technical debt that compounds over time.

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

## Anti-Pattern 2: Not monitoring log costs

### Category
Design / Architecture

### Description
Not monitoring log costs. This pattern violates best practices and introduces technical debt that compounds over time.

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

## Anti-Pattern 3: Excessive log retention

### Category
Design / Architecture

### Description
Excessive log retention. This pattern violates best practices and introduces technical debt that compounds over time.

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

## Anti-Pattern 4: Logging in tight loops

### Category
Design / Architecture

### Description
Logging in tight loops. This pattern violates best practices and introduces technical debt that compounds over time.

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
