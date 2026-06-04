# ECC Anti-Patterns — File Placement Decision Trees

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | File placement decision trees and team conventions |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Orphaned Decision Tree
2. Flowchart-as-Documentation
3. Perfect Tree at Project Start
4. No Fallback Rule

---

## Anti-Pattern 1: Orphaned Decision Tree

### Description
A file placement decision tree exists but nobody follows it — either it's wrong, outdated, or enforcement is missing. The tree lives in a document no one reads while actual placement decisions are made by guesswork.

### Why It Happens
Tree created once and never maintained. No enforcement mechanism. Team grows or changes and the tree doesn't evolve.

### Warning Signs
- Tree document has no updates in 6+ months
- New files don't follow the tree's rules
- Developers don't know the tree exists
- Tree contradicts actual directory structure

### Preferred Alternative
Review the tree quarterly. Link it from PR templates and CONTRIBUTING.md. Back it with automation where possible.

---

## Anti-Pattern 2: Flowchart-as-Documentation

### Description
A complex flowchart with 20+ branches that's harder to follow than just guessing placement. The tree tries to cover every edge case and becomes unusable.

### Why It Happens
Over-engineering the decision tree. Trying to document every possible scenario.

### Warning Signs
- Tree has more than 5-7 branches
- Developers print it out or bookmark it
- New developers say "I'll just ask someone" instead of using the tree

### Preferred Alternative
Keep decision trees under 5 branches. If the structure requires a complex flowchart, simplify the directory structure instead.

---

## Anti-Pattern 3: Perfect Tree at Project Start

### Description
Building the file placement decision tree before any code exists. The tree makes assumptions about domain boundaries and structure that don't match reality once the application is built.

### Why It Happens
Over-planning. Believing architecture can be fully designed upfront.

### Warning Signs
- Tree exists before the first feature is written
- Tree doesn't match actual patterns after 6 months
- Multiple revisions needed to the tree early in the project

### Preferred Alternative
Let 3-6 months of code reveal natural patterns before codifying the decision tree.
