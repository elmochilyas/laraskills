# Metadata

**Domain:** Laravel Core Application Engineering
**Subdomain:** Routing System
**Knowledge Unit:** Enum Binding
**Generated:** 2026-06-03

---

# Decision Inventory

* Enum Binding vs Manual tryFrom() in Controllers
* String-Backed Enums vs Integer-Backed Enums for Route Parameters
* Enum Binding vs Route Constraints for Validation
* Pure Enum Routes vs Backed Enum Routes

---

# Architecture-Level Decision Trees

---

## Decision 1: Enum Binding vs Manual tryFrom() in Controllers

---

## Decision Context

Whether to rely on Laravel's automatic enum binding (type-hinted parameter) or manually resolve enum values in controller code.

---

## Decision Criteria

* Whether the route parameter maps directly to an enum case
* Whether the controller needs custom handling for invalid values
* Whether the enum is backed or pure

---

## Decision Tree

Is the route parameter value meant to match an enum case?
↓
NO → Manual handling — the parameter is not an enum; no binding needed
YES → Is the enum backed (string or int)?
    ↓
    YES → Is special handling needed for invalid values (beyond 404)?
        ↓
        YES → Manual `tryFrom()` + custom handling — `Enum::tryFrom($value) ?? customResponse()`
        NO → Enum binding — let the framework return 404 automatically
    NO → Manual handling — pure enums cannot use implicit binding; use explicit matching
NO → Does the parameter need additional validation beyond case matching?
    ↓
    YES → Combine both — enum binding for resolution + route constraint for validation
    NO → Enum binding — case matching is sufficient

---

## Rationale

Enum binding eliminates boilerplate (`Enum::tryFrom($value) ?? abort(404)`) by resolving backed enums automatically. The 404 response for invalid values is usually the correct behavior. Only use manual resolution when the enum is pure (non-backed) or when special handling beyond 404 is needed.

---

## Recommended Default

**Default:** Use enum binding (type-hinted parameter) for all backed enum route parameters.
**Reason:** Eliminates boilerplate, ensures consistent 404 behavior, and is O(1) with no database query.

---

## Risks Of Wrong Choice

* Manual `tryFrom()` everywhere: Boilerplate duplicated across controllers; inconsistent error handling
* Enum binding for pure enum: `BindingResolutionException` — the framework cannot instantiate the enum
* Enum binding without constraint: Valid enum cases pass but may not be valid for the specific endpoint context
* Manual custom response: Non-standard error response compared to the framework's 404 behavior

---

## Related Rules

* Enforce Backed Enums for Route Parameters Over String Literals
* Enforce Enum Type Hints in Controller Parameters Instead of Manual tryFrom()

---

## Related Skills

* Use Enum Binding for Backed Enum Route Parameters
* Combine Enum Binding with Route Constraints for Additional Validation

---

---

## Decision 2: String-Backed Enums vs Integer-Backed Enums for Route Parameters

---

## Decision Context

Whether the enum backing type should be string or integer for route parameters.

---

## Decision Criteria

* Whether the URL segment should be human-readable
* Whether the enum value has meaning external to the application
* Whether the enum is stored as integer in the database

---

## Decision Tree

Should the URL segment be human-readable (e.g., `/posts/draft`)?
↓
YES → String-backed enum — readable, self-documenting URLs
NO → Is the enum value exposed to external API consumers?
    ↓
    YES → String-backed enum — API responses are more readable with string values
    NO → Is the enum stored as an integer in the database?
        ↓
        YES → Integer-backed enum — aligns with storage; but consider string for URLs
        NO → String-backed enum — no reason to use integers
NO → Are the enum values meaningful outside the application (third-party integrations)?
    ↓
    YES → String-backed enum — stable across integrations; integers may change
    NO → Either — no external constraints; choose based on readability preference

---

## Rationale

String-backed enums produce readable URL segments (`/posts/draft`) compared to integers (`/posts/1`). Readable URLs are easier to debug, document, and share. Integers are more efficient for storage but less meaningful in URLs. The backing type should be chosen primarily for the external interface, not the internal storage.

---

## Recommended Default

**Default:** String-backed enums for all route parameters.
**Reason:** Readable, self-documenting URLs. Integer IDs add no value in route segments and reduce clarity.

---

## Risks Of Wrong Choice

* Integer-backed enum in URL: `/posts/1` — unclear what 1 represents; requires documentation
* String-backed enum with integer DB storage: Mapping overhead; but still correct
* Mixed backing types: Inconsistent URL patterns; confusion for API consumers
* Integer-backed enum with API consumers: Breaking changes if enum integer values are reordered

---

## Related Rules

* Enforce Backed Enums for Route Parameters Over String Literals
* Enforce Enum Type Hints in Controller Parameters Instead of Manual tryFrom()

---

## Related Skills

