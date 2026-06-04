# Decomposition: Domain-Specific Query Methods

## Knowledge Unit Breakdown

### 1. Domain Language in Queries
- 1.1 Ubiquitous language principles
- 1.2 Translating business terms to method names
- 1.3 Technical vs domain naming
- 1.4 Consistency across models

### 2. Method Types
- 2.1 State-based methods (published, archived, pending, draft)
- 2.2 Temporal methods (recent, expired, createdThisMonth)
- 2.3 Relationship methods (byUser, inTeam, ownedBy)
- 2.4 Aggregate methods (popular, trending, mostViewed)
- 2.5 Composite domain methods (eligibleForX, requiresY)
- 2.6 Negation methods (unpublished, inactive)

### 3. Implementation on Custom Builder
- 3.1 DSQM method signature pattern
- 3.2 Internal delegation to builder methods
- 3.3 Multiple constraint composition
- 3.4 Parameterized DSQMs
- 3.5 Return `: static` for chaining

### 4. Composition Patterns
- 4.1 Chaining DSQMs: `published()->recent()->popular()`
- 4.2 DSQMs with standard methods: `published()->where('featured', true)`
- 4.3 DSQMs with conditional clauses: `->when($draft, fn($q) => $q->draft())`
- 4.4 DSQMs calling other DSQMs (internal composition)

### 5. Naming Conventions
- 5.1 Verb-based: `published()`, `archived()`
- 5.2 Adjective-based: `recent()`, `popular()`
- 5.3 Prepositional: `byUser()`, `fromTeam()`, `inCategory()`
- 5.4 Boolean prefix: `isVerified()`, `hasSubscription()`
- 5.5 Team conventions and consistency rules

### 6. Granularity Decisions
- 6.1 Fine-grained vs coarse-grained methods
- 6.2 Single constraint vs multi-constraint methods
- 6.3 Method composition at call site vs internal composition
- 6.4 When to split or merge methods

### 7. Testing DSQMs
- 7.1 SQL assertion testing
- 7.2 Business rule testing (with database)
- 7.3 Testing composite DSQMs
- 7.4 Testing edge cases (null values, boundary dates)
- 7.5 Regression testing for changing business rules

### 8. Documentation and Discovery
- 8.1 `@method` annotations on model
- 8.2 Builder class docblocks
- 8.3 IDE plugin integration
- 8.4 README or ADR documentation

### 9. Domain Rule Management
- 9.1 Single source of truth principle
- 9.2 Preventing inline rule duplication
- 9.3 Code review for domain queries
- 9.4 Evolving domain rules with DSQMs

### 10. Real-World Examples
- 10.1 Blog domain: published(), featured(), trending(), byAuthor()
- 10.2 E-commerce: inStock(), available(), backordered(), eligibleForDiscount()
- 10.3 SaaS: active(), trialing(), cancelled(), pastDue(), onGracePeriod()
- 10.4 Content management: scheduled(), expired(), needsReview(), approved()
---

## Success Criteria

This decomposition is complete when:

✓ No Knowledge Unit is overloaded

✓ No major concept is missing

✓ Boundaries are clear

✓ Future phases can operate on individual units

✓ The structure can scale without reorganization