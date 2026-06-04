## Chaperone vs Identity Map Sharing

Choosing between `chaperone()` for instance isolation and letting Eloquent's identity map share related model instances across parents.

---

## Decision Context

When eager-loading a relationship where multiple parents share the same related model (e.g., 100 posts all belonging to the same author), you must decide whether each parent should get its own related model instance or share one.

---

## Decision Criteria

* whether the related model will be mutated during the request
* whether the process is long-running (CLI, queue) or short-lived (web request)
* cardinality: how many parents share each related model
* whether identity map reference equality (`===`) is relied upon
* whether the relation is 1:many (high sharing) vs 1:1 or many:many (low sharing)

---

## Decision Tree

Eager-loading a relationship with shared related models?

↓

Is the request short-lived (typical web request with no mutations)?

YES → No chaperone — identity map sharing is desirable and harmless

NO → Will the related model be mutated in-memory during processing?

    YES → Is the mutation cardinality high (>100 parents sharing 1 related)?

        YES → Consider chaperone but monitor memory — high memory impact

        NO → Chaperone (low memory impact)

        Is shallow clone sufficient (no object-typed attributes shared)?

        YES → Chaperone

        NO → Need deep clone strategy (chaperone insufficient)

    NO → No chaperone needed — sharing is fine

---

## Rationale

Chaperone clones the related model per parent, preventing mutation leakage. This is valuable in long-running processes where state accumulates, but wasteful in short web requests. The memory cost is proportional to sharing cardinality.

---

## Recommended Default

**Default:** No chaperone for web requests; chaperone for CLI/queue jobs where mutations occur
**Reason:** Identity map sharing is memory-efficient and harmless in typical request-response flows

---

## Risks Of Wrong Choice

Chaperone on high-cardinality 1:many relations causes OOM; no chaperone in long-running processes causes subtle mutation bugs across parents.

---

## Related Rules

- Chaperone only where mutation isolation is needed (from chaperone standardized knowledge)

---

## Related Skills

- chaperone() usage on relationship definitions (relationships/06-skills.md)
