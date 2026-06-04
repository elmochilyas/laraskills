# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Middleware Ordering and Priority
**Generated:** 2026-06-03

---

# Decision Inventory

* Default Priority Chain vs Custom Priority Override
* prependToPriorityList/appendToPriorityList vs Full Priority Array Replacement
* Priority Placement vs Non-Priority Default for Custom Middleware
* Framework Middleware in Priority Chain vs Route-Level Ordering

---

# Architecture-Level Decision Trees

---

## Decision 1: Default Priority Chain vs Custom Priority Override

---

## Decision Context

Whether to use Laravel's default priority chain or define a custom priority array for the route middleware pipeline.

---

## Decision Criteria

* Whether custom middleware needs to run before or after specific framework middleware
* Whether the application has a complex middleware stack requiring full ordering control
* Whether the default chain's order (Cookies → Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings) is sufficient

---

## Decision Tree

Does any custom middleware need to run before or after a specific framework middleware?
↓
NO → Default priority chain — no custom priority needed; non-priority middleware runs at the end
YES → Can the custom middleware be inserted using `prependToPriorityList` or `appendToPriorityList`?
    ↓
    YES → Targeted insertion — add custom middleware at the specific position needed
    NO → Is the entire priority chain being customized (not just additions)?
        ↓
        YES → Full priority replacement — must include ALL framework middleware explicitly
        NO → Non-priority approach — custom middleware runs at end; acceptable if position doesn't matter

---

## Rationale

The default priority chain (Cookies → Session → CSRF → Throttle → Auth → Authorize → SubstituteBindings) establishes a safe execution order. Custom middleware that doesn't need to run relative to specific framework middleware can remain non-priority and runs at the end. Only override when custom middleware must run before auth, after session, or at another specific position in the chain.

---

## Recommended Default

**Default:** Use the default priority chain. Insert custom middleware via `prependToPriorityList`/`appendToPriorityList` when position matters.
**Reason:** The default chain is tested and correct for every Laravel version. Full replacement risks omitting new framework middleware added in upgrades.

---

## Risks Of Wrong Choice

* Full replacement omitting framework middleware: New middleware runs at end (non-priority), breaking version-specific behavior
* No priority placement when needed: Custom middleware intended to run before auth runs after auth instead
* Overriding without including all defaults: After upgrade, security behavior changes silently
* Assuming registration order = execution order: Priority array overrides registration order completely

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Configure Middleware Priority for Custom Middleware
* Implement a Correct handle() Method with Two-Pass Execution

---

---

## Decision 2: prependToPriorityList/appendToPriorityList vs Full Priority Array Replacement

---

## Decision Context

Whether to use targeted insertion methods (available in Laravel 12+) or replace the entire priority array when adding custom middleware.

---

## Decision Criteria

* Laravel version (Laravel 12+ vs 11-)
* Number of custom middleware items needing priority placement
* Whether the full priority list needs restructuring

---

## Decision Tree

Is the application using Laravel 12+ with `prependToPriorityList`/`appendToPriorityList`?
↓
NO → Use full priority array replacement (Laravel 11-) — include ALL default framework middleware
YES → Is only 1-3 custom middleware items needing priority placement?
    ↓
    YES → Targeted insertion — `prependToPriorityList(before: Auth::class, prepend: Custom::class)`
    NO → Does the full priority list need fundamental restructuring?
        ↓
        YES → Full replacement — targeted insertion may not achieve desired order for many items
        NO → Multiple targeted insertions — chain individual prepend/append calls

---

## Rationale

`prependToPriorityList` and `appendToPriorityList` insert middleware before or after a specific framework middleware without replacing the entire priority array. This preserves framework defaults and is upgrade-safe. Full replacement requires maintaining the complete list manually, which diverges from framework defaults over time.

---

## Recommended Default

**Default:** Targeted insertion (`prependToPriorityList`/`appendToPriorityList`) when available. Full replacement only when the entire chain must be restructured.
**Reason:** Targeted insertion is upgrade-safe — new framework middleware added by Laravel upgrades are automatically included. Full replacement requires manual maintenance.

---

## Risks Of Wrong Choice

* Full replacement on upgrade: New Laravel version adds middleware to default priority; application override doesn't include it
* Targeted insertion on Laravel 11-: Methods don't exist; must use full replacement
* Multiple targeted insertions in wrong order: Insertion order determines final priority position
* Class name mismatch: Priority list uses alias but route definition uses FQCN (or vice versa); match fails silently

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Configure Middleware Priority for Custom Middleware
* Register Custom Middleware at the Correct Tier

