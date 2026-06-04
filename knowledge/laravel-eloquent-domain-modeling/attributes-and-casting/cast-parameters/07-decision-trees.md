# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Cast Parameters
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Parameterized Cast vs Separate Cast Classes
* Decision 2: Colon-Delimited Syntax vs Alternative Parameter Passing
* Decision 3: Eager Validation vs Deferred Validation of Cast Parameters

---

# Architecture-Level Decision Trees

---

## Decision 1: Parameterized Cast vs Separate Cast Classes

---

## Decision Context

Choose between creating a single parameterized cast class that accepts configuration via colon-delimited syntax, or creating separate cast classes for each variation.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the cast need per-attribute configuration (decimal places, currency, locale)?
↓
YES → Is the configuration different per model, not just per attribute?
    YES → Separate cast classes (parameterized casts share constructor across attributes)
    NO → Parameterized Cast (single class, configured via colon-delimited parameters)
NO → Does the cast not need any configuration?
    YES → Use class name directly (no parameters needed)
    NO → Can the same cast logic apply with different parameters across attributes?
        YES → Parameterized Cast
        NO → Separate Cast Classes

---

## Rationale

Parameterized casts reduce class explosion by reusing a single cast class with different configurations. They are ideal when the same transformation logic applies with minor variations (decimal places, currency). Separate classes are better when the transformation logic itself differs.

---

## Recommended Default

**Default:** Parameterized cast when the same transformation logic applies with different configuration. Separate cast classes when logic differs.
**Reason:** Reuse reduces duplication without sacrificing flexibility. Configuration is visible in the model's `$casts` array.

---

## Risks Of Wrong Choice

* Parameterized for fundamentally different logic: cast class bloated with conditional branches, SRP violation
* Separate classes for minor config differences: class explosion, duplicate code across cast classes

---

## Related Rules

* Accept cast parameters as array in constructor (`05-rules.md`)
* Provide defaults for optional cast parameters (`05-rules.md`)

---

## Related Skills

* Create a Parameterized Custom Cast (`06-skills.md` Skill 1)

---

## Decision 2: Colon-Delimited Syntax vs Alternative Parameter Passing

---

## Decision Context

Choose between the standard colon-delimited syntax for passing parameters to casts or an alternative custom approach.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is the parameter list simple (1-3 values)?
↓
YES → Colon-Delimited Syntax: `CastClass::class . ':param1,param2'`
NO → Does the cast need complex or nested configuration?
    YES → Use `casts()` method returning a cast instance: `'attr' => new Cast(params)`
    NO → Colon-Delimited Syntax
→ In both cases: is the configuration environment-dependent or dynamic?
    YES → Use `casts()` method for dynamic resolution
    NO → Colon-Delimited Syntax

---

## Rationale

Colon-delimited syntax is the established Laravel convention recognized by the framework, tooling, and developers. It is concise and visible directly in the `$casts` array. For complex configuration, returning a cast instance from the `casts()` method provides full constructor flexibility.

---

## Recommended Default

**Default:** Colon-delimited syntax for simple parameter lists. `casts()` method returning a cast instance for complex or dynamic configuration.
**Reason:** Standard syntax is universally recognized. The `casts()` method escape hatch handles edge cases without breaking convention for the common case.

---

## Risks Of Wrong Choice

* Custom parameter passing: non-standard, breaks tooling, confuses developers, fragile parsing
* Colon-delimited for complex config: unreadable long strings, no IDE support for parameter types

---

## Related Rules

* Use colon-delimited syntax consistently (`05-rules.md`)

---

## Related Skills

* Create a Parameterized Custom Cast (`06-skills.md` Skill 1)

---

## Decision 3: Eager Validation vs Deferred Validation of Cast Parameters

---

## Decision Context

Choose whether to validate cast parameters eagerly at construction time or defer validation to when the cast is first used.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Can invalid parameters cause silent data corruption or wrong results?
↓
YES → Eager Validation (throw in constructor with clear error message)
NO → Is the parameter value critical for data integrity (decimal places, currency)?
    YES → Eager Validation
    NO → Is the parameter purely cosmetic (formatting locale, display units)?
        YES → Deferred Validation (validate at first use)
        NO → Eager Validation

---

## Rationale

Eager validation catches misconfiguration early, at model boot time, rather than silently producing wrong results when the attribute is accessed. Cast parameters are specified as opaque colon-delimited strings — validation is the only safeguard against typos and invalid values.

---

## Recommended Default

**Default:** Eager validation with `InvalidArgumentException` for invalid parameter values.
**Reason:** Fail fast with clear diagnostics rather than silently corrupting data or producing wrong results.

---

## Risks Of Wrong Choice

* No validation: silent data corruption, difficult to debug, wrong values propagating through the system
* Overly strict validation: prevents legitimate use cases, causes friction during development

---

## Related Rules

* Validate cast parameters in the constructor (`05-rules.md`)
* Document valid parameter values (`05-rules.md`)

---

## Related Skills

* Create a Parameterized Custom Cast (`06-skills.md` Skill 1)
