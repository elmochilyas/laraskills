# Metadata

**Domain:** Security & Identity Engineering
**Subdomain:** Authorization
**Knowledge Unit:** Gates (Closure-Based Authorization)
**Generated:** 2026-06-03

---

# Decision Inventory

| # | Decision | Context | Key Criteria |
|---|----------|---------|--------------|
| 1 | Gate vs Policy for New Authorization | Choosing between closure and class-based auth | architectural, maintainability |
| 2 | Gate::before Return Value Handling | Super-admin bypass semantics | security |
| 3 | Gate Registration Location | Where to define gates in the application | maintainability, architectural |

---

# Architecture-Level Decision Trees

---

## Gate vs Policy for New Authorization

---

## Decision Context

Whether to implement a new authorization check as a Gate (closure in service provider) or a Policy (dedicated class).

---

## Decision Criteria

* architectural
* maintainability

---

## Decision Tree

Is the authorization check specific to a single Eloquent model?
↓
YES → Policy (model-centric, CRUD methods, auto-discovered)
NO → Is this a simple boolean check (e.g., "can view admin dashboard")?
    YES → Gate (lightweight, single closure)
    NO → Does the check need dependency injection?
        YES → Policy (supports constructor DI via Laravel container)
        NO → Gate (closure receives user + optional arguments)

Is the check likely to grow in complexity?
↓
YES → Start with Policy (easier to extend later)
NO → Gate is sufficient

Is this a temporary/prototyping check?
↓
YES → Gate (quick to define and iterate)
NO → Policy (long-term maintainability)

---

## Rationale

Gates are simple closures for non-model actions. Policies are classes for model-specific CRUD authorization with auto-discovery and `authorizeResource()` support. Both use the same `$user->can()` checking mechanism. The choice is primarily about organization — gates for standalone actions, policies for model-centric logic.

---

## Recommended Default

**Default:** Gate for non-model actions (dashboards, exports, feature flags); Policy for any model-specific CRUD authorization
**Reason:** Gates provide the simplest possible authorization for standalone actions. Policies provide structured, model-specific authorization that scales with the application. Using both appropriately prevents either over-complicating simple checks or under-structuring complex ones.

---

## Risks Of Wrong Choice

- Policy for simple check: unnecessary class file, auto-discovery overhead, boilerplate
- Gate for complex model authorization: no authorizeResource, no structured methods, hard to test
- No authorization: any authenticated user can perform any action

---

## Related Rules

- Use Gate::before() for Super-Admin Bypass Only (05-rules.md)
- Check Gates Server-Side in Controllers, Not Only in Blade (05-rules.md)
- Name Gates With Action-Oriented Names, Not Roles (05-rules.md)

---

## Related Skills

- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)
- Create Model Policies for Resource-Based Authorization (06-skills.md)

---

## Gate::before Return Value Handling

---

## Decision Context

Correctly implementing `Gate::before()` return values — `true`, `null`, or `false` — for super-admin bypass.

---

## Decision Criteria

* security

---

## Decision Tree

Is the current user a super-admin?
↓
YES → Return `true` (allow all actions immediately)
NO → Return `null` (delegate to the specific Gate or Policy check)

Does the code return `false` anywhere in `before()`?
↓
YES → Remove `false` returns immediately (this blocks all non-super-admin users)
NO → Verify pattern: `if super-admin → true; else → (implicit|null)`

Is there logic after the super-admin check?
↓
YES → Move logic elsewhere (before() should only handle super-admin bypass)
NO → Pattern is correct

---

## Rationale

`Gate::before()` has strict return semantics: `true` = allow immediately, `null` = delegate to gate/policy, `false` = deny immediately. The most common bug is returning `false` for non-super-admin users, which denies ALL authorization for regular users. The closure should have no logic beyond the super-admin check.

---

## Recommended Default

**Default:** `Gate::before(fn (User $user) => $user->isSuperAdmin() ? true : null)`
**Reason:** This pattern correctly allows super-admins while delegating to normal authorization for all other users. The one-liner keeps the closure simple and prevents accidental `false` returns.

---

## Risks Of Wrong Choice

- Returning `false` for non-super-admins: all users denied access to everything
- Complex logic in `before()`: N+1 queries, unexpected bypass behaviors
- No super-admin bypass: super-admin users cannot access anything unless explicitly permitted by every gate/policy
- Multiple `before()` registrations: only the last one takes effect

---

## Related Rules

- Return true|null From Gate::before(), Never false (05-rules.md)
- Keep Gate::before() Logic Simple — Single Boolean Method Call (05-rules.md)
- Log Super-Admin Actions on Restricted Resources (05-rules.md)

---

## Related Skills

- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)
- Implement Super-Admin Bypass for Unrestricted Access (06-skills.md)

---

## Gate Registration Location

---

## Decision Context

Where to define gates: in `AppServiceProvider`, `AuthServiceProvider`, or a dedicated provider.

---

## Decision Criteria

* maintainability
* architectural

---

## Decision Tree

How many gates does the application have?
↓
1-3 → AppServiceProvider (simple, standard for small apps)
4-10 → AuthServiceProvider (dedicated authorization provider)
10+ → Auto-discovery gate class or dedicated GateServiceProvider

Are the gates organized by feature/module?
↓
YES → Create per-module gate files or service providers
NO → Single provider is fine

Are gates shared across multiple projects (package)?
↓
YES → Dedicated service provider in the package
NO → Application service provider

---

## Rationale

Gates are defined in service provider `boot()` methods. `AppServiceProvider` is standard for small applications. `AuthServiceProvider` is more organized for applications with both Gates and Policies. For large applications with many gates, extract to individual gate classes or per-module service providers.

---

## Recommended Default

**Default:** `AuthServiceProvider` for gates; extract to dedicated providers when exceeding 10 definitions
**Reason:** `AuthServiceProvider` follows the convention of organizing authorization-related code together. It's the natural home alongside Policy registration. Extraction becomes necessary when the provider exceeds maintainable size.

---

## Risks Of Wrong Choice

- All gates in AppServiceProvider: mixes authorization with general app bootstrap
- No dedicated provider: gates scattered across multiple files, hard to audit
- Extracting too early: unnecessary abstraction for 2-3 gates
- Not extracting when needed: AuthServiceProvider becomes hundreds of lines

---

## Related Rules

- Check Gates Server-Side in Controllers, Not Only in Blade (05-rules.md)
- Name Gates With Action-Oriented Names, Not Roles (05-rules.md)

---

## Related Skills

- Define Authorization Gates Using Closures for Simple Access Rules (06-skills.md)
