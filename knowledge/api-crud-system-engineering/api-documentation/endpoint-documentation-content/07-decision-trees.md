# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** Endpoint Documentation Content
**Generated:** 2026-06-03

---

# Decision Inventory

* Documentation depth (summary-only vs full five-question model)
* operationId naming convention

---

# Architecture-Level Decision Trees

---

## Documentation Depth — Summary-Only vs Full Five-Question Model

---

## Decision Context

How detailed should each endpoint's documentation be? Arises when writing endpoint documentation.

---

## Decision Criteria

* consumer needs — what information consumers need to integrate
* maintenance overhead — detailed docs require more updates
* complexity — simple CRUD vs complex operations
* automation — auto-generated vs manually curated content

---

## Decision Tree

Is the endpoint a standard CRUD operation (create, read, update, delete)?
↓
YES → Full five-question model: What, Send, Get, Errors, Example
NO → Complex operation (search, bulk, custom action)?
    YES → Full five-question model + multiple examples + edge cases
    NO → Health/monitoring endpoint?
        YES → Summary-only (minimal documentation sufficient)

---

## Rationale

Every consumer-facing endpoint needs at minimum: what it does, what to send, what to expect, what can go wrong, and a working example. CRUD and complex operations always need full documentation. Monitoring endpoints need minimal documentation.

---

## Recommended Default

**Default:** Full five-question model for every consumer-facing endpoint
**Reason:** Consumers need all five pieces of information to integrate successfully without support requests.

---

## Risks Of Wrong Choice

Summary-only: consumers send wrong data, miss error handling, or cannot determine endpoint purpose. Over-documented monitoring: wasted documentation effort for endpoints consumers rarely use.

---

## Related Rules

N/A

---

## Related Skills

N/A

---

## operationId Naming Convention

---

## Decision Context

What naming convention should operationId follow? Arises when defining OpenAPI operation identifiers.

---

## Decision Criteria

* SDK generation — operationId determines generated method names
* uniqueness — each operation needs a unique identifier
* readability — developers should infer the action from the name
* convention — `resource.action` is the industry standard

---

## Decision Tree

Does the API follow RESTful resource conventions?
↓
YES → Use `{resource}.{action}` pattern (`users.list`, `users.create`)
NO → Action-based endpoints (RPC style)?
    YES → Use `{domain}.{action}` pattern (`search.users`, `analytics.report`)
    NO → Custom API → Use consistent domain.action pattern

---

## Rationale

`resource.action` maps naturally to CRUD operations and produces clean SDK method names. RESTful APIs with this pattern generate `client.users.list()` methods.

---

## Recommended Default

**Default:** `{resource}.{action}` (e.g., `users.list`, `users.create`, `users.get`, `users.update`, `users.delete`)
**Reason:** Industry standard, clean SDK codegen, predictable names across endpoints.

---

## Risks Of Wrong Choice

Inconsistent naming: generated SDK methods are unpredictable, developers must manually map spec to code. No operationId: SDK generators create auto-names based on HTTP method + path, which are inconsistent.

---

## Related Rules

N/A

---

## Related Skills

N/A
