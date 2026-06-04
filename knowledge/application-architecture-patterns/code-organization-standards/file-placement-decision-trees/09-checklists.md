# Metadata

**Domain:** Application Architecture Patterns
**Subdomain:** 01-code-organization-standards
**Knowledge Unit:** File placement decision trees and team conventions
**Generated:** 2026-06-03
**Based on:** 04, 05, 06, 07, 08

---

# Quick Checklist

- [ ] Apply the Three-Question Rule for Every New File followed
- [ ] Keep Decision Trees Under 5 Branches Maximum followed
- [ ] Always Include a Fallback Rule followed
- [ ] Orphaned Decision Tree prevented
- [ ] Flowchart-as-Documentation prevented

---

# Architecture Checklist

- [ ] Apply the Three-Question Rule for Every New File followed
- [ ] Keep Decision Trees Under 5 Branches Maximum followed
- [ ] Always Include a Fallback Rule followed
- [ ] Let Patterns Emerge Before Codifying the Decision Tree followed
- [ ] Review and Update the Decision Tree Quarterly followed

---

# Implementation Checklist

- [ ] Apply the Three-Question Rule for Every New File followed
- [ ] Keep Decision Trees Under 5 Branches Maximum followed
- [ ] Always Include a Fallback Rule followed
- [ ] Let Patterns Emerge Before Codifying the Decision Tree followed
- [ ] Review and Update the Decision Tree Quarterly followed
- [ ] Enforce Placement Rules via Code Review and Static Analysis followed
- [ ] Target 90%+ of Files Following the Standard Tree Without Discussion followed
- [ ] Store Decision Tree in a Visible, Accessible Location followed
- [ ] Workflow step completed: **Let patterns emerge before codifying.** Wait 3-6 months after project start. Real placement patterns reveal themselves as code is written. A tree built too early will not match reality.
- [ ] Workflow step completed: **Apply the Three-Question Rule.** Before creating any file, answer: (1) Which domain? (2) Which role/layer? (3) What name? Document these as the universal placement questions.
- [ ] Workflow step completed: **Design the decision tree.** Keep under 5 top-level branches. A typical tree splits between cross-cutting concerns and specific business domains:
- [ ] Workflow step completed: **Include a fallback rule.** Every tree must terminate with a "don't know?" option: ask in team channel, discuss in standup, or use a temporary directory. Without fallback, developers guess.
- [ ] Workflow step completed: **Store the tree in a visible repository location.** Place in CONTRIBUTING.md, ARCHITECTURE.md, or README Ã¢â‚¬â€ never in a private wiki. Must be alongside the code it governs.

---

# Performance Checklist

- [ ] N+1 queries reviewed
- [ ] Caching strategy evaluated
- [ ] Expensive operations queued

---

# Security Checklist

- [ ] Authorization enforced
- [ ] Validation implemented
- [ ] Secrets protected

---

# Reliability Checklist

- [ ] Failure addressed: Overly complex decision trees:
- [ ] Failure addressed: No fallback rule:
- [ ] Failure addressed: Perfect tree at project start:
- [ ] Failure addressed: Tree not updated:

---

# Testing Checklist

- [ ] Unit tests added
- [ ] Feature tests added
- [ ] Edge cases tested
- [ ] Failure paths tested

### Validation (from skills)
- [ ] File placement decision tree is documented and accessible
- [ ] Tree covers domain, role, and naming questions
- [ ] Fallback rule exists for uncertain cases
- [ ] Tree is reviewed quarterly for accuracy
- [ ] Code review checklist includes placement verification
- [ ] 90%+ of new files follow the standard tree without discussion
- [ ] Tree has 5 or fewer top-level branches

### Success Criteria
- [ ] 90%+ of new files follow the standard tree without team discussion.
- [ ] Placement rules are documented and accessible in the repository.
- [ ] Code review includes placement verification.
- [ ] Tree is reviewed quarterly and reflects current structure.

---

# Maintainability Checklist

- [ ] Code duplication reviewed
- [ ] Complexity acceptable
- [ ] Documentation updated
- [ ] Apply the Three-Question Rule for Every New File followed
- [ ] Keep Decision Trees Under 5 Branches Maximum followed
- [ ] Always Include a Fallback Rule followed
- [ ] Let Patterns Emerge Before Codifying the Decision Tree followed
- [ ] Review and Update the Decision Tree Quarterly followed
- [ ] Enforce Placement Rules via Code Review and Static Analysis followed
- [ ] Target 90%+ of Files Following the Standard Tree Without Discussion followed
- [ ] Store Decision Tree in a Visible, Accessible Location followed

---

# Anti-Pattern Prevention Checklist

- [ ] Anti-pattern prevented: Orphaned Decision Tree
- [ ] Anti-pattern prevented: Flowchart-as-Documentation
- [ ] Anti-pattern prevented: Perfect Tree at Project Start

---

# Production Readiness Checklist

- [ ] Monitoring considered
- [ ] Logging reviewed
- [ ] Error handling reviewed
- [ ] Configuration validated
- [ ] Rollback strategy considered
- [ ] Failure scenario handled: Overly complex decision trees:
- [ ] Failure scenario handled: No fallback rule:
- [ ] Failure scenario handled: Perfect tree at project start:

---

# Final Approval Checklist

The work should not be considered complete unless:

- [ ] Architecture requirements satisfied
- [ ] Security requirements satisfied
- [ ] Performance requirements satisfied
- [ ] Testing requirements satisfied
- [ ] Anti-pattern checks passed
- [ ] Production readiness verified

---

# Related Knowledge/Rules/Skills/Trees/Anti-Patterns

| Resource | Reference |
|---|---|
| Standardized Knowledge | ./04-standardized-knowledge.md |
| Rules | ./05-rules.md |
| Skills | ./06-skills.md |
| Decision Trees | ./07-decision-trees.md |
| Anti-Patterns | ./08-anti-patterns.md |
