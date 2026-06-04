# Anti-Patterns: Domain-Specific Query Methods

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Domain-Specific Query Methods

## Anti-Patterns

### Technical Naming
Naming DSQMs after database column names instead of business domain concepts — e.g., `whereStatusPublished()` instead of `published()`. This defeats the purpose of DSQMs by revealing database implementation rather than business intent.

**Problem:** Code that database experts but not domain experts can read; missing the purpose of DSQMs; inconsistency between domain language and codebase terminology.

**Solution:** Name DSQMs using the vocabulary of the business domain. Collaborate with domain experts to find the right terms.

### Hidden Complexity
A DSQM named `popular()` that adds a 50-line subquery without documentation. Developers cannot understand what the method does without reading the full implementation.

**Problem:** Surprising query behavior; difficulty understanding performance implications; hidden JOINs or expensive subqueries.

**Solution:** Document complex DSQMs with comments explaining the business rule and SQL structure. Keep methods focused on single concepts.

### God Method
A single DSQM with 5 parameters covering every possible variation of a query. This creates a monolithic method that is impossible to test, document, or compose.

**Problem:** Exponential testing requirements; difficulty understanding what each parameter does at the call site; reduced reusability.

**Solution:** Design each DSQM to express exactly one domain concept. Compose multiple DSQMs at the call site for complex queries.

### Bypassed Rule
Developers writing inline `where('published_at', '<=', now())` instead of calling the `published()` DSQM. This creates drift between the canonical definition and ad-hoc implementations.

**Problem:** Inconsistent query behavior; changes to the `published()` definition don't affect inline copies; bugs in ad-hoc reimplementations.

**Solution:** Make DSQMs the only way to query domain concepts. Use code review and static analysis to prevent inline bypasses. Add `@method` annotations for IDE discoverability.

### Domain Drift
The definition of `eligibleForPromotion()` changes over time but old callers expect the old behavior. Changes to the DSQM silently affect all callers.

**Problem:** Unexpected behavior changes in unrelated code paths; callers assuming one definition getting another.

**Solution:** Review DSQMs periodically as business rules evolve. Document breaking changes in DSQMs. Test DSQM behavior explicitly.

### Inconsistent Domain
`User::isActive()` returns one thing while `Order::isActive()` returns semantically different results. Inconsistent naming across models for the same domain concept defeats the purpose of a domain-specific language.

**Problem:** Developer confusion; DSQMs underutilized because they're hard to discover; increased cognitive load when switching between models.

**Solution:** Use the same DSQM name across all models when the domain concept is semantically identical. Use distinct names for genuinely different semantics.
