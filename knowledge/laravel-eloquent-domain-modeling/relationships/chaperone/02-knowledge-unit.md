# Chaperone — Preventing Relation Leakage Across Parent Models

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** chaperone
- **Difficulty Level:** Advanced
- **Last Updated:** 2026-06-02

---

## Executive Summary
The `chaperone()` method (Laravel 11+) prevents a single related model instance from being shared across multiple parent models during eager loading. Without chaperoning, if two posts have the exact same author (same ID), Eloquent's identity map returns the same `Author` object for both — mutating the author via one post would affect the other. Chaperoning ensures each parent gets a separate instance of the related model, or at minimum prevents unwanted cross-parent mutation propagation.

---

## Core Concepts
Eloquent's identity map caches models by their primary key. When eager-loading `Author` for 50 `Post` models, if all 50 belong to the same author, they all get a reference to the same `Author` PHP object. Normally this is desirable (memory efficiency, object consistency). However, if code mutates `$post->author->name = 'Changed'`, all 50 posts now see the changed name — even though no database write occurred. `chaperone()` provides a way to prevent this shared-state mutation by returning clones or enforcing separation.

---

## Mental Models
Think of the chaperone as a **bouncer who ensures every parent gets their own copy of the related model**. Normally, Eloquent's identity map is like a library — everyone shares the same book. The chaperone says "no sharing — every post gets its own photocopy." This is useful in batch processing, imports, and commands where you mutate related models temporarily without wanting those mutations to leak across unrelated parents.

---

## Internal Mechanics
The `chaperone()` method is called on the relationship definition: `$this->belongsTo(Author::class)->chaperone()`. During eager loading, after the related models are fetched, Eloquent's `match()` method normally assigns the same hydrated model to each parent based on the identity map. With chaperoning, the `match()` method clones the model before assigning it to each parent. This is implemented in `Illuminate\Database\Eloquent\Relations\Concerns\SupportsInverseRelations` — the same trait that provides inverse relations. The cloning is shallow (the model's relations and attributes are copied by value for primitives, by reference for objects).

---

## Patterns
- **Batch processing protection**: `$this->belongsTo(Author::class)->chaperone()` — prevents mutation leaks during batch updates
- **Import/export safety**: Each imported row's parent relationship is isolated
- **Queue job isolation**: Preventing state leakage across queued model processing
- **Combined with inverse**: `->chaperone()->inverse('posts')` — full isolation with bidirectional consistency
- **Per-model cloning**: Instead of cloning the entire set, only clones when the same related model is encountered multiple times

---

## Architectural Decisions
The chaperone feature acknowledges that the identity map — normally a performance optimization — can be a liability in mutation-heavy contexts. Rather than breaking the identity map entirely (which would have performance implications), `chaperone()` provides a targeted opt-out. The decision to implement it via a method on the relationship definition makes the isolation intent explicit and visible. The shallow clone approach trades perfect isolation for performance — deeply nested relation mutations can still leak.

---

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Prevents cross-parent mutation leaks | Increased memory usage (duplicate model instances) | Each parent gets its own copy of related models |
| Opt-in, not breaking change | Shallow clone — object-typed attributes still shared | Nested relations on the related model can still leak |
| Visible in relationship definition | Only applies to eager-loaded relations | Lazy-loaded relations still share instances |
| Works naturally with inverse | May surprise developers expecting identity map behavior | Teams must document chaperone usage |

---

## Performance Considerations
Chaperoning increases memory usage linearly with the number of parent models that share the same related model. For 1,000 posts sharing one author, without chaperone: 1 `Author` instance in memory. With chaperone: 1,000 `Author` instances. For large datasets, this can significantly increase memory pressure. The shallow clone operation itself is fast (microseconds per model), but the accumulated memory overhead is the primary concern. Use chaperone judiciously — only on relationships where mutation isolation matters.

---

## Production Considerations
Chaperone is most valuable in CLI commands, queue workers, and import scripts — long-running processes where accumulated mutations can cause subtle bugs. In web requests (short-lived), the identity map is typically fine. Monitor memory usage when enabling chaperone on high-cardinality relationships. The cloned models have `$exists = true` since they originate from the database. Chaperoning combined with `toArray()` serialization will produce identical output — the cloning is transparent to serialization.

---

## Common Mistakes
- Using chaperone when identity map sharing is actually desired (wasting memory unnecessarily).
- Expecting chaperone to prevent all state leakage (object-typed model attributes are still shared via shallow clone).
- Applying chaperone to all relationships in a model "just in case" — significant memory bloat.
- Forgetting that lazy loading is not chaperoned — only eager-loaded relations are cloned.

---

## Failure Modes
- **Memory exhaustion**: Chaperoning a highly-shared relation (1:many parent-to-related) on a large result set can cause OOM.
- **Unexpected identity breaks**: Code that relies on identity map reference equality (`===`) will break with chaperoned relations.
- **Cloned model events**: Mutating a chaperoned clone does not fire model events — no side effects.
- **Shallow clone leakage**: If the related model has `$casts` to objects (e.g., `collection` or `object`), those are still shared by reference.

---

## Ecosystem Usage
Laravel's own import/export commands use chaperoning for data processing. Spatie's `laravel-csv-import` and similar packages recommend chaperoning for batch operations. Enterprise applications with complex batch workflows use it to prevent cross-row contamination during processing pipelines.

---

## Related Knowledge Units
### Prerequisites
- Eager loading mechanics (identity map, relation hydration)
- Model `$exists`, `$relation` properties
- Object reference vs value semantics in PHP

### Related Topics
- inverse-relations (complementary in-memory consistency feature)
- Eloquent identity map internals
- Model cloning and replication

### Advanced Follow-up Topics
- Deep clone strategies for fully isolated models
- Memory profiling for chaperoned vs non-chaperoned loading
- Alternative: immutable model pattern for batch processing

---

## Research Notes
### Source Analysis
`Illuminate\Database\Eloquent\Relations\Concerns\SupportsInverseRelations::chaperone()` at `src/Illuminate/Database/Eloquent/Relations/Concerns/SupportsInverseRelations.php`. The cloning occurs in the `match()` method of the relation class.
### Key Insight
Chaperone is a deliberate acceptance of the space-over-correctness tradeoff. It solves a class of bugs (cross-parent mutation leakage) that are notoriously hard to debug because they manifest as seemingly random data corruption in long-running processes.
### Version-Specific Notes
- Laravel 11.0+: `chaperone()` introduced alongside `SupportsInverseRelations` trait.
- Laravel 11.5+: Optimized to only clone when the same related model instance would be reused, reducing overhead for unique relations.
- Laravel 10 and earlier: No chaperone support — identity map always shares instances.
