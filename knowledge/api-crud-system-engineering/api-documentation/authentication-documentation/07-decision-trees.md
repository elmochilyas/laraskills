# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Authentication Documentation
**Generated:** 2026-06-03

---

# Decision Inventory

* Security scheme definition (global vs per-operation)
* Auth method documentation order and recommendation

---

# Architecture-Level Decision Trees

---

## Security Scheme Definition — Global vs Per-Operation

---

## Decision Context

Should security schemes be defined globally for all operations, or individually per endpoint? Arises when documenting API authentication requirements.

---

## Decision Criteria

* consistency — most endpoints share the same auth requirement
* public endpoints — some endpoints require no authentication
* multiple auth methods — different endpoints may accept different auth methods
* documentation clutter — per-operation repetition vs global clarity

---

## Decision Tree

Do most endpoints require the same authentication method?
↓
YES → Define globally with per-operation override for public endpoints
NO → Do endpoints use significantly different auth methods?
    YES → Per-operation security definitions (mixed auth)
    NO → Global with overrides (standard pattern)

---

## Rationale

Global security with per-operation overrides is the standard OpenAPI pattern. Most API endpoints require authentication, with a few public exceptions (login, health, docs). Per-operation security is needed only when different endpoints use fundamentally different auth mechanisms.

---

## Recommended Default

**Default:** Global security + per-operation empty override for public endpoints
**Reason:** Single definition, less repetition, clear public endpoint identification.

---

## Risks Of Wrong Choice

Per-operation security on every endpoint: massive repetition, inconsistent application. Global security without public overrides: public endpoints shown as requiring auth.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## Auth Method Documentation Order and Recommendation

---

## Decision Context

In what order should multiple authentication methods be presented, and should a recommendation be provided? Arises when documenting APIs that support multiple auth methods.

---

## Decision Criteria

* consumer guidance — which auth method should new consumers choose
* security — recommending the most secure appropriate method
* compatibility — considering the consumer's technical constraints
* deprecation — planning to phase out legacy methods

---

## Decision Tree

How many authentication methods does the API support?
↓
Single method?
YES → Document that method with full details
NO → Multiple methods?
    YES → Is one method clearly superior (more secure, more features)?
        YES → Recommended method listed first with explanation; alternative methods listed after
        NO → Both methods equally valid?
            YES → Listed with trade-offs documented; no hard recommendation

---

## Rationale

When multiple auth methods exist, new consumers need guidance on which to choose. Listing the recommended method first and adding a recommendation note reduces integration friction. Equally valid methods (e.g., Bearer token vs API key for different use cases) should be documented with trade-offs.

---

## Recommended Default

**Default:** List Bearer token auth first (recommended), API key as alternative
**Reason:** Bearer tokens with abilities provide the most flexible and secure access control.

---

## Risks Of Wrong Choice

All methods presented equally without guidance: consumers choose the wrong method for their use case, requiring later migration. Legacy method listed first: new consumers adopt outdated auth.

---

## Related Rules

N/A

---

## Related Skills

N/A
