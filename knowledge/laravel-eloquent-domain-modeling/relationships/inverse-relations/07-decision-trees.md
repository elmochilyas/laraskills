## SupportsInverseRelations Trait vs Manual Sync

Choosing between using Laravel 11+'s `SupportsInverseRelations` trait for automatic in-memory relationship consistency and manually syncing relationship state.

---

## Decision Context

When a relationship is written (associate, save, dissociate), the in-memory state of the inverse side may become stale. You must decide whether to use the automatic trait or manually manage consistency.

---

## Decision Criteria

* Laravel version (11+ required for built-in trait)
* whether the inverse relationship is accessed in the same request after the write
* whether the application is long-running (queue, CLI, Livewire) vs short request
* whether the inverse side is a BelongsToMany or polymorphic (unsupported)

---

## Decision Tree

Maintaining in-memory relationship consistency after writes?

↓

Is the project on Laravel 11+?

NO → Manual sync (reload relations or set manually)

YES → Is the relationship type BelongsToMany or polymorphic?

    YES → Unsupported by inverse trait — manual sync required

    NO → Is the inverse side declared with a conventional name?

        YES → Add `use SupportsInverseRelations` to both parent sides — convention handles it

        NO → Add `use SupportsInverseRelations` + `->inverse('name')` explicitly

        Is the application short-lived (typical web request)?

        YES → Inverse trait is optional but recommended for correctness

        NO → Inverse trait is strongly recommended (accumulates stale state otherwise)

---

## Rationale

The trait automatically calls `setRelation()` on the inverse side, keeping in-memory state consistent. Without it, `$user->posts` may be stale after `$post->user()->associate($user)`. The trait has negligible overhead.

---

## Recommended Default

**Default:** Add `SupportsInverseRelations` to both sides of every relationship in Laravel 11+
**Reason:** Low overhead, prevents subtle in-memory inconsistency bugs, especially in long-running processes

---

## Risks Of Wrong Choice

Not using the trait causes stale relationship state — `$user->posts` doesn't show newly associated posts; using it without `inverse()` when convention is wrong silently does nothing.

---

## Related Rules

- Both sides need the trait for full bidirectional sync (from inverse-relations standardized knowledge)

---

## Related Skills

- SupportsInverseRelations trait usage (relationships/06-skills.md)
- Explicit `->inverse()` declaration (relationships/06-skills.md)
