# Anti-Patterns: Chaperone

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Relationships — Aggregate Methods & Relationship Patterns
- **Knowledge Unit:** chaperone

## Anti-Patterns

### Chaperone on Every Relationship
Applying `chaperone()` to all relationships regardless of need. Chaperoning highly-shared relations (many parents pointing to the same related model) causes significant memory bloat.

**Problem:** Memory waste — 1,000 posts sharing one author produces 1,000 Author instances instead of 1.

**Solution:** Apply chaperone selectively only on relationships where mutation isolation matters.

### Expecting Deep Clone
Assuming chaperone fully isolates all nested state. Chaperone performs a shallow clone — primitive attributes are copied, but object-typed attributes (relations, casts) are still shared by reference.

**Problem:** Unexpected mutation leakage through shared object references.

**Solution:** Understand and document that chaperone provides shallow clone isolation only.

### Identity Map Reliance
Writing code that uses reference equality (`===`) comparisons with chaperoned instances. Since chaperone clones instances, `===` checks between related models of different parents fail.

**Problem:** Broken `===` comparisons, unexpected false negatives in identity checks.

**Solution:** Use primary key comparisons instead of reference equality when chaperone is active.

### Web Request Chaperone
Using chaperone in short-lived web requests where identity map sharing is desirable and harmless. The memory overhead is unnecessary for request-scoped operations.

**Problem:** Unnecessary memory bloat for no benefit in request-scoped code.

**Solution:** Reserve chaperone for CLI commands, queue workers, and import scripts — not web requests.

### Expecting Lazy Loading Chaperone
Assuming chaperone protects lazy-loaded relations. Chaperone only affects eager-loaded relations — lazy-loaded relations still share instances.

**Problem:** Mutation leakage through lazy-loaded relationships despite chaperone.

**Solution:** Always eager-load relationships that need chaperone protection.
