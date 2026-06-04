# Domain-Specific Query Methods — ECC

## Metadata
- **Domain:** Laravel Eloquent & Domain Modeling
- **Subdomain:** Query Strategy
- **Knowledge Unit:** Domain-Specific Query Methods
- **ECC Version:** 1.0

## Overview
Domain-Specific Query Methods (DSQMs) are named methods on custom Eloquent builders that encode business-domain query logic. Unlike generic scopes (which tend to be technical — `whereActive`, `whereVerified`), DSQMs use the language of the domain — `published()`, `recent()`, `inStock()`, `eligibleForPromotion()`. They transform Eloquent queries from technical constraints into readable domain expressions, forming a rich domain-specific language for database queries.

## Core Concepts
- Domain Language: method names use business terms, not database terms
- Composite Logic: a single method encapsulates multiple constraints representing a domain concept
- Ubiquitous Language: DSQMs match terminology used by domain experts and stakeholders
- Encapsulation: business logic for "what does it mean to be published?" lives in one method
- Custom Builder Implementation: DSQMs are methods on a custom builder extending `Eloquent\Builder`

## When To Use
- Models with rich domain concepts (e.g., `published`, `archived`, `eligible`, `featured`)
- Teams practicing Domain-Driven Design or ubiquitous language
- Queries that need to express business rules, not just data filters
- Codebase where query readability and self-documentation are priorities
- When the same business concept is queried in multiple places

## When NOT To Use
- Do NOT use DSQMs for purely technical filters (e.g., `whereStatus('active')`) — use scopes
- Do NOT create DSQMs for one-off queries used in a single controller
- Do NOT use DSQMs when the business concept is unclear or likely to change frequently
- Do NOT use DSQMs to hide simple `WHERE` clauses behind verbose method names
- Do NOT create DSQMs on models that don't have a custom builder

## Best Practices (WHY)
- Name DSQMs using your business domain's vocabulary, not database column names
- Keep methods focused on a single domain concept; compose multiple DSQMs at the call site
- Document DSQMs with `@method` annotations on the model class for IDE discoverability
- Test DSQMs at the SQL level — assert the generated SQL is correct
- Maintain naming consistency across models: if `User::subscribed()` exists, `Team::subscribed()` should mean the same thing
- Provide negation methods: if `published()` exists, provide `unpublished()` too
- Review DSQMs periodically as business rules evolve

## Architecture Guidelines
- Place DSQMs in custom builder classes (`app/Models/Builders/`), not on the model
- Establish naming conventions: verb-based (`published()`), temporal (`recent()`), prepositional (`byUser()`)
- Use fine-grained methods that compose well over coarse-grained monolithic methods
- Document complex DSQMs with comments explaining the business rule
- Keep a glossary of DSQM terms and their definitions for the team

## Performance
- DSQMs compile to the same SQL as inline constraints — no inherent performance cost
- Composite methods should be profiled: a `popular()` method with a subquery may be slower than expected
- DSQMs that add JOINs affect every caller; consider lazy evaluation or optional parameters
- Use `->explain()` on DSQM-generated SQL to ensure index usage

## Security
- DSQMs should not suppress global scopes without explicit naming (e.g., `includeUnpublished()`)
- Avoid DSQMs that accept SQL fragments or unvalidated column names
- Document any DSQM that bypasses security constraints
- Ensure DSQMs don't expose data the caller shouldn't access
- Parameterized DSQMs should validate input types and ranges

## Common Mistakes
- Technical naming: naming DSQMs after database columns (`whereStatusPublished`) instead of domain concepts (`published()`)
- Over-composition: a DSQM that calls 5 other DSQMs — hard to debug and test
- Missing negation methods: `published()` exists but `unpublished()` doesn't
- Side effects: DSQMs that log, email, or modify state — they should only build queries
- Inconsistent language: `posted()` on Post, `published()` on Article, `live()` on Page for the same concept
- Domain rule divergence: the DSQM says one thing but inline queries bypass it with different logic

## Anti-Patterns
- **Technical Naming**: `whereStatusPublished()` instead of `published()` — defeats the purpose
- **Hidden Complexity**: a DSQM named `popular()` that adds a 50-line subquery without documentation
- **God Method**: a single DSQM with 5 parameters covering every possible variation
- **Bypassed Rule**: developers writing inline `where('published_at', '<=', now())` instead of calling `published()`
- **Domain Drift**: the definition of `eligibleForPromotion()` changes but old callers expect the old behavior
- **Inconsistent Domain**: `User::isActive()` returns one thing, `Order::isActive()` returns semantically different

## Examples
```php
// Blog domain
class PostBuilder extends Builder
{
    public function published(): static
    {
        return $this->whereNotNull('published_at')
            ->where('published_at', '<=', now())
            ->where('status', 'published');
    }

    public function drafted(): static
    {
        return $this->where('status', 'draft');
    }

    public function featured(): static
    {
        return $this->where('is_featured', true)->orderBy('published_at', 'desc');
    }

    public function byAuthor(User $author): static
    {
        return $this->where('author_id', $author->id);
    }

    public function trending(int $days = 7): static
    {
        return $this->where('views', '>', 1000)
            ->where('published_at', '>=', now()->subDays($days))
            ->orderBy('views', 'desc');
    }
}

// E-commerce domain
class ProductBuilder extends Builder
{
    public function inStock(): static
    {
        return $this->where('quantity', '>', 0)
            ->where('available', true);
    }

    public function backordered(): static
    {
        return $this->where('quantity', '<=', 0)
            ->where('restock_date', '>=', now());
    }

    public function eligibleForDiscount(): static
    {
        return $this->where('discountable', true)
            ->where('price', '>', 0)
            ->where(function ($q) {
                $q->whereNull('sale_ends_at')
                  ->orWhere('sale_ends_at', '>', now());
            });
    }
}

// Usage
$posts = Post::query()
    ->published()
    ->featured()
    ->byAuthor($author)
    ->trending()
    ->get();
```

## Related Topics
- Custom Builder Pattern — the implementation mechanism for DSQMs
- Local Scopes — DSQMs evolve from scopes with domain-specific naming
- Decision Framework — choosing DSQMs vs scopes vs query objects
- Conditional Clauses — combining DSQMs with `when()` for conditional domain logic

## AI Agent Notes
- Name DSQMs using business domain vocabulary, not database column names
- Keep methods focused on one domain concept; compose at the call site
- Always provide negation methods for state-based DSQMs
- Document DSQMs with `@method` annotations on the model
- Use custom builder classes (`Builders/` directory) for DSQMs
- Test DSQMs at both the SQL level and the business rule level

## Verification
- [ ] DSQMs named with domain vocabulary, not database column names
- [ ] Custom builder registered via `HasBuilder` trait or `newEloquentBuilder()` override
- [ ] Negation methods exist for state-based DSQMs
- [ ] `@method` annotations on model class for IDE support
- [ ] DSQMs tested at SQL level and business rule level
- [ ] No side effects (logging, API calls) in DSQM methods
- [ ] Domain terminology consistent across models
- [ ] Inline queries don't bypass DSQMs with different logic for the same concept
