# Skill: Implement Domain-Specific Query Methods on Custom Builders

## Purpose
Create named methods on custom Eloquent builders that encode business-domain query logic using domain vocabulary, transforming Eloquent queries from technical constraints into readable domain expressions.

## When To Use
- Models with rich domain concepts (published, archived, eligible, featured)
- Teams practicing Domain-Driven Design or ubiquitous language
- Queries that need to express business rules, not just data filters
- Codebase where query readability and self-documentation are priorities
- When the same business concept is queried in multiple places

## When NOT To Use
- Purely technical filters (e.g., `whereStatus('active')`) — use scopes
- One-off queries used in a single controller
- Business concept is unclear or likely to change frequently
- Hiding simple `WHERE` clauses behind verbose method names
- Models without a custom builder

## Prerequisites
- Custom Builder Pattern implementation
- Understanding of the business domain vocabulary
- `HasBuilder` trait or `newEloquentBuilder()` override

## Inputs
- Business domain vocabulary terms from domain experts
- Custom builder class for the model
- Business rules defining each domain concept

## Workflow
1. Identify domain concepts that appear in queries (e.g., "published", "inStock", "subscribed")
2. Create methods on the custom builder named with domain vocabulary, not database column names
3. Keep each method focused on a single domain concept
4. Always provide negation methods for state-based DSQMs (e.g., `unpublished()` alongside `published()`)
5. Add `@method` annotations or `@mixin` on the model class for IDE discoverability
6. Maintain naming consistency across models for the same domain concept
7. Test DSQMs at the SQL level — assert generated SQL is correct
8. Never suppress global scopes inside a DSQM without explicit method naming

## Validation Checklist
- [ ] DSQMs named with domain vocabulary, not database column names
- [ ] Custom builder registered via `HasBuilder` trait or `newEloquentBuilder()` override
- [ ] Negation methods exist for state-based DSQMs
- [ ] `@method` annotations on model class for IDE support
- [ ] DSQMs tested at SQL level and business rule level
- [ ] No side effects (logging, API calls) in DSQM methods
- [ ] Domain terminology consistent across models
- [ ] Inline queries don't bypass DSQMs with different logic for the same concept

## Common Failures
- Technical naming: naming DSQMs after database columns instead of domain concepts
- Over-composition: a DSQM that calls 5 other DSQMs — hard to debug and test
- Missing negation methods: `published()` exists but `unpublished()` doesn't
- Side effects: DSQMs that log, email, or modify state
- Inconsistent language: `posted()` on Post, `published()` on Article, `live()` on Page for same concept

## Decision Points
- DSQM vs local scope: DSQMs are named with domain vocabulary and live on custom builders; scopes are more technical and live on the model
- `@mixin` vs `@method` annotations: prefer `@mixin` pointing to the builder class for maintainability; use `@method` when only specific methods should be exposed

## Performance Considerations
- DSQMs compile to the same SQL as inline constraints — no inherent performance cost
- Composite methods should be profiled: a `popular()` method with a subquery may be slower than expected
- DSQMs that add JOINs affect every caller — consider lazy evaluation or optional parameters
- Use `->explain()` on DSQM-generated SQL to ensure index usage

## Security Considerations
- DSQMs should not suppress global scopes without explicit naming (e.g., `includeUnpublished()`)
- Avoid DSQMs that accept SQL fragments or unvalidated column names
- Document any DSQM that bypasses security constraints

## Related Rules
- Name DSQMs Using Business Domain Vocabulary, Not Database Column Names (query-strategy/domain-specific-query-methods)
- Always Provide Negation Methods for State-Based DSQMs (query-strategy/domain-specific-query-methods)
- Keep DSQMs Focused on a Single Domain Concept (query-strategy/domain-specific-query-methods)
- Add @method Annotations on the Model Class for IDE Discoverability (query-strategy/domain-specific-query-methods)
- Maintain Naming Consistency Across Models for the Same Domain Concept (query-strategy/domain-specific-query-methods)
- DSQMs Must Not Suppress Global Scopes Without Explicit Method Names (query-strategy/domain-specific-query-methods)
- Test DSQMs at the SQL Level to Verify Generated Queries (query-strategy/domain-specific-query-methods)

## Related Skills
- Implement Custom Builder Pattern for Rich Query APIs
- Implement Local Scopes for Reusable Constraints
- Compose Conditional Query Chains with when()

## Success Criteria
- DSQMs use domain vocabulary understandable by non-technical stakeholders
- Negation methods exist for all state-based DSQMs
- IDE autocompletion works for all DSQMs
- DSQMs are tested at SQL level
- Domain terminology is consistent across all models
