# Decision Trees — Request Lifecycle Complete Flow

## Tree 1: Debugging Focus

**Decision Context**: Identifying which layer in the request lifecycle is causing unexpected behavior — used when debugging.

**Decision Criteria**:
- Response type (error vs success vs wrong data)
- Error code
- Expected vs actual data shape

**Decision Tree**:
```
Is the response an HTTP error (4xx/5xx)?
├── YES → Is the error 401/403?
│   ├── YES → Check middleware first — auth or authorization rejection
│   └── NO → Is the error 422?
│       ├── YES → Check FormRequest validation — input validation failure
│       └── NO → Is the error 404/405?
│           ├── YES → Check router and route model binding — URI mismatch or model not found
│           └── NO → Check action/service execution — exception thrown in business logic
└── NO → Is the response 2xx but with wrong data?
    ├── YES → Check DTO construction first — was the DTO populated correctly?
    │   If DTO correct → Check action/service logic — is the wrong query/data being used?
    └── NO → Is the response 2xx with correct data but wrong format?
        ├── YES → Check response serialization — resource/transformer mapping issue
        └── NO → Check all layers in flow order: middleware → route → controller → DTO → action → response
```

**Rationale**: Error codes narrow down the layer quickly. Data issues follow the data flow: DTO → action → response.

**Recommended Default**: Start at middleware for auth errors, FormRequest for validation errors, DTO for data issues, action for logic issues, response for format issues.

**Risks**: Debugging the wrong layer wastes time. Skipping the DTO check assumes data arrival is correct when it may have been transformed incorrectly.

---

## Tree 2: New Endpoint Layer Placement

**Decision Context**: Determining which layer should handle each concern when designing a new endpoint.

**Decision Criteria**:
- Concern type (HTTP, validation, business logic, data access, response formatting)
- Existing patterns in the codebase
- Reuse potential

**Decision Tree**:
```
Is the concern related to HTTP protocol (status codes, headers, content negotiation)?
├── YES → Controller — HTTP concerns belong in the controller
└── NO → Is the concern related to input validation or sanitization?
    ├── YES → FormRequest or DTO — validation belongs before business logic
    └── NO → Is the concern a business rule or decision?
        ├── YES → Action or Service — business logic belongs in the business layer
        └── NO → Is the concern related to data storage or retrieval?
            ├── YES → Repository or Eloquent model — data access belongs in the persistence layer
            └── NO → Is the concern related to response formatting?
                ├── YES → API Resource or response factory — formatting belongs near the controller
                └── NO → Assign to the most appropriate layer by elimination
```

**Rationale**: Each layer has a distinct responsibility. Assigning each concern to its correct layer prevents architecture collapse.

**Recommended Default**: Follow the flow order: FormRequest → DTO → Action/Service → Response. Place each concern at the layer whose responsibility it matches.

**Risks**: Misplaced business logic in controllers creates untestable HTTP-coupled code. Misplaced formatting in actions creates HTTP awareness in the business layer.
