# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Coupling & Cohesion
**Knowledge Unit:** God class detection (Eloquent models as god objects)
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: God class detection triggers
* Decision 2: Extract method vs extract class refactoring approach
* Decision 3: Which responsibility to extract first from a god class

---

# Architecture-Level Decision Trees

---

## Decision: God Class Detection Triggers

---

## Decision Context

Determine whether a class is a god class that needs refactoring based on multiple indicators.

---

## Decision Criteria

* performance considerations: god classes slow down IDEs and static analysis
* architectural considerations: god classes violate SRP, concentrate risk
* security considerations: god classes may have inconsistent security enforcement across responsibilities
* maintainability considerations: god classes are the single highest-maintenance code pattern

---

## Decision Tree

What is the class's line count?
↓
< 200 lines → Monitor (likely not a god class yet)
200-500 lines → Investigate: How many public methods?
    < 5 → Likely not a god class (long methods, not many responsibilities)
    5-10 → Yellow flag: Apply "why would this change?" test
        > 1 reason to change → God class detected
        1 reason → Not a god class (just a long class)
    > 10 → God class detected (too many methods for single responsibility)
> 500 lines → God class detected regardless of method count
    ↓
    What is the LCOM4 value?
    = 1 → Low cohesion expected; still too large, but may be acceptable
    > 2 → Strong god class indicator (disjoint field usage)

---

## Rationale

A class is a god class if it has high line count, many methods, or multiple reasons to change. Eloquent models in Laravel are particularly prone to becoming god classes because the framework makes it easy to add arbitrary responsibilities to a single model.

---

## Recommended Default

**Default:** Flag any class > 200 lines with LCOM4 > 2 as a god class requiring refactoring.

**Reason:** These thresholds catch the vast majority of god classes while avoiding false positives on legitimately large but cohesive classes.

---

## Risks Of Wrong Choice

Too permissive: god classes grow unchecked, become impossible to maintain. Too aggressive: unnecessary splitting, increased coupling, wasted refactoring effort.

---

## Related Rules

- Rule 1: Split any class whose single-responsibility description requires "and"
- Rule 2: Extract data groups from god classes into dedicated value objects or models

---

## Related Skills

- Detect and Refactor God Classes
- Measure Cohesion Types

---

## Decision: Extract Method vs Extract Class Refactoring Approach

---

## Decision Context

Choose between extracting methods within the same class versus extracting a separate class when refactoring a god class.

---

## Decision Criteria

* performance considerations: extract class adds indirection; extract method does not
* architectural considerations: extract class is more thorough; extract method is incremental
* security considerations: extract class may introduce new security boundaries
* maintainability considerations: extract class provides cleaner separation; extract method can be intermediate

---

## Decision Tree

Does the extracted responsibility use different data (fields) than the rest of the class?
↓
YES → Extract class (different field groups = different concerns)
NO → Does the extracted responsibility have independent behavior that could be tested alone?
    YES → Extract class (testable independently indicates separate concern)
    NO → Extract method (behavior uses same data; smaller change)
        ↓
        Is this method likely to grow into its own class later?
        YES → Extract class now (better boundary from the start)
        NO → Extract method (simpler, adequate refactoring)

---

## Rationale

Extract class when the responsibility has its own data subset (disjoint field usage) — this is the strongest indicator of a separate concern. Extract method when the behavior uses the same data as the rest of the class and is tightly coupled to it.

---

## Recommended Default

**Default:** Extract class for disjoint field groups; extract method for behavior on shared data.

**Reason:** Disjoint field usage is the definitive indicator of separate responsibilities. Extracting a class provides cleaner boundaries than piling more methods onto an already large class.

---

## Risks Of Wrong Choice

Extract method when class extraction is needed: the class stays large, responsibility separation is unclear. Extract class when method extraction would suffice: unnecessary indirection, increased coupling, harder to understand the overall flow.

---

## Related Rules

- Rule 4: Break god classes incrementally — Tease Apart Inheritance pattern
- Rule 5: Prefer delegation over inheritance when extracting from a god class

---

## Related Skills

- Detect and Refactor God Classes
- Measure Cohesion Types

---

## Decision: Which Responsibility to Extract First from a God Class

---

## Decision Context

Prioritize which responsibility to extract first when refactoring a god class with multiple concerns.

---

## Decision Criteria

* performance considerations: extract independent concerns first (easiest, lowest risk)
* architectural considerations: most isolated concern = easiest to extract
* security considerations: security-related responsibilities may need priority extraction
* maintainability considerations: first extraction must succeed to build momentum

---

## Decision Tree

Which responsibility has the fewest internal dependencies on the god class's data?
↓
Select that responsibility (most isolated = easiest to extract)
    ↓
    Is this responsibility also the one with the highest change frequency?
    YES → Extract first (most isolated + most changed = highest value extraction)
    NO → Is there a larger business need driving one responsibility's extraction?
        YES → Extract that one (business value justifies priority)
        NO → Extract the most isolated one (build confidence, prove pattern)
    ↓
    After extraction, does the god class make more sense?
    YES → Continue with next most isolated responsibility
    NO → Re-examine the boundaries; you may be extracting the wrong concern

---

## Rationale

The most isolated responsibility (fewest field/method dependencies within the god class) is the safest first extraction. It minimizes the risk of breaking existing functionality while proving the extraction pattern. Prioritize by isolation first, then by change frequency.

---

## Recommended Default

**Default:** Extract the most isolated, least coupled responsibility first.

**Reason:** First extraction success is critical for team confidence. Choose the easiest, lowest-risk extraction to prove the pattern works.

---

## Risks Of Wrong Choice

Hardest extraction first: risk of failure, team loses confidence in approach. Wrong boundary extraction: extracted class still tightly coupled to remaining god class, no improvement.

---

## Related Rules

- Rule 1: Split any class whose single-responsibility description requires "and"
- Rule 4: Break god classes incrementally

---

## Related Skills

- Detect and Refactor God Classes
- Measure Cohesion Types
- Apply Single Responsibility Principle
