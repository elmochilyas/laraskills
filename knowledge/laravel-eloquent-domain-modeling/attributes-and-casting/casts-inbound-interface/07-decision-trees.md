# Metadata

**Domain:** Laravel Eloquent & Domain Modeling
**Subdomain:** Attributes & Casting
**Knowledge Unit:** CastsInboundAttributes Interface
**Generated:** 2026-06-03

---

# Decision Inventory

* Decision 1: CastsInboundAttributes vs CastsAttributes vs Accessor
* Decision 2: Inbound Cast Alone vs Inbound Cast + Accessor Pair
* Decision 3: Implement Only `set()` vs Adding `get()` to Inbound Cast

---

# Architecture-Level Decision Trees

---

## Decision 1: CastsInboundAttributes vs CastsAttributes vs Accessor

---

## Decision Context

Choose between write-only casting (`CastsInboundAttributes`), bidirectional casting (`CastsAttributes`), or a read-only accessor for attribute transformation.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is transformation needed only when writing to the database?
↓
YES → Is the stored value already the correct PHP representation on read?
    YES → `CastsInboundAttributes` (write-only, zero read overhead)
    NO → Use `CastsAttributes` (bidirectional) or inbound cast + accessor
NO → Is transformation needed only when reading from the database?
    YES → Accessor (`Attribute::make(get: ...)`)
    NO → Is bidirectional transformation needed (read + write)?
        YES → `CastsAttributes`
        NO → No transformation needed

---

## Rationale

`CastsInboundAttributes` is the right choice when writes need normalization but the stored value is already the preferred read format (hashes, encoded strings). Using it when read transformation is also needed forces callers to manually transform read values, duplicating logic.

---

## Recommended Default

**Default:** `CastsInboundAttributes` for write-only normalization (hashing, encoding). `CastsAttributes` for bidirectional transformation. Accessor for read-only formatting.
**Reason:** Each interface has a clear purpose. Using the wrong one creates unused code, duplicate transformation logic, or confusing behavior.

---

## Risks Of Wrong Choice

* Inbound cast when read transformation needed: callers must manually transform, logic duplication, inconsistent behavior
* Bidirectional cast for write-only: unnecessary `get` implementation, minimal but zero read overhead lost

---

## Related Rules

* Use `CastsInboundAttributes` for write-only normalization only (`05-rules.md`)
* Do not implement `get()` with this interface (`05-rules.md`)

---

## Related Skills

* Implement a Write-Only Cast (`06-skills.md` Skill 1)

---

## Decision 2: Inbound Cast Alone vs Inbound Cast + Accessor Pair

---

## Decision Context

Choose whether to use a `CastsInboundAttributes` cast alone or pair it with an accessor for read-side formatting.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Does the raw stored value need display formatting on read?
↓
YES → Pair `CastsInboundAttributes` with an accessor for read formatting
NO → Is the stored value directly suitable for display/use?
    YES → Inbound cast alone (no accessor needed)
    NO → Does the stored value need business logic transformation on read?
        YES → Pair inbound cast with accessor
        NO → Inbound cast alone

---

## Rationale

`CastsInboundAttributes` provides no read transformation. If the stored format needs formatting for display (masking, truncation, label derivation), an accessor cleanly provides the read-side transformation without switching to a bidirectional cast.

---

## Recommended Default

**Default:** Inbound cast alone when the stored value is directly usable. Pair with an accessor when the raw stored value needs display formatting.
**Reason:** Keeping the inbound cast focused on write normalization and the accessor on read formatting separates concerns cleanly.

---

## Risks Of Wrong Choice

* Inbound cast alone for display data: raw values exposed in views, manual formatting scattered across controllers and templates
* Adding accessor unnecessarily: extra code for values already in correct format

---

## Related Rules

* Combine `CastsInboundAttributes` with accessors for read formatting (`05-rules.md`)
* Document the one-directional nature (`05-rules.md`)

---

## Related Skills

* Implement a Write-Only Cast (`06-skills.md` Skill 1)

---

## Decision 3: Implement Only `set()` vs Adding `get()` to Inbound Cast

---

## Decision Context

Choose whether to strictly implement only `set()` when using `CastsInboundAttributes`, or to add a `get()` method.

---

## Decision Criteria

* performance considerations
* architectural considerations
* security considerations
* maintainability considerations

---

## Decision Tree

Is bidirectional transformation actually needed?
↓
YES → Switch to `CastsAttributes` (the correct interface for bidirectional)
NO → Is there a strong reason to add `get()` to an inbound cast?
    YES → Switch to `CastsAttributes` anyway (correct contract)
    NO → Implement only `set()` — the interface's contract

---

## Rationale

`CastsInboundAttributes` explicitly signals that no read transformation occurs. Adding `get()` violates the contract's intent and creates an inconsistent pattern. If read transformation is needed, use `CastsAttributes`.

---

## Recommended Default

**Default:** Implement only `set()` when using `CastsInboundAttributes`. Switch to `CastsAttributes` if read transformation is needed.
**Reason:** The interface name is the contract. Violating it confuses developers and creates inconsistent behavior across inbound casts.

---

## Risks Of Wrong Choice

* Adding `get()` to inbound cast: misleading contract, inconsistent pattern, principle of least surprise violated

---

## Related Rules

* Do not implement `get()` with `CastsInboundAttributes` (`05-rules.md`)
* Document the one-directional nature (`05-rules.md`)

---

## Related Skills

* Implement a Write-Only Cast (`06-skills.md` Skill 1)
