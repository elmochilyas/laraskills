# ECC Anti-Patterns — Hybrid Domain-Layer Approach

---

## Metadata

| Field | Value |
|-------|-------|
| **Domain** | Application Architecture Patterns |
| **Subdomain** | Code Organization Standards |
| **Knowledge Unit** | Hybrid: domains inside default Laravel structure |
| **Generated** | 2026-06-03 |

---

## Anti-Pattern Inventory

1. Inconsistent Application Across Layers
2. Orphaned Domain Subdirectories
3. Mixed Flat and Domain Without Rules
4. Stagnant Hybrid Architecture

---

## Repository-Wide Anti-Patterns

- Overengineering
- Premature Abstraction

---

## Anti-Pattern 1: Inconsistent Application Across Layers

### Category
Code Organization

### Description
Creating domain subdirectories for controllers but keeping all models flat, or applying domain grouping to services but not to controllers. The inconsistency creates confusion about where new files go — developers don't know whether to create `app/Models/Billing/Invoice.php` or keep `app/Models/Invoice.php` flat.

### Why It Happens
Partial adoption — different layers were restructured at different times. No team-wide convention document. Some developers prefer domain grouping, others prefer flat organization.

### Warning Signs
- Controllers have domain subdirectories but Models directory is flat
- Only some technical layers use domain grouping
- Files for the same domain exist flat AND in subdirectories
- New developers ask "should this be grouped by domain?" repeatedly

### Why It Is Harmful
Predictability is lost. The structure communicates inconsistent rules. Teams waste time in code review debating file placement.

### Preferred Alternative
Apply domain subdirectories consistently across all technical layers simultaneously. If controllers have `Billing/`, models, services, and other layers must also have `Billing/`.

### Refactoring Strategy
1. Audit all technical layers for domain grouping consistency
2. Identify layers where domain subdirectories are missing
3. Create matching subdirectories and move files
4. Document the "all layers" rule in CONTRIBUTING.md

### Related Rules
- R01: Apply Domain Subdirectories Consistently Across All Technical Layers (COS-07/05-rules.md)

### Related Skills
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

### Related Decision Trees
- Consistent Domain Subdirectories Across All Layers vs Partial Adoption (COS-07/07-decision-trees.md)

---

## Anti-Pattern 2: Orphaned Domain Subdirectories

### Category
Code Organization

### Description
Domain subdirectories created with 1-2 files and then abandoned. A directory `app/Models/Reporting/` with a single file that was started but never completed — the rest of the reporting feature's code lives elsewhere.

### Why It Happens
No threshold for subdirectory creation. A developer starts organizing but doesn't finish. The subdirectory remains as a stub that confuses future developers.

### Warning Signs
- Subdirectories with only 1-2 files exist for months
- The remaining code for that domain is still flat in the parent directory
- Subdirectory was created once but never had files added

### Why It Is Harmful
Orphaned subdirectories create inconsistent structure. They signal an incomplete organization effort. Developers may avoid using them because "that directory seems abandoned."

### Preferred Alternative
Establish a threshold: create domain subdirectories only when 3+ files relate to the same business concept. If a subdirectory has fewer than 3 files after 1 month, flatten it back.

### Refactoring Strategy
1. Identify all domain subdirectories with fewer than 3 files
2. Move those files back to the flat parent directory
3. Remove the empty subdirectory
4. Document the threshold rule to prevent future orphans

### Related Rules
- R02: Establish a Threshold for Creating Domain Subdirectories (COS-07/05-rules.md)

### Related Skills
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

### Related Decision Trees
- Threshold-Based Domain Creation vs Ad-Hoc Domain Grouping (COS-07/07-decision-trees.md)

---

## Anti-Pattern 3: Mixed Flat and Domain Without Rules

### Category
Code Organization

### Description
Some code is organized by domain in subdirectories, some remains flat in technical layers, but no documented rules explain the distinction. Developers cannot determine whether new code should be grouped or flat without tribal knowledge.

### Why It Happens
No team documentation on the hybrid convention. Different developers make different decisions. The structure evolved organically without written standards.

### Warning Signs
- Files for the same domain are split between flat and subdirectory locations
- No CONTRIBUTING.md or ARCHITECTURE.md explains file placement
- Code review comments about file placement are inconsistent
- Long-tenured members know "where things go" but can't explain why

### Why It Is Harmful
Unpredictable structure. Repeated code review corrections. New developers place files wrong until they learn the undocumented rules.

### Preferred Alternative
Document the hybrid convention explicitly: which directories have domain grouping, what the threshold is, and where shared code goes. Include in CONTRIBUTING.md.

### Refactoring Strategy
1. Document current implicit conventions
2. Formalize rules: threshold, shared code placement, naming conventions
3. Audit existing structure and fix inconsistencies
4. Add file placement to PR review checklist

### Related Rules
- R05: Document the Hybrid Convention Explicitly (COS-07/05-rules.md)
- R07: Use Code Review to Catch Misplaced Files (COS-07/05-rules.md)

### Related Skills
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

---

## Anti-Pattern 4: Stagnant Hybrid Architecture

### Category
Architecture

### Description
Treating the hybrid approach as the final state despite team growth beyond 15 engineers. Domains exist as cosmetic directory groupings but have no real isolation — cross-domain imports are everywhere, no contracts exist, no enforcement. The team says "we use hybrid" but actually has no organization system.

### Why It Happens
Teams stop evolving architecture after the hybrid step. They don't recognize when full domain isolation is needed. The effort of moving to full isolation seems too large.

### Warning Signs
- 12+ "domains" but no service providers or contracts
- Cross-domain Eloquent access is routine
- No architecture tests enforce boundaries
- Team has been hybrid for 2+ years with 20+ engineers

### Why It Is Harmful
Hybrid without evolution becomes an excuse for having no real domain isolation. Domains are cosmetic only — no ownership, no enforcement, no extraction capability.

### Preferred Alternative
Treat hybrid as an intermediate step. When the team exceeds 10-15 engineers, migrate to full domain isolation with per-domain providers, contracts, automated enforcement, and documented boundary rules.

### Refactoring Strategy
1. Assess whether hybrid is still appropriate for current team size
2. If not, plan phased migration: identify domains, create providers, add contracts
3. Add architecture tests incrementally
4. Document the evolution in ADRs

### Related Rules
- R08: Use Hybrid as an Intermediate Step, Not a Final State (COS-07/05-rules.md)

### Related Skills
- Apply Hybrid Domain-Layer Organization Within Default Structure (COS-07/06-skills.md)

### Related Decision Trees
- Hybrid vs Full Domain Isolation (COS-07/07-decision-trees.md)
