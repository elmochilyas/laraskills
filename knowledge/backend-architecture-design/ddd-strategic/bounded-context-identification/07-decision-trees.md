# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** DDD Strategic
**Knowledge Unit:** Bounded context identification heuristics
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Merge vs split bounded contexts
* Decision 2: Bounded context per team vs per subdomain
* Decision 3: Language-based vs technical boundary identification

---

# Architecture-Level Decision Trees

---

## Decision: Merge vs Split Bounded Contexts

---

## Decision Context

Determine whether two potential bounded contexts should be merged or kept separate.

---

## Decision Criteria

* performance considerations: more contexts increase communication overhead
* architectural considerations: contexts at language boundaries should stay separate
* security considerations: contexts with sensitive data need isolation
* maintainability considerations: too many contexts cause coordination overhead; too few cause coupling

---

## Decision Tree

Do the contexts use different terminology for the same domain concept?
↓
YES → Keep separate (language difference indicates different context)
NO → Do the contexts have different rates of change or team ownership?
    YES → Keep separate (different evolution speeds cause conflict)
    NO → Would merging create a shared model with conflicting requirements?
        YES → Keep separate (shared model becomes a compromise that satisfies no one)
        NO → Do the contexts share more than 80% of their concepts and behaviors?
            YES → Merge (strong overlap suggests same context)
            NO → Keep separate (natural boundaries exist)

---

## Rationale

Bounded contexts should be split when they have distinct languages, different change rates, different team ownership, or conflicting model requirements. They should be merged only when the overlap is substantial (>80%) and no language or team boundaries exist.

---

## Recommended Default

**Default:** Start with slightly more granular contexts; merge if the overhead of separation exceeds the benefit.

**Reason:** It's easier to merge two separate contexts than to split a single large one. Starting granular gives clear boundaries that can be relaxed later.

---

## Risks Of Wrong Choice

Too many contexts: communication overhead, coordination complexity, context mapping burden. Too few contexts: shared model compromises, team coordination conflicts, coupling.

---

## Related Rules

- Rule 1: Identify bounded contexts through language boundaries, not technical boundaries

---

## Related Skills

- Identify Bounded Contexts
- Decompose by Business Capability

---

## Decision: Bounded Context Per Team vs Per Subdomain

---

## Decision Context

Choose whether bounded contexts should align with team structure or business subdomain boundaries.

---

## Decision Criteria

* performance considerations: team-aligned boundaries may not match domain boundaries
* architectural considerations: subdomain-aligned boundaries are more stable over time
* security considerations: security-sensitive subdomains may cross team boundaries
* maintainability considerations: Conway's Law — systems mirror team communication structures

---

## Decision Tree

Do team boundaries align with business subdomain boundaries?
↓
YES → Bounded context per subdomain per team (ideal alignment)
NO → Can teams be reorganized to match subdomain boundaries?
    YES → Reorganize teams first (Conway's Law says this produces better architecture)
    NO → Would creating additional contexts for team alignment introduce excessive overhead?
        YES → Use subdomain-aligned contexts (more stable in long term)
        NO → Choose based on which produces clearer boundaries:
            Team-aligned: better team autonomy, faster decision-making
            Subdomain-aligned: more stable boundaries, better domain alignment

---

## Rationale

Conway's Law states that systems mirror communication structures. Ideally, teams align with subdomain boundaries. When they don't, choose based on whether team autonomy or domain stability is more important for the current context.

---

## Recommended Default

**Default:** Align bounded contexts with business subdomains first; adjust for team boundaries only when team autonomy is critical.

**Reason:** Business subdomain boundaries are more stable than team structures. Team reorganizations are more frequent than domain changes.

---

## Risks Of Wrong Choice

Team-aligned only: boundaries change when teams reorganize, expensive refactoring. Subdomain-aligned without team consideration: communication overhead, ownership confusion.

---

## Related Rules

- Rule 2: Each bounded context gets its own module with its own models and logic

---

## Related Skills

- Identify Bounded Contexts
- Decompose by Business Capability

---

## Decision: Language-Based vs Technical Boundary Identification

---

## Decision Context

Choose whether to identify bounded context boundaries by analyzing domain language or by technical concerns.

---

## Decision Criteria

* performance considerations: language-based identification takes more time but produces better boundaries
* architectural considerations: language-based boundaries produce stable, domain-aligned contexts
* security considerations: language-based boundaries naturally align with security domains
* maintainability considerations: technical boundaries are easier to find but produce worse architecture

---

## Decision Tree

Is domain expert time available for language analysis?
↓
YES → Are there clear terminology differences across the domain?
    YES → Language-based boundaries (Event Storming, domain workshops)
    NO → Does the same term mean different things in different parts of the system?
        YES → Language-based boundaries (ambiguity signals context boundaries)
        NO → Language-based boundaries (still better than technical)
NO → Are there organizational boundaries (different teams, different stakeholders)?
    YES → Team-based boundaries (fallback — better than technical)
    NO → Change-pattern-based boundaries (what changes together, belongs together)
        ↓
        Are metrics available to measure coupling and change patterns?
        YES → Data-driven boundary identification (module coupling analysis)
        NO → Use technical boundaries as temporary placeholder (revisit with domain experts)

---

## Rationale

Language-based boundaries (Ubiquitous Language shifts) produce the most stable, domain-aligned contexts. Technical boundaries (by layer, by technology) should be avoided because they don't align with domain semantics. Use language analysis whenever possible.

---

## Recommended Default

**Default:** Language-based boundary identification via Event Storming with domain experts.

**Reason:** Language boundaries reveal genuine domain distinctions that technical analysis misses. Event Storming is the most effective technique for surfacing these boundaries collaboratively.

---

## Risks Of Wrong Choice

Technical boundaries: contexts that don't align with domain semantics, coupling between unrelated concepts. Language-based without domain experts: team models their assumptions, not the actual domain.

---

## Related Rules

- Rule 1: Identify bounded contexts through language boundaries, not technical boundaries

---

## Related Skills

- Identify Bounded Contexts
- Facilitate an Event Storming Workshop
- Define Context Mapping Relationships
