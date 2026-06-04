# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Middleware System
**Knowledge Unit:** Parameterized Middleware
**Generated:** 2026-06-03

---

# Decision Inventory

* Parameterized Middleware vs Separate Middleware Classes
* Static Colon-Delimited Parameters vs Named Limiters/Resolvers
* Optional Parameters with Default Values vs Required Parameters
* Variadic Parameters vs Fixed Parameters for Multiple Values

---

# Architecture-Level Decision Trees

---

## Decision 1: Parameterized Middleware vs Separate Middleware Classes

---

## Decision Context

Whether to create a single parameterized middleware that accepts colon-delimited configuration or separate middleware classes for each configuration variant.

---

## Decision Criteria

* Whether the middleware differs only in configuration values, not in logic
* Number of configuration variants
* Whether the parameter values are static or dynamic

---

## Decision Tree

Does the middleware logic remain identical across configurations (only values differ)?
↓
NO → Separate middleware classes — fundamentally different behaviors need separate classes
YES → Are the parameter values static and known at route definition time?
    ↓
    YES → Parameterized middleware — colon-delimited parameters in route definition
    NO → Do the values depend on runtime state (user tier, subscription plan)?
        ↓
        YES → Named limiters/resolvers — parameterized middleware with name, not value
        NO → Separate middleware classes — dynamic configuration requires class-level control
NO → Is the number of configuration variants small (2-3) and stable?
    ↓
    YES → Either approach works — parameterized reduces class count, separate provides explicitness
    NO → Parameterized middleware — variants grow; avoid class explosion

---

## Rationale

Parameterized middleware uses colon-delimited syntax (`auth:sanctum`, `throttle:60,1`) to pass configuration from the route definition to the middleware's `handle()` method. This eliminates configuration duplication and reduces class count. Separate classes are needed when the middleware behavior differs fundamentally — not just in values but in logic.

---

## Recommended Default

**Default:** Parameterized middleware for concerns that differ only in configuration values. Separate classes for fundamentally different behaviors.
**Reason:** Parameterized middleware follows the same pattern as Laravel's own middleware (`auth`, `throttle`, `can`). It scales from 2 to 20+ configurations without class proliferation.

---

## Risks Of Wrong Choice

* Separate classes per configuration: 10 auth guard variants → 10 middleware classes; rate limit variants → 15 classes
* Parameterized middleware for different behaviors: Complex `if/else` in `handle()`; violates single responsibility
* Missing default values: TypeError when middleware used without parameters
* Overloading parameters: Unreadable route definitions like `middleware:json;complex;config`

---

## Related Rules

* Never Place Business Logic in Middleware
* Always Return the Result of $next($request)

---

## Related Skills

* Implement Parameterized Middleware with Colon-Delimited Syntax
* Write Direct Unit Tests for Custom Middleware

---

---

## Decision 2: Static Colon-Delimited Parameters vs Named Limiters/Resolvers

---

## Decision Context

Whether to use static numeric/string parameters in the route definition (`throttle:60,1`) or register named limiters/resolvers (`throttle:api`) that provide dynamic configuration.

---

## Decision Criteria

* Whether the parameter value is static or varies at runtime
* Whether the parameter value is shared across multiple routes
* Whether the configuration needs central management

---

## Decision Tree

Is the parameter value determined at route definition time or at runtime?
↓
Route definition time → Does the value change per route?
    ↓
    YES → Static inline parameters — different values per route are explicit in the route file
    NO → Named limiter/resolver — single name reused across routes; central configuration
Runtime (user tier, subscription, request context) → Named limiter/resolver — inline parameters are static and cannot vary at runtime
NO → Is the parameter value shared across 3+ routes?
    ↓
    YES → Named limiter/resolver — central configuration prevents duplication
    NO → Inline parameters — single route doesn't need a named configuration

---

## Rationale

Inline parameters (`throttle:60,1`) are fixed at route definition time — they cannot vary based on user context, request data, or runtime state. Named limiters (`throttle:api`) support complex segmentation logic in the `by()` method that can differentiate between authenticated users, guests, and user tiers. Inline parameters are simpler; named limiters are more flexible.

---

## Recommended Default

**Default:** Named limiters/resolvers for production applications. Inline parameters for simple, single-route configurations.
**Reason:** Named limiters support dynamic key segmentation, central configuration, and are reusable across routes. Inline parameters are duplicated and harder to audit.

---

## Risks Of Wrong Choice

