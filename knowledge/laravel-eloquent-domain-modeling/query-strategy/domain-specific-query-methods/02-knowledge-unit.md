# Domain-Specific Query Methods

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Last Updated:** 2026-06-02

## Executive Summary
Domain-Specific Query Methods (DSQMs) are named methods on custom Eloquent builders that encode business-domain query logic. Unlike generic scopes (which tend to be technical — `whereActive`, `whereVerified`), DSQMs use the language of the domain — `published()`, `recent()`, `available()`, `inStock()`, `eligibleForPromotion()`. They transform Eloquent queries from a series of technical constraints into readable domain expressions. DSQMs are the culmination of the query-strategy toolkit: they combine builder fundamentals, scopes, conditional clauses, and the custom builder pattern into a rich domain-specific language for database queries.

## Core Concepts
- **Domain Language** — method names use business terms, not database terms: `subscribed()` not `whereSubscriptionStatus('active')`
- **Composite Logic** — a single method can encapsulate multiple constraints that together represent a domain concept
- **Ubiquitous Language** — DSQMs should match the terminology used by domain experts, product managers, and stakeholders
- **Encapsulation** — business logic for "what does it mean to be published?" lives in one method, not scattered across controllers
- **Readability** — `Post::published()->recent()->get()` reads as an English sentence

## Mental Models
- **Domain Vocabulary** — DSQMs are the vocabulary of your business domain expressed as query methods
- **Named Domain Rules** — each method encodes a named business rule: "A post is published when it has `published_at` in the past AND `status = 'published'` AND is not soft-deleted"
- **Single Source of Truth** — the DSQM is the single source of truth for the domain concept; any code that needs "published posts" calls the same method
- **Query DSL** — together, DSQMs form a domain-specific language for querying your data; the language is specific to your business

## Internal Mechanics
DSQMs are implemented as methods on a custom builder. They use standard builder methods internally but present a domain-named interface:

```php
class PostBuilder extends Builder
{
    public function published(): static
    {
        return $this->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where('status', 'published');
    }
    
    public function recent(): static
    {
        return $this->where('created_at', '>=', now()->subDays(7))
            ->orderBy('created_at', 'desc');
    }
    
    public function byAuthor(User $author): static
    {
        return $this->where('author_id', $author->id);
    }
}
```

These methods are discovered through the custom builder pattern (via `HasBuilder` trait or `newEloquentBuilder()` override). They compose freely with each other and with standard builder methods.

## Patterns
- **State-Based Methods** — `published()`, `archived()`, `draft()`, `pending()` — reflect the state of records
- **Temporal Methods** — `recent()`, `expired()`, `createdThisMonth()`, `updatedSince($date)`
- **Relationship Methods** — `byUser($user)`, `inTeam($team)`, `withMinimumOrders($count)`
- **Aggregate Methods** — `popular()`, `trending()`, `mostViewed()`
- **Composite Domain Methods** — `eligibleForNewsletter()`, `requiresFollowUp()`, `readyForProcessing()`
- **Boolean/Negation Methods** — `unpublished()`, `inactive()`, `withoutSubscription()`

## Architectural Decisions
- **DSQMs vs Scopes** — DSQMs are the evolved form of scopes with domain-specific naming. In practice, DSQMs are implemented on custom builders, while scopes are on models. The naming philosophy is the key difference: domain terms vs technical descriptions.
- **Granularity** — fine-grained methods (`published()`, `scheduled()`) compose better than coarse-grained methods (`publishedOrScheduled()`). Prefer composition over monolithic methods.
- **Naming Consistency** — method names must be consistent across the domain. If one model has `posted()`, another shouldn't use `published()` for the same concept.

## Tradeoffs

