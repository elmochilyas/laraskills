# Skill: Apply Resource Naming Conventions

## Purpose
Design consistent URI paths using plural kebab-case nouns for collections, singular for parameters, limited nesting (2-3 levels), query parameters for filtering, and no verbs in paths.

## When To Use
- Every API endpoint URI design
- Route registration in route files
- API style guide documentation

## When NOT To Use
- Singleton resources of which there is only one per context (`/profile`, `/settings`)

## Prerequisites
- REST resource model understanding
- Laravel route registration

## Inputs
- Resource list with singular and plural forms
- Relationship hierarchy definitions

## Workflow
1. Use plural kebab-case nouns for all collection endpoints: `/users`, `/order-items`, `/user-profiles`
2. Use singular for route parameters: `/users/{user}`, `/orders/{order}`
3. Limit nesting to 2-3 levels maximum — use shallow references with global identifiers beyond that
4. Never include verbs in URI paths — HTTP methods encode actions
5. Express filtering, sorting, and includes via query parameters: `?filter[status]=active&sort=-created_at`
6. Standardize on one identifier type across the API (UUID, auto-increment, or slug)
7. Use route model binding with custom keys for non-ID identifiers: `{post:slug}`
8. Handle irregular plurals explicitly with `->parameters(['series' => 'series'])`
9. Use singleton resource names for single-instance resources: `/profile`, `/settings`

## Validation Checklist
- [ ] All collection endpoints use plural nouns
- [ ] All URI segments use kebab-case consistently
- [ ] No verbs in URI paths
- [ ] Nesting does not exceed 3 levels
- [ ] Filtering/sorting via query parameters, not path segments
- [ ] Singleton resources use singular names
- [ ] Identifier type is consistent across all resources
- [ ] Irregular plurals handled with explicit `parameters()`
- [ ] Route model binding used for custom keys
- [ ] No `create` or `edit` routes in API

## Common Failures
- Inconsistent pluralization — some plural, some singular for collections
- Over-nesting — mapping DB foreign key hierarchy directly to URLs (4+ levels)
- Verbs in URI paths — `/users/getActiveUsers` when method already conveys action
- Mixed casing — kebab-case AND snake_case AND camelCase in same API
- Using database names as resource names — exposes implementation details
- Auto-increment in public URLs revealing user count

## Decision Points
- Identifier type — UUID for public APIs, auto-increment for internal, slugs for SEO
- Nesting depth — 2 levels standard, 3 maximum with justification
- kebab-case vs snake_case — kebab is industry standard, snake is Laravel convention

## Performance Considerations
- URI length >2048 chars may be truncated by proxies — keep paths short
- Route model binding adds one query per nesting level — shallow nesting reduces queries
- Case-insensitive URI matching — enforce lowercase to prevent cache splits

## Security Considerations
- Never expose database column names as resource names
- Auto-increment IDs expose record count — use UUIDs for public APIs
- Slug-based resources can change — redirect old slugs or maintain history

## Related Rules
- Use Plural Nouns For Collection Endpoints
- Use kebab-case For All URI Path Segments
- Limit Nesting To 2-3 Levels Maximum
- Never Use Verbs In URI Paths
- Standardize On One Identifier Type Across The API
- Use Route Model Binding With Custom Keys For Non-ID Resources
- Use Query Parameters For Filtering, Sorting, And Includes
- Handle Irregular Pluralization Explicitly
- Avoid Inconsistent Pluralization Across Resources

## Related Skills
- URL Structure Design — for overall URI architecture
- HTTP Method Semantics — for verb usage in endpoints
- Resource vs Action Orientation — for resource design philosophy

## Success Criteria
- Clients can predict 80% of endpoint URLs just from resource names
- All URIs use consistent plural kebab-case with no verbs
- Nesting never exceeds 3 levels with clear parent-child semantics
- Filtering and sorting use consistent query parameter conventions
- Identifier type is uniform across all resources
