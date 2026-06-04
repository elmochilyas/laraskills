# Skill: Organize Code by Layer Within Default Laravel Structure

## Purpose
Structure application code by technical role — controllers in `app/Http/Controllers/`, models in `app/Models/`, services in `app/Services/` — following the standard Laravel layer-based approach.

## When To Use
- Teams under 5 engineers
- Primarily CRUD applications with straightforward business rules
- Projects where most developers are Laravel-native and expect standard conventions
- Early-stage projects where domain boundaries are not yet clear

## When NOT To Use
- Applications with 3+ distinct business domains requiring isolation
- Teams of 10+ engineers needing clear ownership boundaries
- Codebases where `app/Services/` contains 30+ unrelated files
- When cross-domain confusion becomes frequent

## Prerequisites
- Laravel project with default structure established
- Understanding of MVC pattern
- Familiarity with constructor dependency injection

## Inputs
- Existing controller files containing business logic
- List of business operations performed by the application
- Current directory structure under `app/`

## Workflow
1. **Establish a delegation rule.** Define the team standard: all non-trivial business logic lives in a service class, never in a controller or model. This eliminates ambiguity — developers always know where business logic belongs.

2. **Add `app/Services/` when controllers grow beyond request handling.** Extract business logic from controllers into service classes. Controllers should only validate input (via Form Requests), call services, and return responses.

3. **Use sub-layer grouping within layers.** When a single layer directory exceeds 20-30 files, create subdirectories: `app/Http/Controllers/Api/`, `app/Http/Controllers/Web/`. This preserves discoverability while maintaining the layer-based paradigm.

4. **Keep models focused on Eloquent concerns only.** Limit models to data mapping, relationships, scopes, and accessors/mutators. Extract business logic to services or actions.

5. **Avoid catch-all directories.** Never create `app/Helpers/`, `app/Utilities/`, or `app/Common/`. Name directories by specific concern — catch-all directories become dumping grounds without clear ownership.

6. **Split services that handle multiple unrelated operations.** When a service handles operations for multiple unrelated entities (e.g., registration, password reset, billing, and notifications in `UserService`), split into focused services.

7. **Enforce layer boundaries via architecture tests.** Write Pest tests that prevent controllers from calling Eloquent models directly and prevent services from referencing HTTP concerns.

## Validation Checklist
- [ ] Controllers contain no business logic beyond HTTP orchestration
- [ ] Services do not wrap Model CRUD without adding business value
- [ ] All controllers consistently delegate to services (no inline business logic)
- [ ] No directory contains more than 30 unrelated files
- [ ] Architecture tests enforce layer boundaries
- [ ] No catch-all directories exist in `app/`
- [ ] Models are limited to Eloquent concerns only

## Common Failures
- **God Service accumulation**: Single service handling operations for multiple unrelated entities. Split by responsibility.
- **Elastic directory creep**: Adding catch-all directories like `app/Helpers/`. Name directories by specific concern.
- **Missing service extraction**: Keeping all logic in controllers despite growth. Extract to services incrementally.
- **Repository-wrapper service classes**: Service classes that wrap Model CRUD without adding business value.

## Decision Points
- **Service vs Action?** Use services for orchestration of multiple operations; use actions for single, isolated business operations.
- **Entity-oriented vs capability-oriented services?** Group by entity first; use capability-oriented services for cross-cutting concerns.

## Performance Considerations
- Layer-based organization has no direct performance cost.
- Large single-layer directories (100+ files) slow IDE file-tree operations.
- Service container resolution is unaffected by directory structure.

## Security Considerations
- Layer boundaries do not provide security isolation — any service can access any model.
- Ensure authentication and authorization logic stays in the appropriate layer.

## Related Rules
- Rule: Keep Controllers Free of Business Logic Beyond HTTP Orchestration (COS-02/05-rules.md)
- Rule: Extract Every Non-Trivial Business Operation to a Service Class (COS-02/05-rules.md)
- Rule: Avoid Catch-All Directories (COS-02/05-rules.md)
- Rule: Enforce Layer Boundaries via Architecture Tests (COS-02/05-rules.md)
- Rule: Split Services When They Handle Multiple Unrelated Operations (COS-02/05-rules.md)
- Rule: Never Create Repository-Wrapper Service Classes (COS-02/05-rules.md)
- Rule: Use Sub-Layer Grouping Within Large Layer Directories (COS-02/05-rules.md)
- Rule: Keep Models Focused on Eloquent Concerns Only (COS-02/05-rules.md)

## Related Skills
- Apply Laravel's Default Directory Structure for Small Teams (COS-01/06-skills.md)
- Organize Code by Domain Within Layer Directories (COS-07/06-skills.md)
- Design a Service Class (SLP-01/06-skills.md)

## Success Criteria
- Controllers are thin — they only validate input, delegate to services, and return responses.
- Services contain business logic and are organized by entity or capability.
- Architecture tests prevent layer violations.
- No catch-all directories exist.
