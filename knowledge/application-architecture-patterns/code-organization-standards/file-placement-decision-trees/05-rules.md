# Rules: COS-12 — File Placement Decision Trees

## R01: Apply the Three-Question Rule for Every New File
---
## Category
Code Organization
---
## Rule
Before creating any new file, answer three questions: (1) Which domain? (2) Which role/layer? (3) What name?
---
## Reason
These three axes (domain, role, name) determine placement. Answering them systematically prevents guessing, eliminates "I'll move it later" (which never happens), and ensures consistent file locations across the team.
---
## Bad Example
```php
// Developer creates a file without answering the questions:
// "Where should this go?" → nearest-looking existing directory
// "What should I name it?" → copies a name from a tutorial
// Result: file in wrong directory with wrong name
```
---
## Good Example
```php
// Three-Question Rule:
// 1. Domain: Billing (invoice discount logic)
// 2. Role: Action (single operation — no orchestration)
// 3. Name: ApplyDiscount (Verb-Noun)
// Result: app/Domains/Billing/Actions/ApplyDiscount.php ✓
```
---
## Exceptions
Utility code that is genuinely cross-cutting — domain is "Shared," role is "Utility," name describes function.
---
## Consequences Of Violation
Inconsistent file placement. Files in wrong directories. Mismamed classes that don't communicate role.
---

## R02: Keep Decision Trees Under 5 Branches Maximum
---
## Category
Maintainability
---
## Rule
Keep file placement decision trees small — no more than 5 top-level branches. If the tree is too complex, simplify the directory structure instead of documenting complexity.
---
## Reason
A decision tree with 20+ branches is not usable — developers won't read it. They'll guess. If placement requires a flowchart, the directory structure is wrong. Simplify the structure so placement is obvious.
---
## Bad Example
```php
// Decision tree with 15 branches:
// 1. HTTP-related? → a) Controller b) Middleware c) Request d) Resource e) Response
// 2. Data-related? → a) Model b) Factory c) Migration d) Seeder e) Observer
// 3. Business logic? → a) Service b) Action c) UseCase d) Rule e) Event
// Nobody uses this — too many options
```
---
## Good Example
```php
// Decision tree with 3 branches:
// 1. Cross-cutting concern? → app/Shared/
// 2. Specific domain? → app/Domains/{Domain}/
// 3. Unsure? → Ask in #architecture channel
```
---
## Exceptions
No common exceptions — complexity in the tree indicates complexity in the structure. Fix the structure, not the documentation.
---
## Consequences Of Violation
Decision tree is ignored. Developers guess or ask colleagues, wasting team time.
---

## R03: Always Include a Fallback Rule
---
## Category
Reliability
---
## Rule
Every decision tree must terminate with a "don't know?" option — ask the team, discuss in standup, or use a temporary `_pending/` directory.
---
## Reason
Without a fallback, developers who can't find their case in the tree will guess. Guessing leads to inconsistent placement. A fallback ensures that uncertain cases are explicitly resolved rather than guessed.
---
## Bad Example
```php
// Decision tree with no fallback:
// New file → Billing? Catalog? Identity?
// Developer: "None of these quite fit... I'll put it with the closest one"
// File ends up in wrong directory

// Decision tree with fallback:
// New file → Billing? Catalog? Identity? Unsure → Ask in #team-chat
```
---
## Exceptions
Trivially simple projects (1 domain, 2 layers) where placement is always obvious.
---
## Consequences Of Violation
Files placed in wrong directories because developers guess rather than ask. Structural drift over time.
---

## R04: Let Patterns Emerge Before Codifying the Decision Tree
---
## Category
Architecture
---
## Rule
Wait 3-6 months after project start before formalizing a file placement decision tree.
---
## Reason
Building the tree before the application exists is speculation. Real placement patterns emerge as code is written. A tree built too early will not match reality and will be ignored.
---
## Bad Example
```php
// Day 1: Document comprehensive 12-branch decision tree
// Month 4: Only 3 branches are actually used
// 9 branches describe patterns that never materialized
// Tree is ignored as irrelevant
```
---
## Good Example
```php
// Day 1-90: Default structure, observe where files naturally land
// Month 4: Identify 3 common patterns (domain, shared, cross-cutting)
// Month 4+: Document the tree based on real usage, not speculation
```
---
## Exceptions
Projects migrating from a legacy system with well-understood domain boundaries — patterns are already known.
---
## Consequences Of Violation
Decision tree doesn't match reality. Developers ignore the documentation and create their own patterns.
---