| Benefit | Cost | Consequence |
|---|---|---|
| Self-documenting queries (reads like English) | Must maintain builder classes per model | Worthwhile for domains with complex query logic |
| Single source of truth for domain rules | Method proliferation if naming is too granular | Keep methods focused; compose in controllers |
| Encapsulation hides complex query logic | Developers must know the custom builder exists | Document available DSQMs via IDE @method annotations |
| Ubiquitous language alignment | Team must agree on domain terminology | Invest in domain modeling upfront |
|  |  |  |

## Performance Considerations
- DSQMs have no inherent performance cost — they compile to the same SQL as inline constraints
- Composite methods should be profiled: a method like `popular()` with a subquery may be slower than expected
- DSQMs that add JOINs affect every caller; consider lazy evaluation or optional parameters
- Use `->explain()` on DSQM-generated SQL to ensure index usage

## Production Considerations
- **Document every DSQM** — use `@method` annotations on the model class for IDE discoverability
- **Test DSQMs at the SQL level** — assert the generated SQL is correct (especially for composite methods)
- **Name consistently across models** — establish naming conventions for common concepts
- **Review DSQMs periodically** — domain rules change; `eligibleForPromotion()` may need updating when business rules change
- **Avoid DSQMs that accept SQL fragments** — DSQMs should encapsulate SQL, not expose it; use parameters for values, not clauses

## Common Mistakes
- **Technical naming** — naming DSQMs after database columns (`whereStatusPublished`) instead of domain concepts (`published()`)
- **Over-composition** — a DSQM that calls 5 other DSQMs is hard to debug; prefer flat methods that compose at the call site
- **Missing negation methods** — if `published()` exists, `unpublished()` should too; users will need the inverse
- **Side effects** — DSQMs should only build queries, not send emails, log events, or modify external state
- **Inconsistent domain language** — using `posted()` on Post, `published()` on Article, and `live()` on Page for the same concept

## Failure Modes
- **Domain rule divergence** — if `eligibleForPromotion()` is defined on the builder but another developer writes inline `where('promotion_eligible', true)` in a controller, the business rule has two sources of truth
- **Hidden complexity** — a DSQM that looks simple (`popular()`) but adds a 50-line subquery can surprise developers; document complexity
- **Domain concept drift** — the definition of `published()` changes over time, but old queries using it now return different results than intended
- **Cross-model inconsistency** — `Order::paid()` and `Invoice::paid()` use different logic for "paid", causing confusion

## Ecosystem Usage
- **Laravel Spark** — DSQMs for subscription states (`subscribed()`, `cancelled()`, `onTrial()`, `onGracePeriod()`)
- **Laravel Cashier** — DSQMs for billing states (`invoiced()`, `pastDue()`, `hasPaymentMethod()`)
- **Laravel Jetstream** — DSQMs for team membership (`currentTeam()`, `hasTeam()`, `ownsTeam()`)
- **Domain-Driven Design with Laravel** — practitioners consistently recommend DSQMs as the primary query interface for aggregates

## Related Knowledge Units

### Prerequisites
Custom Builder Pattern, Local Scopes, Builder Fundamentals

### Related Topics
Decision Framework, Hybrid Strategies, Conditional Clauses

### Advanced Follow-up Topics
Higher Order Messages, Performance Tradeoffs, Global Scope Suppression

## Research Notes
- **Source Analysis:** DSQMs are not a framework feature — they are a design pattern enabled by the Custom Builder Pattern. The domain-specific naming philosophy comes from Eric Evans' Domain-Driven Design concept of "ubiquitous language."
- **Key Insight:** DSQMs are the terminus of the query-strategy evolution: Builder Fundamentals → Scopes → Custom Builders → Domain-Specific Methods. They represent the most expressive way to construct queries in Eloquent.
- **Version-Specific Notes:** Laravel 10+ `HasBuilder` trait makes DSQMs easier to implement. The `@mixin` annotation on models provides IDE support. PHP 8.1+ `never` and `pure` return types can be used on DSQMs for static analysis. No framework-level changes — this is purely a design pattern.
