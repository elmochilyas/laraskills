# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** DDD Strategic
**Knowledge Unit:** Ubiquitous language maintenance practices
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Code-first vs workshop-first language discovery
* Decision 2: Rename code vs document mapping when language evolves
* Decision 3: Single language vs per-context qualified terms
* Decision 4: Formal glossary vs lightweight conventions

---

# Architecture-Level Decision Trees

---

## Decision: Code-First vs Workshop-First Language Discovery

---

## Decision Context

Choose the primary method for establishing and evolving the Ubiquitous Language.

---

## Decision Criteria

* performance considerations: workshops require recurring team time; code-first discovery is faster initially
* architectural considerations: workshop-first produces domain-accurate models; code-first may encode developer assumptions
* security considerations: domain expert validation catches misinterpreted business rules
* maintainability considerations: workshop-first creates buy-in and shared understanding that reduces rework

---

## Decision Tree

Are domain experts available for regular (bi-weekly) collaborative sessions?
↓
YES → Do the domain experts have time and willingness to participate in modeling?
    YES → Workshop-first approach (Event Storming, domain modeling sessions)
        ↓
        Is the domain complex with non-obvious rules and edge cases?
        YES → Workshop-first with code validation (build glossary then code; validate in next workshop)
        NO → Workshop-first sufficient (simple domain, quick glossary, code immediately)
    NO → Is there existing written domain documentation (specs, regulations, process docs)?
        YES → Document analysis + code-first with periodic expert validation (extract terms from docs)
        NO → Code-first discovery with glossary extraction (developers create initial terms, validate later)
NO → Can remote or async alternatives substitute for in-person workshops?
    YES → Async workshop approach (recorded sessions, shared documents, Loom walkthroughs)
    NO → Code-first discovery with glossary extraction (developers propose terms; domain experts review)
        ↓
        Are review cycles fast (within 1-2 sprints)?
        YES → Code-first with rapid glossary review (acceptable risk)
        NO → Code-first with stub glossary (flag all terms as provisional; revisit when expert available)

---

## Rationale

Workshop-first produces higher-quality Ubiquitous Language because domain experts participate actively in term definition. Code-first risks encoding developer assumptions that diverge from the domain. However, workshops require domain expert time, which is often the scarcest resource on a project. Choose workshop-first when domain experts are available; fall back to code-first with glossary extraction when they aren't, but mark all terms as provisional.

---

## Recommended Default

**Default:** Workshop-first via Event Storming for complex domains; code-first with glossary extraction for simple domains.

**Reason:** Event Storming produces the highest-quality Ubiquitous Language by surfacing domain events and terminology collaboratively. For simple CRUD domains, the cost of workshops exceeds the benefit.

---

## Risks Of Wrong Choice

Workshop-first without domain experts: team invents language that doesn't match reality. Code-first without glossary: no shared reference, terms drift. Both without glossary: language exists in code only, no single source of truth.

---

## Related Rules

- Rule 2: Evolve the language with domain experts—it belongs to them, not developers
- Rule 5: Use the language in conversations and documentation—not just in code

---

## Related Skills

- Establish and Enforce Ubiquitous Language
- Facilitate an Event Storming Workshop

---

## Decision: Rename Code vs Document Mapping When Language Evolves

---

## Decision Context

Choose whether to rename code artifacts immediately when the Ubiquitous Language changes, or keep old names and document the mapping.

---

## Decision Criteria

* performance considerations: renaming has zero runtime cost; mapping adds per-developer cognitive overhead
* architectural considerations: renamed code stays aligned with current domain understanding
* security considerations: stale code names can mask security concepts that have been renamed
* maintainability considerations: renaming is disruptive but keeps code honest; mapping preserves stability

---

## Decision Tree

Would renaming break a published API contract consumed externally?
↓
YES → Keep old names; add alias/deprecation period (cannot break external consumers)
    ↓
    Is the deprecation period defined (e.g., 3 months)?
    YES → Add @deprecated tag, create new API endpoint, schedule removal
    NO → Define deprecation period first; communicate to consumers
NO → Does the renamed concept affect database column names or stored data?
    YES → Can you use a database migration (rename column, update procedures)?
        YES → Rename database and code together (full consistency — preferred)
        NO → Add column alias; rename in next deployment window
    NO → Is the rename purely internal (classes, methods, variables)?
        YES → Is the rename comprehensive (all references updated)?
            YES → Rename everything immediately (IDE refactoring, full consistency)
            NO → Rename incrementally per module (avoid partial rename that creates confusion)
        NO → Use IDE rename refactoring tool (catches all references automatically)
    ↓
    After rename complete: update glossary, documentation, API docs, test descriptions
    ↓
    Can the old name be removed completely (no remaining references)?
    YES → Remove old name entirely (clean break)
    NO → Add a single comment alias at the definition site only (temporary bridge)

---

## Rationale

When the Ubiquitous Language changes, the code should change too. Keeping old names with explanatory comments ("formerly known as X") perpetuates the old language and creates cognitive dissonance. Rename comprehensively using IDE refactoring tools. The only exception is published API contracts, where backward compatibility requires a deprecation period.

---

## Recommended Default

**Default:** Rename code immediately for internal artifacts; use deprecation for published APIs.

**Reason:** Delayed renames accumulate technical debt in terminology. Every day the code uses old terms is a day the language drift persists.

---

## Risks Of Wrong Choice

Not renaming: old terminology persists, new team members learn incorrect concepts, code and domain diverge. Partial renaming: some files use old terms, some use new — confusion worse than either option alone.

