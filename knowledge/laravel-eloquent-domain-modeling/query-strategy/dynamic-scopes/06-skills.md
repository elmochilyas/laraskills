# Skill: Implement Dynamic Scopes with Whitelisted Dispatch

## Purpose
Apply Eloquent scopes at runtime based on request parameters or dynamic conditions using a whitelisted dispatch mechanism that prevents arbitrary method invocation.

## When To Use
- Generic filter systems that apply scopes from request parameters
- Role-based queries where admin vs regular users get different scopes
- Feature-flag-aware query building
- Admin config panels where scopes are selected dynamically
- API packages that map query string parameters to model scopes

## When NOT To Use
- Business-logic-specific queries — explicit chaining is clearer
- Dynamic scope names from user input without a whitelist
- Fixed set of filters known at build time
- Parameterized scopes with 5+ parameters — extract to query objects
- Code needing static analysis or IDE navigation

## Prerequisites
- Local scopes fundamentals
- Understanding of PHP dynamic method dispatch
- Security awareness of arbitrary method invocation risks

## Inputs
- Whitelist of allowed scope names
- Runtime parameters (request input, user role, feature flags)
- Query builder instance

## Workflow
1. Define a whitelist array mapping parameter names to scope method names
2. Validate incoming scope names against the whitelist — reject unknown names
3. Validate and sanitize all user-provided values before passing to parameterized scopes
4. Dispatch dynamically: `$query->{$whitelist[$scopeName]}($value)`
5. Use explicit scope chaining for business logic queries; reserve dynamic dispatch for infrastructure code
6. Log which dynamic scopes are applied for auditing and debugging
7. Combine with `when()` for conditional dynamic application

## Validation Checklist
- [ ] Dynamic scope names from user input are validated against a whitelist
- [ ] Parameterized scopes have focused parameters (< 3)
- [ ] No `method_exists()` calls without a whitelist for dynamic dispatch
- [ ] Dynamic scopes documented with parameter types
- [ ] Scope parameters sanitized and validated before use
- [ ] Auditing/logging in place for dynamic scope application in security contexts
- [ ] Unknown scope names rejected with clear error messages

## Common Failures
- Calling non-existent scopes dynamically — `User::{$userInput}()` can call ANY public method
- Forgetting scope prefix: `$scope = 'scopeActive'` should be `$scope = 'active'`
- Over-parameterization: single scope with 8 parameters — code smell
- Duplicate constraints: applying a dynamic scope that duplicates an explicit constraint
- Missing default parameter values for parameterized scopes

## Decision Points
- Dynamic dispatch vs explicit chaining: use dynamic dispatch for generic filter systems and infrastructure code; use explicit chaining for business logic
- Whitelist approach: always use an explicit whitelist array — never pass user input directly as a method name

## Performance Considerations
- Dynamic dispatch has negligible overhead (method lookup + call)
- Parameterized scopes cost no more than any other query constraint
- Loop-based dynamic application is proportional to the number of filters (microseconds per filter)
- Caching the scope registry can skip reflection on every request

## Security Considerations
- CRITICAL: whitelist scope names from user input — never allow arbitrary method calls
- Validate and sanitize all user-provided values passed to parameterized scopes
- Dynamic scope dispatch should not call non-scope methods (use the whitelist)
- Audit dynamic scope application in security-sensitive contexts
- Reject unknown scope names with a clear error message

## Related Rules
- Always Whitelist Dynamic Scope Names from User Input (query-strategy/dynamic-scopes)
- Limit Parameterized Scopes to 3 Parameters Maximum (query-strategy/dynamic-scopes)
- Explicitly Chain Scopes for Business-Logic Queries (query-strategy/dynamic-scopes)
- Validate Scope Parameters Before Passing Them to Parameterized Scopes (query-strategy/dynamic-scopes)
- Reject Unknown Scope Names with a Clear Error Message (query-strategy/dynamic-scopes)
- Avoid Dynamic Dispatch for Code Requiring Static Analysis (query-strategy/dynamic-scopes)

## Related Skills
- Implement Local Scopes for Reusable Constraints
- Compose Conditional Query Chains with when()
- Implement Domain-Specific Query Methods on Custom Builders

## Success Criteria
- Dynamic scope dispatch uses whitelist — no arbitrary method invocation
- User input validated against whitelist before dispatch
- Unknown scope names rejected with clear errors
- Business logic uses explicit chaining; infrastructure uses dynamic dispatch
- All dynamic scope applications logged for audit
