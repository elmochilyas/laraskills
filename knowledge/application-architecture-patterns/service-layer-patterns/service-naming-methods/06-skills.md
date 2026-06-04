# Skill: Name Service Classes and Methods with Business Language

## Purpose
Name service classes using `{Domain}Service` convention and methods using business language (not CRUD terminology). Maintain one level of abstraction, avoid generic suffixes, and keep methods under 20-30 per service.

## When To Use
- Always — naming conventions must be consistent across the codebase

## When NOT To Use
- Prototype-stage where naming consistency isn't a priority

## Prerequisites
- Understanding of domain entities and boundaries
- Team convention documentation

## Inputs
- List of domain entities
- Business language glossary

## Workflow
1. **Name service classes using `{Domain}Service` convention.** Use entity-based names for primary services (`UserService`, `OrderService`) and domain-based names for cross-entity services (`BillingService`, `AuthService`).

2. **Name methods using business language.** If the business says "register a user," the method is `register()`. If they say "cancel order," it's `cancelOrder()`. Avoid CRUD terms like `insert()`, `updateStatus()`, `getAll()`.

3. **Use consistent method prefix conventions.** Use `create`/`update`/`delete` for CRUD, `process`/`handle`/`execute` for workflows, `find`/`search`/`get` for queries.

4. **Maintain one level of abstraction.** Service methods should call other services, actions, and repositories — not low-level `DB::table()` queries. Mixed abstraction levels make methods hard to read.

5. **Avoid generic suffixes.** Never use `Manager`, `Helper`, `Utils`, or `Handler` for service classes. These don't communicate architectural role. `UserService` communicates clearly.

6. **Keep methods under 20-30 per service.** A service with 30+ methods is doing too much. Split by domain or extract actions.

7. **Methods must never return HTTP responses.** Return data only — models, DTOs, collections, or primitives. Response formatting belongs in controllers.

## Validation Checklist
- [ ] Service names use `{Domain}Service` convention
- [ ] Method names use business language (not CRUD)
- [ ] Method prefixes are consistent (create/process/find etc.)
- [ ] Methods maintain one level of abstraction
- [ ] No `Manager`/`Helper`/`Utils` suffixes used
- [ ] No service has 30+ methods
- [ ] No service method returns HTTP response

## Common Failures
- **CRUD-named methods.** `createUser()`, `updateUser()`, `deleteUser()` — hides business intent.
- **Method returning response.** `register(Request $request): JsonResponse` — service coupled to HTTP.
- **Too many methods.** 30+ methods on a single service — god service.
- **Generic suffixes.** `UserManager`, `OrderHelper`, `PaymentUtils` — don't communicate role.

## Decision Points
- **Entity-based vs Domain-based naming?** Entity-based (`UserService`) for primary operations; Domain-based (`BillingService`) for cross-entity services.

## Performance Considerations
- No performance impact from naming conventions.

## Security Considerations
- No implications. Naming is structural.

## Related Rules
- Rule: Business Language for Method Names (SLP-07/05-rules.md)
- Rule: One Level of Abstraction (SLP-07/05-rules.md)
- Rule: Avoid Generic Suffixes (SLP-07/05-rules.md)
- Rule: Keep Methods Under 20-30 (SLP-07/05-rules.md)
- Rule: Domain Prefix Naming (SLP-07/05-rules.md)
- Rule: No HTTP Responses (SLP-07/05-rules.md)
- Rule: Consistent Method Prefixes (SLP-07/05-rules.md)

## Related Skills
- Name Action Classes with Verb-Noun Conventions (SLP-08/06-skills.md)
- Design Service Classes (SLP-01/06-skills.md)
- Thin Controllers (SLP-03/06-skills.md)

## Success Criteria
- All service classes use `{Domain}Service` naming consistently.
- Method names reflect business language, not CRUD terminology.
- No service has 30+ methods or uses generic suffixes.
- Methods maintain one abstraction level and never return HTTP responses.