---

## Related Rules

- Rule 1: Use the same term everywhere in code, database, events, and UI for the same domain concept
- Rule 4: Rename code when the language changes—do not keep old code names

---

## Related Skills

- Establish and Enforce Ubiquitous Language

---

## Decision: Single Language vs Per-Context Qualified Terms

---

## Decision Context

Decide whether a term that appears in multiple bounded contexts should be qualified (e.g., SalesOrder) or kept as a single term across contexts.

---

## Decision Criteria

* performance considerations: qualified terms add prefix overhead but reduce ambiguity; single terms are shorter
* architectural considerations: qualified terms respect context boundaries; single terms imply shared semantics
* security considerations: qualified terms prevent accidental data leakage between contexts
* maintainability considerations: qualified terms reduce ambiguity-related defects; single terms simplify cross-context discussion

---

## Decision Tree

Does the same term have different meanings in different bounded contexts?
↓
YES → Use per-context qualified terms (e.g., SalesOrder vs ShippingOrder)
    ↓
    Is the context boundary already explicit in code structure (namespaces, modules)?
    YES → Consider short qualified term if namespace alone isn't sufficient disambiguation
    NO → Always prefix: SalesOrder, ShippingOrder, KitchenOrder
NO → Does different team ownership mean the term may diverge over time?
    YES → Pre-qualify as future-proofing (prevent divergent interpretations)
    NO → Does the term have the same meaning across all contexts today?
        YES → Is the behavior and data structure identical across contexts?
            YES → Single term across contexts (same concept, same behavior — share the model)
            NO → Single term, separate implementations (same concept, different behavior)
        NO → Is the meaning subtly different (90% overlap)?
            YES → Per-context qualified terms (avoid subtle bug where a field means different things)
            NO → Single term acceptable (clearly same concept everywhere)

---

## Rationale

Qualified terms (SalesOrder, ShippingOrder) make context boundaries explicit in naming. They prevent the common bug where a developer assumes "Order" means the same thing everywhere. Use qualified terms when the concept has genuinely different semantics per context. Use a single term only when the concept, behavior, and data structure are identical across contexts.

---

## Recommended Default

**Default:** Use per-context qualified terms (SalesOrder, ShippingOrder) unless the concept is provably identical across contexts.

**Reason:** The cost of slightly longer names is negligible compared to the cost of ambiguity bugs. Qualified terms make context boundaries visible in every reference.

---

## Risks Of Wrong Choice

Single term for different concepts: ambiguity, wrong assumptions, bugs where fields mean different things. Qualified terms for identical concepts: unnecessary prefix noise, suggests differences that don't exist.

---

## Related Rules

- Rule 3: When a term is overloaded, qualify it with the bounded context
- Rule 1: Use the same term everywhere in code, database, events, and UI for the same domain concept

---

## Related Skills

- Establish and Enforce Ubiquitous Language
- Identify Bounded Contexts

---

## Decision: Formal Glossary vs Lightweight Conventions

---

## Decision Context

Choose the rigor level for documenting and maintaining the Ubiquitous Language glossary.

---

## Decision Criteria

* performance considerations: formal glossaries require maintenance time; lightweight conventions are faster to establish
* architectural considerations: formal glossaries provide a single source of truth; lightweight conventions rely on team memory
* security considerations: formal glossaries document security-sensitive terms explicitly
* maintainability considerations: formal glossaries support onboarding and prevent drift; lightweight conventions scale poorly with team size

---

## Decision Tree

Is the team larger than 5 developers?
↓
YES → Are there more than 2 bounded contexts or subdomains?
    YES → Formal glossary required (too many terms for team memory alone)
        ↓
        Is the glossary expected to exceed 100 terms?
        YES → Structured glossary with categories (separate sections per bounded context, term status, last reviewed date)
        NO → Flat glossary with definitions (simple alphabetical listing suffices)
    NO → Lightweight glossary with enforcement automation (PHPStan rule checks term usage in code)
NO → Is the domain complex or regulated (finance, healthcare, legal)?
    YES → Formal glossary with review process (terms reviewed by domain experts, change log, version history)
    NO → Is the team co-located with access to domain experts?
        YES → Lightweight glossary (spreadsheet or README; updated ad-hoc)
        NO → Lightweight glossary with periodic review (prevent drift from async communication)
    ↓
    Does the team have good language discipline (catches term misuse in code review)?
    YES → Lightweight conventions sufficient (team culture maintains language)
    NO → Add automation (PHPStan custom rules, CI check that glossary terms appear in code)

---

## Rationale

Formal glossaries scale with team size and domain complexity. For small teams with simple domains, lightweight conventions work because communication bandwidth is high and the term set is small. For larger teams or regulated domains, a structured glossary prevents drift that accumulates from turnover and async communication.

---

## Recommended Default

**Default:** Formal glossary in the repository (structured Markdown or tool-backed); review quarterly.

**Reason:** A glossary in the repository becomes part of the codebase — reviewed, versioned, and accessible. Even small teams benefit from a written reference, and the cost of maintaining it is low.

---

## Risks Of Wrong Choice

Formal glossary without maintenance: becomes stale, loses trust, eventually ignored. Lightweight conventions with team growth: terms drift, onboarding suffers, ambiguity increases.

---

## Related Rules

- Rule 5: Use the language in conversations and documentation—not just in code
- Rule 2: Evolve the language with domain experts—it belongs to them, not developers

---

## Related Skills

- Establish and Enforce Ubiquitous Language
- Facilitate an Event Storming Workshop
