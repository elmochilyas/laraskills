# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** Money/Email/Address Patterns
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: Integer Cents (`int`) vs `brick/money` vs Float for Monetary Values
* Decision 2: Structured Address Value Object vs Unstructured String
* Decision 3: Normalized Email vs Preserved Case Email Storage

---

# Architecture-Level Decision Trees

---

## Decision 1: Integer Cents vs `brick/money` vs Float for Monetary Values

---

## Decision Context

Choose the representation for monetary values in PHP: integer cents, `brick/money` library, or PHP float.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the application perform arithmetic on monetary values (add, subtract, allocate)?
↓
YES → Does the application need multi-currency support with currency conversion?
    YES → `brick/money` (full-featured, proper rounding, currency support)
    NO → Integer cents (`int`) with simple arithmetic (exact, no precision loss)
NO → Is the value purely display-only (label from external system)?
    YES → Float is acceptable (no arithmetic, display only)
    NO → Integer cents (defensive, even for display-only values)

---

## Rationale

Float arithmetic introduces precision errors that cause accounting discrepancies. Integer cents are exact and simple. `brick/money` provides advanced features like multi-currency, allocation, and proper rounding. Float should only be used for display-only values with no arithmetic.

---

## Recommended Default

**Default:** Integer cents for most applications. `brick/money` for multi-currency or complex financial logic. Float only for display-only values.
**Reason:** Integer cents provide exact representation with zero library dependency. Float is never safe for arithmetic.

---

## Risks Of Wrong Choice

* Float for monetary arithmetic: precision errors, accounting discrepancies, audit failures
* `brick/money` for simple amounts: unnecessary dependency, learning curve, over-engineering
* Integer cents for multi-currency: must manually handle exchange rates and rounding

---

## Related Rules

* Use `brick/money` for monetary types, not float arithmetic (`05-rules.md`)
* Store money amounts as integer cents internally (`05-rules.md`)

---

## Related Skills

* Create an Immutable Money Value Object (`06-skills.md` Skill 1)

---

## Decision 2: Structured Address Value Object vs Unstructured String

---

## Decision Context

Choose between modeling a geographic address as a structured value object with typed components or as a single unstructured string.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the address need per-field validation or country-specific formatting?
↓
YES → Structured Address Value Object (street, city, state, postalCode, country)
NO → Is the address integrated with an address verification API?
    YES → Structured Address Value Object (components needed for API)
    NO → Is the address free-form text from an external system?
        YES → Unstructured String (parse at application boundary if needed)
        NO → Structured Address Value Object (safer default)

---

## Rationale

Structured address components enable per-field validation, country-specific formatting, and integration with address verification services. Unstructured strings are simpler but lose all structural information and cannot be validated or formatted consistently.

---

## Recommended Default

**Default:** Structured Address value object with typed components. Unstructured string only when parsing into components would be unreliable.
**Reason:** Structured addresses enable validation, formatting, and verification. Lossy unstructured storage sacrifices all of these.

---

## Risks Of Wrong Choice

* Unstructured string: impossible to validate components, inconsistent formatting, poor internationalization
* Structured object for free-form text: parsing errors, component misassignment, data corruption

---

## Related Rules

* Use structured value objects for addresses (`05-rules.md`)

---

## Related Skills

* Create an Immutable Money Value Object (`06-skills.md` Skill 1)

---

## Decision 3: Normalized Email vs Preserved Case Email Storage

---

## Decision Context

Choose whether to normalize email addresses to lowercase before storage or preserve the original case as provided by the user.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the application need to look up users by email address?
↓
YES → Normalize to lowercase (case-insensitive lookup, no duplicates)
NO → Does the application compare emails for uniqueness?
    YES → Normalize to lowercase (prevents duplicate accounts)
    NO → Is the original display format important for the application?
        YES → Store original case, normalize only for comparison/lookup
        NO → Normalize to lowercase (simplest, safest)

---

## Rationale

Email addresses are case-insensitive per RFC 5321. Storing mixed-case emails causes duplicate accounts, failed login attempts, and inconsistent matching. Lowercase normalization eliminates these issues at the domain boundary while the application can preserve display format separately if needed.

---

## Recommended Default

**Default:** Normalize emails to lowercase on construction and storage. Store the original display format separately only if required.
**Reason:** Case-insensitive matching is the standard for email. Normalization prevents duplicates and login issues.

---

## Risks Of Wrong Choice

* Preserving case without normalization: duplicate accounts (User@Example.com vs user@example.com), failed logins
* Normalizing without user notification: unexpected change in display format, but minimal impact

---

## Related Rules

* Normalize emails to lowercase on construction (`05-rules.md`)
* Validate email format before storage (`05-rules.md`)

---

## Related Skills

* Create an Immutable Money Value Object (`06-skills.md` Skill 1)
