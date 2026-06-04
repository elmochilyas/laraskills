# Metadata

**Domain:** API & CRUD System Engineering
**Subdomain:** API Documentation
**Knowledge Unit:** OpenAPI Spec Generation
**Generated:** 2026-06-03

---

# Decision Inventory

* Schema approach (schema-first vs code-first)
* Spec organization (single-file vs multi-file)
* Spec delivery (hosted endpoint vs downloadable file)

---

# Architecture-Level Decision Trees

---

## Schema Approach — Schema-First vs Code-First

---

## Decision Context

Should the OpenAPI spec be designed first (schema-first) or generated from code annotations (code-first)? Arises when starting a new API documentation strategy.

---

## Decision Criteria

* design control — schema-first gives full spec control; code-first is constrained by what the tool extracts
* synchronization — code-first stays in sync naturally; schema-first requires CI validation
* development speed — code-first requires less manual work
* API maturity — schema-first for greenfield; code-first for existing APIs

---

## Decision Tree

Is this a greenfield API (new design not yet implemented)?
↓
YES → Schema-first — design spec, then implement to match
NO → Existing API with working code?
    YES → Code-first with Scramble or Scribe — generate from code, manually enrich
    NO → Schema-first (always start with spec for new APIs)

---

## Rationale

Schema-first ensures the spec accurately reflects intended design and enables API review before implementation. Code-first is faster for existing APIs and stays in sync automatically but may produce less polished documentation.

---

## Recommended Default

**Default:** Code-first (Scramble/Scribe) for existing APIs; schema-first for new APIs
**Reason:** Existing APIs already have implementations — code-first is faster and stays in sync. New APIs benefit from design-first thinking.

---

## Risks Of Wrong Choice

Schema-first for existing APIs: massive spec writing effort, spec-code drift until fully documented. Code-first for greenfield: spec constrained by what the code-first tool can extract from non-existent code.

---

## Related Rules

- Define All Schemas In Components With $ref References (from 05-rules.md)

---

## Related Skills

- Implement OpenAPI Specification Generation (from 06-skills.md)

---

## Spec Organization — Single-File vs Multi-File

---

## Decision Context

Should the OpenAPI spec be a single file or split across multiple files? Arises when the spec grows beyond a manageable size.

---

## Decision Criteria

* spec size — single files become unwieldy above 1MB
* team collaboration — multiple files enable parallel edits
* tooling compatibility — some tools require bundled single-file specs
* deployment — multi-file specs need bundling before deployment

---

## Decision Tree

Is the spec over 1MB or does it have 100+ endpoints?
↓
YES → Multi-file spec (split by resource or domain), bundle before deployment
NO → Single-file spec (manageable for smaller APIs)

---

## Rationale

Single-file specs are simple for small APIs. Large specs become unreadable and cause merge conflicts. Multi-file specs enable team collaboration but require a bundling step (Redocly CLI, swagger-cli) before deployment.

---

## Recommended Default

**Default:** Single-file spec for APIs under 100 endpoints; multi-file for larger APIs
**Reason:** Single file is simpler; multi-file is needed for scale and team collaboration.

---

## Risks Of Wrong Choice

Single file for large API: unreadable, merge conflicts, long load times in editors. Multi-file for small API: unnecessary complexity, bundling step adds CI time.

---

## Related Rules

- Use `resource.action` operationId Convention (from 05-rules.md)

---

## Related Skills

- Implement OpenAPI Specification Generation (from 06-skills.md)

---

## Spec Delivery — Hosted Endpoint vs Downloadable File

---

## Decision Context

How should the OpenAPI spec be delivered to consumers? Arises when deciding where to serve the spec.

---

## Decision Criteria

* accessibility — consumers need to reach the spec from their tools
* security — internal API specs should not be publicly accessible
* versioning — multiple versions need clear URL mapping
* UI integration — hosted endpoint enables live Swagger UI

---

## Decision Tree

Is the API public or external-facing?
↓
YES → Hosted endpoint (`/openapi.yaml` or `/docs/openapi.yaml`) with Swagger UI
NO → Is this an internal API?
    YES → Downloadable spec from secure/internal documentation portal
    NO → Public? → Hosted endpoint with CORS headers

---

## Rationale

Hosted endpoints with Swagger UI enable interactive exploration and are the standard for public APIs. Internal APIs should serve specs through authenticated documentation portals to prevent information disclosure.

---

## Recommended Default

**Default:** Hosted endpoint at `/openapi.yaml` with Swagger UI + CORS headers
**Reason:** Immediate interactive docs for consumers; CORS enables tools like Postman to import directly.

---

## Risks Of Wrong Choice

Downloadable-only spec: consumers must manually download and import, friction in integration. Publicly accessible internal spec: security information disclosure.

---

## Related Rules

- Define All Schemas In Components With $ref References (from 05-rules.md)
- Always Include An `info.version` Matching The API Version (from 05-rules.md)

---

## Related Skills

- Implement OpenAPI Specification Generation (from 06-skills.md)