---

---

## Decision 3: Priority Placement vs Non-Priority Default for Custom Middleware

---

## Decision Context

Whether to add custom middleware to the priority array or let it run at the end as non-priority.

---

## Decision Criteria

* Whether the custom middleware must execute before or after specific framework middleware
* Whether the custom middleware modifies the request for downstream middleware
* Whether the custom middleware's position relative to framework middleware matters

---

## Decision Tree

Does the custom middleware modify the request or response in a way that affects other middleware?
↓
YES → Does it need to run before auth (modify user, session)?
    ↓
    YES → Priority placement before `Authenticate` — auth reads the modified state
    NO → Does it need to run before rate limiting (modify throttle key)?
        ↓
        YES → Priority placement before `ThrottleRequests` — throttle uses the modified data
        NO → Does it need to run after session starts (read session data)?
            ↓
            YES → Priority placement after `StartSession` — session is available
            NO → Non-priority — position doesn't matter; runs at end
NO → Is the custom middleware a guard (short-circuits unauthorized requests)?
    ↓
    YES → Non-priority — short-circuiting is position-independent; runs at end
    NO → Non-priority — no dependency on other middleware's state

---

## Rationale

The `SortedMiddleware` algorithm moves priority items to the front in priority order. Non-priority items are appended at the end preserving their relative merge order. A custom middleware that must run before auth needs priority placement; otherwise it runs after all priority middleware (including auth), defeating its purpose.

---

## Recommended Default

**Default:** Non-priority for most custom middleware. Priority placement only when the middleware must run before or after specific framework middleware.
**Reason:** Priority placement adds maintenance overhead. Most custom middleware (logging, enrichment, guards) works correctly at the end of the pipeline.

---

## Risks Of Wrong Choice

* No priority for pre-auth middleware: Runs after auth; user authentication state isn't available for the middleware's logic
* Priority for post-only middleware: Runs too early; response from downstream middleware isn't available yet
* Misplaced priority: Middleware runs before session starts and can't read session data; before CSRF and can't validate tokens

---

## Related Rules

* Place Pre-Processing Code Before $next and Post-Processing Code After
* Keep Global Middleware Minimal

---

## Related Skills

* Configure Middleware Priority for Custom Middleware
* Implement a Correct handle() Method with Two-Pass Execution

---

---

## Decision 4: Framework Middleware in Priority Chain vs Route-Level Ordering

---

## Decision Context

Whether to rely on the priority chain to order framework middleware or manually control ordering at the route/group registration level.

---

## Decision Criteria

* Whether the middleware is in the priority array
* Whether the middleware's position relative to other middleware matters for security
* Whether the application has middleware not in the default priority chain

---

## Decision Tree

Is the middleware in the framework's default priority chain?
↓
NO → Does the middleware need to run before or after specific priority middleware?
    ↓
    YES → Add to priority array — registration order alone does not guarantee position
    NO → Registration order within the group is sufficient — non-priority middleware preserves group merge order
YES → Does the registration order within the group match the desired execution order?
    ↓
    YES → Registration order is overridden by priority — priority chain wins regardless of registration position
    NO → Priority chain ensures correct order — the priority system is designed for this
NO → Is the middleware security-critical (auth, CSRF, rate limiting)?
    ↓
    YES → Must be in priority array — security ordering cannot rely on registration order
    NO → Non-priority is acceptable

---

## Rationale

Registration order within a group does NOT determine execution order for priority middleware. The `SortedMiddleware` algorithm reorders merged middleware based on the priority array. Non-priority middleware runs in their original merge order (controller → route → group). Security-critical middleware must be in the priority chain to guarantee correct ordering.

---

## Recommended Default

**Default:** Trust the default priority chain for framework middleware. Only add custom middleware to priority when specific positioning is required.
**Reason:** The priority chain is the only mechanism that guarantees execution order. Registration order is unreliable for middleware in the priority array.

---

## Risks Of Wrong Choice

* Relying on registration order for priority middleware: Registration order is completely overridden by priority array
* Security middleware not in priority: Auth after SubstituteBindings — model bindings run before auth can provide user context
* Throttle after auth: Unauthenticated requests bypass rate limiting because auth short-circuits before reaching throttle
* CSRF before session: CSRF token validation fails because session hasn't started

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Configure Middleware Priority for Custom Middleware
* Apply the Cross-Cutting Boundary Test to New Middleware
