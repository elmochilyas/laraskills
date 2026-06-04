# Decision Trees: HTTP Endpoint Assertions

## Tree 1: Assertion Type Selection

```
What are you testing?
├── Response status code
│   ├── Success (200, 201, 204) → Assert exact code: assertStatus(201)
│   ├── Client error (400, 401, 403, 404, 422) → Assert exact code: assertStatus(422)
│   └── Server error (500) → Assert exact code: assertStatus(500)
├── Response body structure
│   ├── Full contract validation → assertJsonStructure([...]) with nested arrays
│   ├── Specific data values → assertJsonFragment(['key' => 'value'])
│   ├── Exact match required → assertExactJson([...]) — use sparingly
│   └── Field absence → assertJsonMissing(['sensitive_field'])
├── Response headers
│   ├── Content type → assertHeader('Content-Type', 'application/json')
│   ├── API version → assertHeader('X-Api-Version', '2')
│   ├── Deprecation → assertHeader('Deprecation', 'true')
│   ├── Rate limit → assertHeaderMissing('X-RateLimit-Remaining') or assertHeader
│   ├── Caching → assertHeader('Cache-Control', 'no-cache')
│   └── Security → assertHeader('X-Frame-Options', 'DENY')
└── Error envelope
    ├── Validation error → assertJsonStructure(['error' => ['code', 'message', 'details']])
    ├── Auth error → assertJsonStructure(['error' => ['code', 'message']])
    └── Server error → assertJsonFragment(['error' => ['code' => 'SERVER_001']])
```

## Tree 2: What To Test For Each Endpoint

```
Is this a new endpoint or existing?
├── New endpoint
│   ├── Happy path (200/201) → Status + structure + data + headers
│   ├── Unauthenticated (401) → Status + error envelope
│   ├── Forbidden (403) → Status + error envelope if applicable
│   ├── Validation errors (422) → Status + error envelope with details
│   ├── Not found (404) → Status + error envelope
│   └── Boundary conditions → Empty results, max/min values
└── Existing endpoint (adding tests)
    ├── Regression path → Status + critical data assertions
    ├── Recently changed behavior → Full assertion suite
    └── Previously untested → Full assertion suite
```

## Tree 3: Response Verification Depth

```
How stable is the response format?
├── Stable, documented API contract → Full structure + data + header assertions
├── In development, format may change → Structure assertions only (no exact data)
├── Experimental endpoint → Status + critical data only
└── Deprecated endpoint → Status + deprecation header present
```
