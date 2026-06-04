# Skill: Include Related Resources via Query Parameters

## Purpose
Eager-load relationships via `?include=user,comments.author` parameter with whitelist validation, dot notation for nested includes, and 422 for unrecognized includes.

## When To Use
- API endpoints where clients need related data
- Reducing N+1 requests for related resources
- Public APIs with diverse consumer needs

## When NOT To Use
- Internal endpoints where all needed relations are already loaded
- Write-heavy endpoints — include is for reads only

## Prerequisites
- Eloquent eager loading
- Relationship definitions

## Inputs
- Whitelist of includable relationships
- Resource definitions

## Workflow
1. Define whitelist of includable relationships per model — never expose all relationships
2. Parse include parameter as comma-separated list with dot notation for nested: `include=user,comments.author`
3. Validate each include against whitelist — reject unknown includes with 422
4. Apply eager loading: `Model::query()->with($validatedIncludes)->get()`
5. Use API resources for each included relationship — transform to match envelope standard
6. Return 422 Unprocessable Entity for unrecognized include keys with `available_includes` in error body
7. Document all includable relationships per endpoint
8. Limit nested include depth to 2 levels max — deeper nesting indicates API design issue
9. Monitor include-heavy requests — log endpoints requesting >3 includes for optimization

## Validation Checklist
- [ ] Includable relationships whitelisted per model
- [ ] Include parameter parsed with dot notation for nested
- [ ] Unknown includes return 422 with available list
- [ ] Eager loading applied via `with()` — no N+1 queries
- [ ] Included relationships transformed via API resources
- [ ] Nested include depth limited to 2 levels
- [ ] Documentation lists all includable relationships
- [ ] Include-heavy request patterns logged for monitoring

## Common Failures
- No whitelist — client can include any relationship including sensitive/expensive ones
- Circular includes — `user.posts.user` infinitely recursing
- N+1 despite include — using `load()` instead of `with()` for include parameter
- Missing resource transformation — raw Eloquent models returned in included data
- Silent ignore of unknown includes — client thinks they got data they didn't

## Decision Points
- Depth limit — 2 levels for public, 3 for internal with justification
- Include vs default eager load — include for optional, `with()` for required relations
- Always include vs whitelist request — whitelist for security, always-include for performance

## Performance Considerations
- Each include adds a JOIN or extra query — 3+ includes may need query optimization
- Nested includes multiply query count: `include=user,comments.author` = 3 queries
- Include depth of 2 means max 3 queries per endpoint — acceptable
- Consider `Preload` over `with` for memory-constrained environments

## Security Considerations
- Whitelist prevents exposing internal/private relationships
- Never include relationships that expose sensitive data (password_resets, personal_access_tokens)
- Depth limit prevents relationship traversal attacks
- Rate-limit include-heavy requests — each include adds query load

## Related Rules
- Define Includable Relationship Whitelist
- Validate Include Parameters — Unknown Returns 422
- Use Eager Loading with with()
- Limit Nested Include Depth to 2 Levels
- Document Includable Relationships Per Endpoint
- Monitor Include-Heavy Request Patterns

## Related Skills
- Query Parameter Filtering — for filter syntax
- Resource Eager Loading — for eager loading patterns
- Resource API Design — for resource transformation

## Success Criteria
- Clients request related data in a single request via include parameter
- Unknown includes return 422 with available options
- Eager loading prevents N+1 queries for included relations
- Nested includes work correctly up to 2 levels
- Include documentation matches actual behavior
