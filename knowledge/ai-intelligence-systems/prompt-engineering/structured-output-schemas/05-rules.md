---
id: KU-033 (Prompt Eng)
title: "Structured Output Schemas - Rules"
subdomain: "prompt-engineering"
ku-type: "implementation"
date-created: "2026-06-02"
---

## Rules for Structured Output Schemas

### R1: Define output schemas in code (PHP classes/DTOs) and generate JSON Schema automatically
- **Category:** Maintainability
- **Rule:** Define structured output schemas as PHP DTOs (e.g., Spatie Data, native readonly classes) with typed properties; generate JSON Schema from these classes for LLM providers; never write JSON Schema by hand.
- **Reason:** Hand-written JSON Schema drifts from the actual DTO structure over time. Generating schema from code ensures the schema always matches the expected PHP objects.
- **Bad Example:** A hand-written JSON Schema for `extractProductInfo` that has `price` as a string, but the PHP `ProductInfo` DTO expects `price` as a float — mismatches cause runtime errors.
- **Good Example:** A `ProductInfo` Spatie Data class; a `SchemaGenerator` auto-derives the JSON Schema from the class's type annotations and attributes.
- **Exceptions:** When the LLM provider requires schema input that cannot be auto-generated.
- **Consequences of Violation:** Schema-code drift causes validation failures, runtime type errors, or silently incorrect data when mismatched types are coerced.

### R2: Never use nullable fields in output schemas — require explicit values or sentinel types
- **Category:** Reliability
- **Rule:** Define all schema fields as required with clear value types; avoid nullable fields; use explicit sentinel values or specific schemas for optional data; never accept null in structured outputs.
- **Reason:** LLMs produce null unpredictably — a nullable field may be null 30% of the time for no clear reason. Null values in structured outputs propagate to downstream logic that must handle them, increasing complexity.
- **Bad Example:** `product.price` defined as `number | null` — the LLM returns null for price 20% of the time, causing downstream calculations to produce "null" prices.
- **Good Example:** `product.price` is a required `number` with `min: 0`. If there's truly no price, `product.pricingType` enum is used with `pricingType: "free"` or `pricingType: "contact_us"`.
- **Exceptions:** Data migration or partial extraction schemas where null is an intentional signal.
- **Consequences of Violation:** Downstream systems must handle null everywhere, increasing code complexity and error surface; nulls propagate silently, causing subtle bugs in calculations, displays, and data exports.

### R3: Define explicit error schemas alongside success schemas for every LLM operation
- **Category:** Reliability
- **Rule:** For every structured output operation, define both a success schema and an error schema (with `error: true` discriminant and `errorMessage: string`); never assume the LLM always succeeds.
- **Reason:** LLMs can refuse, apologize, or explain reasons for not completing a task. Without an error schema, the model may return a success-format response with "I can't answer this" in a content field, breaking downstream logic.
- **Bad Example:** An extraction DTO that only defines extracted fields — the LLM returns `{ "title": null, "price": null, "explanation": "Could not find product" }`.
- **Good Example:** A discriminated union: `{ "success": true, "data": ProductInfo }` or `{ "success": false, "errorCode": "NOT_FOUND", "errorMessage": "..." }`. The model is instructed to use the error variant when it cannot extract data.
- **Exceptions:** Non-structured (free-text) output modes.
- **Consequences of Violation:** Success-format responses with null/invalid data or apology text parsed as valid data; downstream systems make decisions based on extracted non-information.