* Use Enum Binding for Backed Enum Route Parameters
* Combine Enum Binding with Route Constraints for Additional Validation

---

---

## Decision 3: Enum Binding vs Route Constraints for Validation

---

## Decision Context

Whether to rely solely on enum binding for validation or add route constraints (regex patterns) for additional validation.

---

## Decision Criteria

* Whether the parameter format should be validated before binding
* Whether invalid formats should return a different response than 404
* Whether the enum has a large number of cases

---

## Decision Tree

Does the route parameter need format validation before enum resolution?
↓
NO → Enum binding only — the framework handles case matching and 404
YES → Add route constraint — regex `where('status', 'draft|published|archived')`
    ↓
    YES → Does the constraint duplicate the enum's case list?
        ↓
        YES → Consider removing the constraint — enum binding already validates all cases
        NO → Keep the constraint — validates format that enum matching doesn't cover
    NO → Enum binding only — no additional validation needed
NO → Should invalid values return a different response than 404?
    ↓
    YES → Enum binding is insufficient — invalid cases return 404 regardless; use route constraint with custom response
    NO → Enum binding only

---

## Rationale

Enum binding handles case matching and returns 404 for non-matching values. Route constraints (regex) provide early rejection before the parameter reaches the controller. For most enum parameters, route constraints are redundant — the enum defines the valid values. Constraints are only needed when the parameter format has restrictions beyond the enum membership.

---

## Recommended Default

**Default:** Enum binding only, without route constraints.
**Reason:** The enum itself defines all valid values. Route constraints are redundant boilerplate that must be kept in sync with the enum.

---

## Risks Of Wrong Choice

* Route constraint without enum binding: Returns 404 for invalid formats but controller receives raw string instead of typed enum
* Enum binding without constraint: Valid enum values pass even if format is unconventional — generally fine
* Outdated constraint: Regex allows more values than the enum (missing sync) — enum binding catches it; or regex blocks valid enum values — false 404
* No constraint with broad enum: All enum cases are valid; no risk — everything is explicitly defined

---

## Related Rules

* Enforce Backed Enums for Route Parameters Over String Literals
* Enforce Enum Type Hints in Controller Parameters Instead of Manual tryFrom()

---

## Related Skills

* Use Enum Binding for Backed Enum Route Parameters
* Combine Enum Binding with Route Constraints for Additional Validation

---

---

## Decision 4: Pure Enum Routes vs Backed Enum Routes

---

## Decision Context

When a pure (non-backed) enum seems natural for route parameters, whether to convert it to a backed enum or use manual string matching.

---

## Decision Criteria

* Whether the enum needs to map to external values (URL segments, API responses)
* Whether the enum is used internally only
* Whether converting to a backed enum changes the enum's semantics

---

## Decision Tree

Is the enum used ONLY internally (no URLs, no API responses)?
↓
YES → Pure enum is fine — routes need manual string matching; no binding benefit
NO → Does the enum need to be represented in URLs or API responses?
    ↓
    YES → CONVERT TO BACKED ENUM — pure enums cannot be used in URLs; backed enums provide the mapping
    NO → Is there ANY external representation of the enum?
        ↓
        YES → CONVERT TO BACKED ENUM — any external use requires a mapping; backed enums provide it directly
        NO → Pure enum — no external representation; no route binding needed
NO → Will the enum ever need to be exposed in the future?
    ↓
    YES → Consider making it backed now — changing from pure to backed is a breaking change for existing cases
    NO → Pure enum is sufficient

---

## Rationale

Pure enums have no backing value — they are just in-memory objects (e.g., `Status::Draft` has no string or int value). Route parameters are strings from URLs, so `tryFrom()` requires a backed enum. Pure enums require a manual mapping layer (e.g., `match($value) { 'draft' => Status::Draft }`). If the enum is ever exposed externally, it should be backed.

---

## Recommended Default

**Default:** Use backed enums (string-backed) for ANY enum that may appear in routes, APIs, or external interfaces. Use pure enums only for strictly internal logic.
**Reason:** Backed enums support `tryFrom()` for route binding. Converting pure to backed later is a breaking change.

---

## Risks Of Wrong Choice

* Pure enum for route parameter: `BindingResolutionException` — framework cannot instantiate pure enum
* Manual string-to-enum mapping: Boilerplate; inconsistent validation; easy to miss a case
* Backed enum for purely internal use: Additional complexity (backing value) with no benefit
* Converting pure to backed later: All existing `Status::Draft` references remain valid, but enum definition changes — serialization impact

---

## Related Rules

* Enforce Backed Enums for Route Parameters Over String Literals
* Enforce Enum Type Hints in Controller Parameters Instead of Manual tryFrom()

---

## Related Skills

* Use Enum Binding for Backed Enum Route Parameters
* Combine Enum Binding with Route Constraints for Additional Validation
