## Fluent vs Traditional Through Syntax

Choosing between the fluent `through()->has()` API and traditional `hasOneThrough()`/`hasManyThrough()` positional argument syntax.

---

## Decision Context

When defining a HasOneThrough or HasManyThrough relationship, you must choose between the fluent chain API and the traditional positional syntax.

---

## Decision Criteria

* Laravel version (fluent API requires >= 10)
* number of intermediate hops (1 vs 2+)
* whether custom keys differ per hop
* whether readability is improved by the fluent syntax

---

## Decision Tree

Defining a `HasOneThrough` or `HasManyThrough` relationship?

↓

Is the project on Laravel 10+?

NO → Use traditional `hasOneThrough()` / `hasManyThrough()` positional syntax

YES → Are there 2+ intermediate hops (multi-hop chain)?

    YES → Use fluent syntax — `through(A)->through(B)->hasMany(C)`

        Are custom foreign keys needed per hop?

        YES → Fluent syntax is strongly preferred — keys scoped to each `through()` call

        NO → Fluent syntax is preferred for readability

    YES → Is it a single hop with simple foreign keys?

        NO → Fluent syntax (both fine, choose based on team convention)

        YES → Traditional syntax is more concise — `hasOneThrough(Final::class, Intermediate::class)`

---

## Rationale

Both syntaxes resolve to identical SQL at runtime. The fluent API improves readability for multi-hop chains and scopes custom keys per hop. For simple single-hop through relationships, traditional positional syntax is more concise.

---

## Recommended Default

**Default:** Fluent syntax for Laravel 10+ with multi-hop chains; traditional for simple single-hop
**Reason:** Readability improvement for complex chains; no performance difference

---

## Risks Of Wrong Choice

Fluent syntax for everything becomes verbose for simple chains; traditional syntax with 3+ hops creates confusing positional arguments; using fluent on Laravel 9 causes runtime errors.

---

## Related Rules

- Fluent API is Laravel 10+ only (from fluent-through-relationships standardized knowledge)
- `has()` for singular, `hasMany()` for collection results

---

## Related Skills

- Fluent through chain definition (relationships/06-skills.md)
- Custom key scoping per hop (relationships/06-skills.md)
