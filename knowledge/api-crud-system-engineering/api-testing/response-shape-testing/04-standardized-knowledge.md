# ECC Standardized Knowledge — Response Shape Testing

## Metadata

| Field | Value |
|-------|-------|
| Domain | API & CRUD System Engineering |
| Subdomain | API Testing |
| Knowledge Unit | Response Shape Testing |
| Difficulty | Intermediate |
| Category | Testing |
| Last Updated | 2026-06-02 |

## Overview

Response shape tests assert the JSON structure of API responses — keys, types, nesting, and optional fields. Unlike content tests (which assert specific values), shape tests validate the contract's skeleton. `assertJsonStructure` is the primary tool, accepting nested arrays with `*` for wildcard collections. Shape tests catch accidental contract breaks like renamed fields, removed keys, or changed nesting. They are cheaper and more stable than value tests.

## Core Concepts

- **assertJsonStructure**: Accepts an array mirroring expected JSON structure. Validates key presence at each nesting level.
- **Wildcard `*`**: Iterates over each element of a JSON array and asserts substructure against every element.
- **Type assertions**: `assertJsonStructure(['id' => 'integer'])` — uses `gettype()` internally.
- **Per-resource-type structure helpers**: Define `postStructure()` returning expected keys, reuse across tests.
- **Layered structure testing**: Top-level keys, then data wrapper, then resource attributes, then nested relations.
- **Structure vs content separation**: Shape tests catch missing/renamed keys; content tests catch wrong values.

## When To Use

- Every happy path test (first assertion after status check)
- Contract verification before publishing API changes
- Regression testing for API Resource changes
- OpenAPI spec compliance validation

## When NOT To Use

- Value assertions (use `assertJson` or `assertExactJson`)
- Error response structure (covered by Error Response Shape Testing)
- Pagination-specific structure (covered by Pagination Response Testing)

## Best Practices

- **Assert structure before content**: Status code first, then shape, then values.
- **Define per-resource-type structure helpers**: Reuse across show/index/store tests.
- **Test deep nesting explicitly**: Paginated responses need `['data' => ['*' => [...]], 'meta' => [...], 'links' => [...]]`.
- **Versioned shape tests**: Maintain separate structure expectations per API version.
- **Break shape tests into layers**: Top-level -> data wrapper -> resource attributes -> nested relations.
- **Use type assertions for strict APIs**: `string`, `integer`, `array` constraints in structure definitions.

## Architecture Guidelines

- Shape tests directly mirror OpenAPI response schemas.
- Fail CI if any shape test breaks — shape changes are contract breaks requiring version bumps.
- Shape tests catch accidental contract breaks before they reach consumers.
- Conditional shape assertions for optional fields (loaded relations, sparse fields).

## Performance Considerations

- Shape tests are fast — decode JSON and walk key tree once.
- Bundle all shape assertions into one test method per endpoint to minimize kernel boots.
- Separate shape tests for optional fields into their own methods.

## Security Considerations

- Shape tests verify no unexpected keys are exposed in responses.
- Can detect accidental exposure of internal fields (password hashes, pivot data).

## Common Mistakes

- Using `assertJsonStructure` where `assertExactJson` is needed (structural vs exhaustive).
- Forgetting `*` wildcard on collection endpoints.
- Asserting shapes for optional relations that aren't always loaded.
- Using shape tests to validate values (use `assertJson` for that).

## Anti-Patterns

- **No shape assertions on happy path tests**: Response may return wrong keys but still pass.
- **Brittle shape tests with exact nesting on optional fields**: Use conditional assertions.

## Examples

- Single resource: `$response->assertJsonStructure(['data' => ['id', 'title', 'body', 'created_at']])`.
- Collection: `$response->assertJsonStructure(['data' => ['*' => ['id', 'title']]])`.
- Paginated: `$response->assertJsonStructure(['data' => ['*' => ['id']], 'meta' => ['current_page', 'last_page', 'per_page', 'total'], 'links' => ['first', 'last', 'prev', 'next']])`.

## Related Topics

- **Prerequisites**: Happy Path Testing, Laravel API Resources
- **Closely Related**: Response Status Code Testing, Pagination Response Testing, Error Response Shape Testing
- **Advanced**: JSON:API spec shape conformance testing, OpenAPI schema validation in tests, Sparse fieldsets and shape flexibility

## AI Agent Notes

When doing response shape testing: assert structure before content, use assertJsonStructure with wildcards for collections, define per-resource structure helpers, version shape expectations per API version, test deep nesting explicitly, use type assertions for strict APIs, make shape tests mirror OpenAPI schemas.

## Verification

Sources: `Illuminate\Testing\TestResponse::assertJsonStructure`, `Illuminate\Testing\Assert::assertArraySubset`, domain-analysis.md.