* Inline for dynamic limits: Cannot differentiate authenticated vs guest users; all requests get the same limit
* Named limiter for single static value: Unnecessary indirection — a single `throttle:60,1` is clearer
* Inline for shared configuration: Changing the limit requires updating every route definition
* Named limiter not registered: `throttle:api` applied without `RateLimiter::for('api', ...)` — RuntimeException at dispatch

---

## Related Rules

* Never Place Business Logic in Middleware
* Keep Global Middleware Minimal

---

## Related Skills

* Implement Parameterized Middleware with Colon-Delimited Syntax
* Define Named Rate Limiters for Reusable Configuration

---

---

## Decision 3: Optional Parameters with Default Values vs Required Parameters

---

## Decision Context

Whether to declare middleware parameters as optional (with defaults) or required in the `handle()` method signature.

---

## Decision Criteria

* Whether the middleware is ever used without parameters
* Whether the default value provides meaningful behavior
* Whether omitting parameters should produce an error

---

## Decision Tree

Is the middleware ever used without colon-delimited parameters (e.g., `auth` vs `auth:sanctum`)?
↓
YES → Can a sensible default be provided (default guard, default rate limit)?
    ↓
    YES → Optional with default — `string $guard = null` or `config('auth.defaults.guard')` in body
    NO → Required parameter — middleware doesn't make sense without explicit configuration
NO → Is the parameter always required for correct behavior?
    ↓
    YES → Required parameter — no default; caller must provide value
    NO → Optional with default — parameter provides override but isn't required

---

## Rationale

If the parameter is omitted, the Pipeline does not pass extra arguments to `handle()`. Without a default value, PHP throws `TypeError` for missing arguments. Optional parameters with sensible defaults ensure the middleware works both with and without parameters. The default should be the most common use case — `auth` defaults to the configured default guard, `throttle:60,1` uses explicit values.

---

## Recommended Default

**Default:** Optional parameters with sensible defaults for middleware that may be used without parameters. Required parameters for middleware where configuration is mandatory.
**Reason:** Default values prevent TypeError and make the middleware usable with minimal configuration. The default should be the most common production value.

---

## Risks Of Wrong Choice

* Required parameter without default: `TypeError` when middleware is used without parameters
* Default that silently breaks behavior: `string $guard = 'web'` default when route expects 'sanctum'
* No default and always called with parameter: Unnecessary ceremony — could be required
* Complex default logic in parameter handling: Violates single responsibility

---

## Related Rules

* Always Return the Result of $next($request)
* Never Place Business Logic in Middleware

---

## Related Skills

* Implement Parameterized Middleware with Colon-Delimited Syntax
* Write Direct Unit Tests for Custom Middleware

---

---

## Decision 4: Variadic Parameters vs Fixed Parameters for Multiple Values

---

## Decision Context

Whether to use variadic parameters (`string ...$roles`) or fixed parameters (`string $role1, string $role2`) for middleware that accepts multiple values.

---

## Decision Criteria

* Whether the number of values is variable
* Maximum expected number of values
* Whether validation of each value is needed

---

## Decision Tree

Does the middleware accept a variable number of values (roles, guards, permissions)?
↓
NO → Fixed parameter — exactly one value expected (single guard, single rate limit)
YES → Is the maximum number of values small (2-3) and known?
    ↓
    YES → Fixed parameters acceptable — but variadic is still cleaner
    NO → Variadic parameters — `string ...$roles` handles any number of values
NO → Does each value need individual validation?
    ↓
    YES → Variadic with loop — iterate `$roles` and validate each
    NO → Variadic — collect all values into array and process

---

## Rationale

Variadic parameters in `handle()` collect all comma-delimited values after the middleware name into an array. `CheckRole:admin,editor,super-admin` passes `admin`, `editor`, `super-admin` as `$roles`. Fixed parameters require knowing the exact count at design time, which limits flexibility.

---

## Recommended Default

**Default:** Variadic parameters for any middleware that accepts multiple values. Fixed parameters only when exactly one value is expected.
**Reason:** Variadic parameters naturally match the comma-delimited syntax and don't require updating the signature when new values are added.

---

## Risks Of Wrong Choice

* Fixed parameters for variable values: Extra values are silently ignored; middleware behavior is incomplete
* Variadic for single value: Works correctly but the signature implies multiple values are expected
* Comma in parameter value: Pipeline splits on comma — use alternative delimiter (semicolon) for values containing commas
* Not validating variadic values: Invalid roles, guards, or permissions pass silently

---

## Related Rules

* Never Place Business Logic in Middleware
* Always Return the Result of $next($request)

---

## Related Skills

* Implement Parameterized Middleware with Colon-Delimited Syntax
* Write Direct Unit Tests for Custom Middleware