## R05: Review and Update the Decision Tree Quarterly
---
## Category
Maintainability
---
## Rule
Schedule a quarterly review of the file placement decision tree to ensure it still matches the application's structure.
---
## Reason
As the application evolves, new patterns emerge, old patterns become obsolete. An outdated tree is worse than no tree — it actively misleads developers into placing files incorrectly.
---
## Bad Example
```php
// Tree created 18 months ago — never updated
// Describes "app/Domains/" structure, but team migrated to module-based
// New developers follow the tree and place files in wrong locations
```
---
## Good Example
```markdown
// Q1 2026 Review: Tree matches current structure ✓
// Q2 2026 Review: New "Integrations" domain added → update tree
// Q3 2026 Review: Migrated from domains to modules → rewrite tree
```
---
## Exceptions
Stable projects where the directory structure hasn't changed in 6+ months.
---
## Consequences Of Violation
Misleading documentation. Developers learn the wrong structure. Re-onboarding required after structural drift.
---

## R06: Enforce Placement Rules via Code Review and Static Analysis
---
## Category
Reliability
---
## Rule
Add file placement verification to the code review checklist. For teams of 10+, use static analysis or custom PHPStan rules to automate enforcement.
---
## Reason
Documented rules alone are insufficient — developers will miss them, skip them, or forget them. Code review catches placement errors, and static analysis prevents them entirely.
---
## Bad Example
```php
// Rules documented in ARCHITECTURE.md — never checked
// 30% of files are in wrong directories
// "We have a convention" — no, you have a wish
```
---
## Good Example
```php
// Code review checklist:
// [ ] File is in the correct directory per the decision tree
// [ ] Namespace matches directory path
//
// PHPStan rule (team of 10+):
// - Disallow Models outside Models/ directory
// - Disallow Actions outside Actions/ directory
```
---
## Exceptions
Prototypes and throwaway projects where enforcement overhead is not justified.
---
## Consequences Of Violation
Structural degradation. Files scatter across old and new locations. Refactoring becomes impossible without moving hundreds of files.
---

## R07: Target 90%+ of Files Following the Standard Tree Without Discussion
---
## Category
Scalability
---
## Rule
If fewer than 90% of new files follow the decision tree without discussion, the tree or the structure needs revision.
---
## Reason
The decision tree should make placement obvious. If 10%+ of files require team discussion, the tree is incomplete or the structure is unclear. A 90%+ compliance rate means the convention is intuitive and well-designed.
---
## Bad Example
```php
// Monthly audit: only 60% of files follow the standard tree
// 40% of PRs require "where does this go?" conversation
// Team spends 2 hours/week debating file placement
```
---
## Good Example
```php
// Monthly audit: 95% of files follow the standard tree
// 5% exceptions are legitimate edge cases discussed briefly
// Placement is not a recurring conversation topic
```
---
## Exceptions
During active architecture migration (e.g., restructuring to domains), lower compliance is expected temporarily.
---
## Consequences Of Violation
Constant architectural overhead in team discussions. Slower onboarding. Inconsistent codebase.
---

## R08: Store Decision Tree in a Visible, Accessible Location
---
## Category
Maintainability
---
## Rule
Place the decision tree in CONTRIBUTING.md, ARCHITECTURE.md, or the project README — never in a private wiki or internal document.
---
## Reason
The decision tree is useless if developers can't find it. It must be in the repository alongside the code it governs. Private wikis are not indexed by IDE search and are not read in CI.
---
## Bad Example
```php
// Decision tree in Notion — 3 clicks deep in a team wiki
// New developer doesn't know it exists
// Tree is found 6 months later during onboarding review
```
---
## Good Example
```markdown
// ARCHITECTURE.md (at repository root)
// ## File Placement Decision Tree
// [tree content inline — not a link to external document]
// Always visible when browsing the repository
```
---
## Exceptions
No common exceptions — architectural documentation belongs in the repository.
---
## Consequences Of Violation
Decision tree is "lost" — developers don't know it exists. Tree falls out of date because it's not maintained alongside code.
