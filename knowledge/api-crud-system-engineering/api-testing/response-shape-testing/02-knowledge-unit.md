# Response Shape Testing

## Metadata
- **Domain:** API & CRUD System Engineering
- **Subdomain:** API Testing
- **Knowledge Unit:** Response Shape Testing
- **Difficulty Level:** Intermediate
- **Last Updated:** 2026-06-02

---

## Executive Summary
Response shape tests assert the JSON structure of API responses — the keys, types, nesting, and optional fields returned by each endpoint. Unlike content tests (which assert specific values), shape tests validate the contract's skeleton. Laravel's `assertJsonStructure` is the primary tool, accepting nested arrays with `*` for wildcard collections and `$key => $type` for optional constraints. Shape tests catch accidental contract breaks like renamed fields, removed keys, or changed nesting.

---

## Core Concepts
`assertJsonStructure` accepts an array that mirrors the expected JSON structure. Each key in the array asserts that key exists in the response; nested arrays assert sub-objects; `*` asserts each item in an array has the given structure. Combine with `assertJsonCount` to verify array lengths. For optional fields, use separate tests or conditional assertions. Types can be asserted via `assertJsonStructure(['id' => 'integer', 'title' => 'string'])` using the optional type parameter. Also test resource-specific shapes: paginated responses (meta, links), error responses (message, errors), and relationship-loaded responses (include'd relations).

---

## Mental Models
Response shape testing is **contract blueprinting** — like an architect verifying the building was built to the blueprint before inspecting the paint color (content). The blueprint lists: "wall here, door there, window there." Shape tests ensure the response's structure matches the published contract, regardless of the data values.

---

## Internal Mechanics
`TestResponse::assertJsonStructure(array $structure)` uses `Illuminate\Testing\Assert::assertArraySubset` recursively. The structure array is compiled into an expected key tree; the actual response is decoded and checked for key presence at each nesting level. The `*` wildcard iterates over each element of a JSON array and asserts the substructure against every element. The optional type assertion (`['id' => 'integer']`) uses PHP's `gettype()` internally. The method does not assert value presence or absence — only key structure.

---

## Patterns
- **Structure per resource type**: Define a `postStructure()` helper returning the expected keys, reuse across show/index/store tests.
- **Deep nesting**: Test paginated responses with `['data' => ['*' => ['id', 'title']], 'meta' => ['current_page', 'last_page']]`.
- **Versioned shape tests**: Maintain separate structure expectations per API version.
- **Break shape tests into layers**: Top-level keys, then data wrapper, then resource attributes, then nested relations.
- **Type assertions for strict APIs**: Use `string`, `integer`, `array` type constraints in structure definitions.

---

## Architectural Decisions
Shape testing is separated from content testing because the two catch different bug classes. Content tests catch wrong values; shape tests catch missing/renamed keys. Combining them in the same test forces tests to fail for the wrong reason: a renamed key is a different concern from a wrong value. Separating them provides clearer failure diagnostics.

---

## Tradeoffs
| Tradeoff | Shape Test | Content Test |
|---|---|---|
| Catches | Missing/renamed keys | Wrong values |
| Brittleness | Low (structure stable) | Medium (value changes) |
| Maintenance | Low (only structure changes) | Higher (data changes) |
| Assertion | `assertJsonStructure` | `assertJson`, `assertExactJson` |

---

## Performance Considerations
Shape tests are fast — they decode the response JSON and walk the key tree once. They don't query the database beyond the initial request. Bundle all shape assertions into a single test method per endpoint to minimize kernel boots. Separate shape tests for optional fields (loaded relations, sparse fields) into their own methods.

---

## Production Considerations
Publish response shape as part of your API documentation (OpenAPI spec). Shape tests should directly mirror the OpenAPI response schemas. In CI, fail the build if any shape test breaks — shape changes are contract breaks requiring version bumps. Use `assertJsonStructure` as the first assertion in every happy path test to catch contract breaks early.

---

## Common Mistakes
- Using `assertJsonStructure` where `assertExactJson` is needed (shape tests are structural, not exhaustive).
- Forgetting `*` wildcard on collection endpoints — flat structure assertion fails on arrays.
- Asserting shapes for optional relations that aren't always loaded.
- Using shape tests to validate values (use `assertJson` or `assertJsonFragment` for that).

---

## Failure Modes
- **Key rename**: `assertJsonStructure(['name', 'email'])` — if `name` becomes `full_name`, the test fails cleanly.
- **Missing wrapper**: Response changes from `{"data": {...}}` to `{...}` — the test catches the missing `data` key.
- **Unstable optional fields**: Relationship loaded conditionally — shape test expects the relation key but it's missing. Use conditional shape assertions based on request parameters.

---

## Ecosystem Usage
Laravel API Resources define response shapes via `toArray()` methods. Spatie's `laravel-json-api-paginate` returns a consistent paginated shape. Fractal transformers define shapes via `transform()` — shape tests verify the transformer output structure.

---

## Related Knowledge Units
### Prerequisites
- happy-path-testing (where shape assertions are used)
- Laravel API Resources (shape definition)

### Related Topics
- response-status-code-testing (combined status + shape assertions)
- pagination-response-testing (paginated shape specifics)
- error-response-shape-testing (error shape specifics)

### Advanced Follow-up Topics
- JSON:API spec shape conformance testing
- OpenAPI schema validation in tests
- Sparse fieldsets and shape flexibility

---

## Research Notes
### Source Analysis
`Illuminate\Testing\TestResponse::assertJsonStructure()` accepts `array $structure` and optional `$negate`. The implementation is in `Illuminate\Testing\Assert::assertArraySubset()` which recursively validates key presence.
### Key Insight
Shape tests are cheaper and more stable than value tests — structure changes infrequently while data changes constantly. Prioritize shape coverage over value coverage for contract stability.
### Version-Specific Notes
`assertJsonStructure` supports type assertions since Laravel 8.x. The wildcard `*` supports nesting since Laravel 5.5. PestPHP wraps the same underlying implementation.
