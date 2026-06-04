# Metadata

**Domain:** Backend Architecture & Design
**Subdomain:** Design Patterns & Principles
**Knowledge Unit:** Composite pattern in PHP/Laravel context
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Composite vs flat collection
* Decision 2: Component interface design — leaf-safe vs leaf-unfriendly operations
* Decision 3: Tree traversal — recursive vs iterative

---

# Architecture-Level Decision Trees

---

## Decision: Composite vs Flat Collection

---

## Decision Context

Choose between a tree structure (Composite) and a flat collection (array, Collection) for representing hierarchical data.

---

## Decision Criteria

* performance considerations: tree traversal is O(n); flat collection iteration is O(n) but without recursion overhead
* architectural considerations: tree preserves hierarchy naturally; flat collection requires parent/child references
* security considerations: tree can enforce access control per node; flat collection applies control at collection level
* maintainability considerations: tree requires Composite interface + Leaf + Composite classes; flat collection uses arrays

---

## Decision Tree

Does the data naturally form a tree structure (parent-child relationships with arbitrary depth)?
↓
YES → Consider Composite pattern
    ↓
    Examples: menu navigation, category tree, org chart, file system, form fields
    ↓
    Will the tree depth exceed 2-3 levels?
    YES → Composite (flat collection with parent_id becomes complex at depth > 2)
        ↓
        Flat collection with `parent_id` requires recursive queries or nested set
        Composite explicitly models the tree — no SQL recursion needed
        NO → Simple parent-child relationship (flat collection with parent_id is acceptable)
    ↓
    Do you need to treat leaf nodes and composite nodes uniformly (same operations)?
    YES → Composite (uniform treatment is the pattern's core value)
        ↓
        Client code calls `$node->render()` or `$node->getPrice()` without checking type
        NO → Flat collection with separate leaf/composite types (simpler, no uniform interface needed)
    NO → Is the hierarchy small (< 50 items) and flat (max 2 levels)?
        YES → Flat collection (Eloquent with `parent_id`, eager loaded)
            ↓
            Example: categories with 2 levels — eager load children in one query
            Simpler implementation, no Composite pattern overhead
            NO → Is performance of rendering/output critical?
                YES → Composite (pre-rendered tree cache, efficient traversal)
                NO → Either works; prefer Composite for clarity at 3+ levels

---

## Rationale

Composite is the right choice when you have deep, hierarchical data where leaf and composite nodes should be treated uniformly. Flat collections (arrays, Eloquent Collections with `parent_id`) are simpler for shallow hierarchies (1-2 levels). The inflection point is when hierarchy depth exceeds 2 levels or when uniform node treatment provides significant simplification.

---

## Recommended Default

**Default:** Flat collection with `parent_id` for simple hierarchies (≤2 levels). Composite pattern for deep hierarchies (3+ levels) where leaf and composite nodes need uniform treatment.
**Reason:** Composite adds class overhead. Flat collections are simpler for shallow hierarchies that can be eager loaded.

---

## Risks Of Wrong Choice

Composite for flat data: unnecessary class hierarchy, over-engineering. Flat collection for deep trees: N+1 queries without eager loading, complex recursive logic in application code. Composite without uniform treatment: client code still type-checks leaf vs composite, defeating the pattern's purpose.

---

## Related Rules

- Rule 1: Use Composite for deep hierarchies (3+ levels) requiring uniform node treatment
- Rule 2: Use flat collection for shallow hierarchies (≤2 levels) that can be eager loaded

---

## Related Skills

- Implement Composite Pattern
- Use Eloquent with Parent-Child Relationships
- Design Tree Structures

---

## Decision: Component Interface Design — Leaf-Safe vs Leaf-Unfriendly Operations

---

## Decision Context

Choose whether the Component interface includes operations that only make sense for Composite nodes (like `add()`, `remove()`, `getChildren()`) — requiring Leaf nodes to throw or no-op — or keeps the interface minimal and places tree operations in the Composite class.

---

## Decision Criteria

* performance considerations: leaf-safe interface may have unused method stubs; leaf-unfriendly interface throws exceptions
* architectural considerations: leaf-safe enables uniform treatment; leaf-unfriendly breaks uniformity by requiring type checks
* security considerations: leaf-safe with no-ops may silently ignore unexpected tree mutations; leaf-unfriendly fails loudly
* maintainability considerations: leaf-safe interface is larger; leaf-unfriendly adds instanceof checks in client code

---

## Decision Tree

Does client code need to treat Leaf and Composite nodes uniformly without type-checking?
↓
YES → Leaf-safe interface (include tree operations in Component, Leaf implements as no-op or throws)
    ↓
    `interface Component { function operation(): string; function add(Component $child): void; function remove(Component $child): void; }`
    Leaf: `add()` throws `UnsupportedOperationException` or is no-op
    ↓
    Does the Leaf's `add()` throwing exception break client code?
    YES → Consider no-op (silently ignore) — but this may hide bugs
        ↓
        Better: Leaf's `add()` throws documented `UnsupportedOperationException`
        Client should catch or avoid calling `add()` on Leaf
        NO → Exception is acceptable — failure is explicit and detectable in tests
    NO → Does keeping tree ops in Composite only simplify the Component interface?
        YES → Leaf-unfriendly interface (tree operations only in Composite class)
            ↓
            `interface Component { function operation(): string; }`
            `class Composite implements Component { function add(Component $child): void; ... }`
            `class Leaf implements Component { }` — no tree ops
            ↓
            Client must type-check: `if ($node instanceof Composite) { $node->add($child); }`
            This breaks uniformity — the tradeoff for a cleaner interface
            NO → Either approach works; prefer leaf-safe for uniformity
NO → Leaf-unfriendly interface (keep Component minimal, tree ops on Composite only)
    ↓
    Cleaner Component interface — each node type only has methods that make sense
    Client code uses `instanceof` or pattern matching to handle Composite vs Leaf
    ↓
    Is the component interface used by external consumers (library/package)?
    YES → Leaf-unfriendly interface (clean, minimal contract for external consumers)
        ↓
        External consumers prefer focused interfaces
        Tree operations exposed only where applicable
        NO → Leaf-unfriendly is simpler internally too

---

## Rationale

Leaf-safe interfaces maximize uniformity — client code never needs `instanceof`. Leaf-unfriendly interfaces are cleaner but require type checking. The decision depends on whether the cost of unused methods in Leaf (or exceptions) is worse than the cost of `instanceof` checks in client code.

---

## Recommended Default

**Default:** Leaf-unfriendly interface (tree operations only in Composite class). Leaf-safe interface only when client code must treat all nodes uniformly without any type-checking.
**Reason:** Leaf-unfriendly keeps the Component interface minimal and honest. Leaf-safe adds noise to Leaf classes and risks silent failures or unexpected exceptions.

---

## Risks Of Wrong Choice

Leaf-safe with exceptions: runtime errors if client calls `add()` on Leaf. Leaf-safe with no-ops: silent failures — client thinks child was added but it was ignored. Leaf-unfriendly with deep client nesting: repeated `instanceof` checks violate DRY — extract a visitor or dedicated API.

---

## Related Rules

- Rule 3: Leaf-safe interface when uniform treatment is non-negotiable
- Rule 4: Leaf-unfriendly interface when clean contract is more important than uniformity

---

## Related Skills

- Design Leaf-Safe Component Interface
- Design Leaf-Unfriendly Component Interface
- Handle Composite-Specific Operations

---

## Decision: Tree Traversal — Recursive vs Iterative

---

## Decision Context

Choose between recursive tree traversal (elegant, risk of stack overflow) and iterative traversal (explicit, stack-safe) for processing Composite structures.

---

## Decision Criteria

* performance considerations: recursive uses call stack; iterative uses explicit stack — both O(n) time, similar constants
* architectural considerations: recursive is simpler; iterative handles deep trees
* security considerations: recursive can exhaust call stack (DoS vector for untrusted input); iterative is bounded
* maintainability considerations: recursive is more readable; iterative requires explicit stack management

---

## Decision Tree

Is the maximum tree depth bounded and shallow (< 100 levels)?
↓
YES → Recursive traversal (simpler, more readable, no stack risk)
    ↓
    PHP default recursion limit: 256 (configurable via `xdebug.max_nesting_level`)
    100-level depth is safe with default settings
    ↓
    Is the tree depth guaranteed and enforced (e.g., database constraint, validation)?
    YES → Recursive (depth is a known, enforced limit)
        ↓
        Example: nested categories limited to 5 levels by business rule
        Recursive safe, no risk of overflow
        NO → Recursive with sanity check (count depth, throw if > 200)
    NO → Is performance critical with very large trees (10k+ nodes)?
        YES → Iterative (explicit stack — no recursion overhead, no stack risk)
            ↓
            Use `SplStack` or `SplQueue` for explicit traversal control
            ↓
            Pre-order: stack (push children in reverse order)
            Level-order: queue (enqueue children left to right)
            NO → Is the tree potentially deep (user-generated content, untrusted input)?
                YES → Iterative (prevent DoS via stack overflow from malicious input)
                    ↓
                    Untrusted tree depth = security concern
                    Iterative traversal uses heap memory, not call stack
                    NO → Recursive (standard, safe for controlled trees)
NO → Recursive (standard approach for moderate, controlled trees)
    ↓
    Most Laravel Composite usage falls into this category
    Recursive traversal with depth guard is the pragmatic default
    ↓
    Add depth check: `function traverse(Node $node, int $depth = 0) { if ($depth > 200) throw new MaxDepthExceededException(); ... }`

---

## Rationale

Recursive traversal is the default — simpler to write, read, and maintain. Iterative traversal is needed when depth is unbounded (user-generated trees, untrusted input) or when the tree is extremely deep (1000+ levels). The threshold: if depth is enforced by business rules ≤ 100 levels, recursion is safe and preferred.

---

## Recommended Default

**Default:** Recursive traversal with a depth guard (throw at 200+ depth). Iterative traversal only for unmanaged depth, untrusted input, or 1000+ level trees.
**Reason:** Recursive is simpler and sufficient for 99% of cases. The depth guard prevents accidental overflow from bugs.

---

## Risks Of Wrong Choice

Recursive on user-generated trees: stack overflow DoS vector. Iterative on small trees: unnecessarily complex code. Recursive without depth guard: PHP crash at 256+ depth with non-obvious error. Iterative with wrong order choice: BFS used where DFS needed or vice versa.

---

## Related Rules

- Rule 5: Add depth guard to recursive traversal — fail fast at unreasonable depth
- Rule 6: Use iterative traversal for untrusted input (user-generated tree structures)

---

## Related Skills

- Implement Recursive Tree Traversal
- Implement Iterative Tree Traversal (Stack/Queue)
- Add Depth Guard to Recursion
